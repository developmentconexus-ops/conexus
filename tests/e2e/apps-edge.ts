import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { pathToFileURL } from 'node:url'
import type { Row, Statement } from '@conexus/app-contract'
import { appLoginPassword } from '@conexus/hub-api'
import pg from 'pg'
import example from '../../apps/edge/example/src/index.ts'
import type { DbProps } from '../../apps/edge/src/db.ts'
import { serveDispatch } from '../../apps/edge/src/dispatch.ts'
import type { DatabaseUrl } from '../../apps/server/src/platform/database.ts'
import { threads } from './app-threads.ts'

// The apps' side of the journey without Cloudflare: its API of memory at its HTTP door, the
// namespace running the Workers uploaded there, and each version's `db` on the test server as
// Neon's proxy runs it (testing T14, T16).

type Asset = { bytes: Buffer; mediaType: string }
type Worker = { main: Buffer; assets: Map<string, Asset>; cpuMs: number }
type Manifest = Record<string, { hash: string }>

type Memory = {
  workers: Map<string, Worker>
  blobs: Map<string, Asset>
  sessions: Map<string, Manifest>
  bearers: Set<string>
}
type ApiReply = [status: number, body: unknown]

/**
 * A Worker uploaded without `limits.cpu_ms` runs to Workers' default of 30 s. The CPU limit is the
 * upload's alone: a call's `cpuMs` did not cut a loop on v0.10.0 (step 10's use script, step 4).
 */
const WORKERS_DEFAULT_CPU_MS = 30_000
const NO_SCRIPT: ApiReply = [
  404,
  { success: false, errors: [{ code: 10_007 }], messages: [], result: null },
]
const SCRIPT = /\/workers\/dispatch\/namespaces\/[^/]+\/scripts\/([^/]+)(\/.*)?$/

function ok(result: unknown): ApiReply {
  return [200, { success: true, errors: [], messages: [], result }]
}

/** One bucket of static files, under the session's token; the answer is the completion token. */
async function storeAssets(memory: Memory, request: Request, bearer: string): Promise<ApiReply> {
  if (!memory.sessions.has(bearer)) return [401, { success: false, errors: [{ code: 10_000 }] }]
  for (const [hash, file] of await request.formData()) {
    assert.ok(file instanceof File)
    memory.blobs.set(hash, {
      bytes: Buffer.from(await file.text(), 'base64'),
      mediaType: file.type,
    })
  }
  return [201, { success: true, errors: [], messages: [], result: { jwt: `done-${bearer}` } }]
}

/** The session asks for the files it does not hold yet, in one bucket. */
async function openSession(memory: Memory, request: Request): Promise<ApiReply> {
  const { manifest } = Object(await request.json())
  const jwt = `upload-${memory.sessions.size + 1}`
  memory.sessions.set(jwt, manifest)
  memory.sessions.set(`done-${jwt}`, manifest)
  const missing = Object.values<{ hash: string }>(manifest)
    .map(({ hash }) => hash)
    .filter((hash) => !memory.blobs.has(hash))
  // The shape Cloudflare's direct-upload guide documents for the session: `errors` is null.
  const result = { jwt, buckets: missing.length === 0 ? [] : [missing] }
  return [200, { result, success: true, errors: null, messages: null }]
}

/**
 * Cloudflare runs a script's top level on upload and refuses one that throws, in the shape record
 * 0047 saw: 400, the four envelope fields, code 10021 with the exception, and nothing stored.
 */
async function startsUp(main: Buffer): Promise<ApiReply | undefined> {
  const folder = mkdtempSync(join(tmpdir(), 'conexus-startup-'))
  try {
    const file = join(folder, 'index.mjs')
    writeFileSync(file, main)
    await import(pathToFileURL(file).href)
    return undefined
  } catch (error) {
    const message = `Uncaught Error: ${Object(error).message}\n  at index.js\n`
    const documentation_url =
      'https://developers.cloudflare.com/workers/observability/errors/#validation-errors-10021'
    return [
      400,
      {
        success: false,
        errors: [{ code: 10_021, message, documentation_url }],
        messages: [],
        result: null,
      },
    ]
  } finally {
    rmSync(folder, { recursive: true, force: true })
  }
}

/** The script's module and metadata; its static files are the ones its completion token names. */
async function putScript(memory: Memory, request: Request, worker: string): Promise<ApiReply> {
  const form = await request.formData()
  const metadata = JSON.parse(String(await Object(form.get('metadata')).text()))
  const main = form.get(metadata.main_module)
  assert.ok(main instanceof File)
  const bytes = Buffer.from(await main.arrayBuffer())
  const refused = await startsUp(bytes)
  if (refused !== undefined) return refused
  const assets = new Map<string, Asset>()
  for (const [path, { hash }] of Object.entries(memory.sessions.get(metadata.assets?.jwt) ?? {})) {
    const blob = memory.blobs.get(hash)
    assert.ok(blob, `the asset ${path} was never uploaded`)
    assets.set(path, blob)
  }
  const cpuMs = Number(metadata.limits?.cpu_ms ?? WORKERS_DEFAULT_CPU_MS)
  memory.workers.set(worker, { main: bytes, assets, cpuMs })
  return ok({ id: worker })
}

async function answer(memory: Memory, request: Request, bearer: string): Promise<ApiReply> {
  const { pathname } = new URL(request.url)
  if (pathname.endsWith('/workers/assets/upload')) return storeAssets(memory, request, bearer)
  memory.bearers.add(bearer)
  const [, worker = '', tail] = pathname.match(SCRIPT) ?? []
  if (tail === '/assets-upload-session') return openSession(memory, request)
  if (request.method === 'PUT') return putScript(memory, request, worker)
  if (request.method === 'DELETE') return memory.workers.delete(worker) ? ok(null) : NO_SCRIPT
  return memory.workers.has(worker) ? ok({ script: { id: worker } }) : NO_SCRIPT
}

/** Cloudflare's API of memory behind a port: the asset upload, then a script's put, read and delete. */
export async function cloudflareServer(t: TestContext) {
  const memory: Memory = {
    workers: new Map(),
    blobs: new Map(),
    sessions: new Map(),
    bearers: new Set(),
  }
  const server = createServer((request, response) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.on('end', async () => {
      const received = new Request(new URL(request.url ?? '', 'http://cloudflare.example.test'), {
        method: request.method,
        headers: { 'content-type': request.headers['content-type'] ?? '' },
        body: request.method === 'GET' ? undefined : new Uint8Array(Buffer.concat(chunks)),
      })
      const bearer = (request.headers.authorization ?? '').replace(/^Bearer /, '')
      const [status, body] = await answer(memory, received, bearer)
      response.writeHead(status, { 'content-type': 'application/json' })
      response.end(JSON.stringify(body))
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => {
    server.closeAllConnections()
    server.close()
  })
  const address = server.address()
  assert.ok(address !== null && typeof address === 'object')
  return {
    url: `http://127.0.0.1:${address.port}/client/v4`,
    workers: () => [...memory.workers.keys()].sort(),
    worker: (name: string) => memory.workers.get(name),
    /** Every bearer the scripts' calls carried: the Hub's token alone. */
    bearers: () => [...memory.bearers],
  }
}

type Cloudflare = Awaited<ReturnType<typeof cloudflareServer>>

/** One run of the statements in one transaction, as Neon's HTTP proxy runs a request. */
async function inTransaction(
  url: string,
  statements: readonly Statement[],
  readOnly: boolean,
): Promise<{ results: { rows: Row[] }[] } | { error: { code: string } }> {
  const client = new pg.Client({ connectionString: url })
  try {
    await client.connect()
    await client.query(readOnly ? 'BEGIN READ ONLY' : 'BEGIN')
    const results: { rows: Row[] }[] = []
    for (const statement of statements) {
      const answer = await client.query<Row>(statement.text, [...(statement.values ?? [])])
      results.push({ rows: answer.rows })
    }
    await client.query('COMMIT')
    return { results }
  } catch (error) {
    return { error: { code: error instanceof pg.DatabaseError ? (error.code ?? '') : '08000' } }
  } finally {
    await client.end().catch(() => undefined)
  }
}

/**
 * The dispatcher's `Db` export on the test server: the login the call names, with the password
 * derived from the dispatcher's key, so a Hub that set another password fails here (decision 0043).
 */
export function dbExport(owner: DatabaseUrl, key: string) {
  return {
    Db({ props }: { props: DbProps }) {
      async function urlOf() {
        const url = new URL(owner.reveal())
        url.username = props.login
        url.password = await appLoginPassword({ key, login: props.login })
        return url.toString()
      }
      return {
        async query(text: string, values: readonly unknown[] = []) {
          const answer = await inTransaction(await urlOf(), [{ text, values }], true)
          return 'error' in answer ? answer : { rows: answer.results[0]?.rows ?? [] }
        },
        async batch(statements: readonly Statement[]) {
          return inTransaction(await urlOf(), statements, false)
        },
      }
    },
  }
}

type Props = Parameters<typeof example.fetch>[2]['props']

/** The namespace: the example, or the uploaded Worker with its static files served first. */
export function namespace(t: TestContext, cloudflare: Cloudflare) {
  const serve = threads(t)
  return {
    get(name: string, args: { props: Props }) {
      if (name === 'conexus-example') {
        return { fetch: async (request: Request) => example.fetch(request, {}, args), connect }
      }
      const worker = cloudflare.worker(name)
      if (worker === undefined) throw new Error(`Worker not found: ${name}`)
      return {
        async fetch(request: Request) {
          const { pathname } = new URL(request.url)
          const asset = worker.assets.get(pathname === '/' ? '/index.html' : pathname)
          if (asset !== undefined && request.method === 'GET') {
            return new Response(new Uint8Array(asset.bytes), {
              headers: { 'content-type': asset.mediaType },
            })
          }
          return serve(name, worker, request, args.props)
        },
        connect,
      }
    },
  }
}

function connect(): Socket {
  throw new Error('no app opens a socket')
}

/** The cookies a browser keeps for one host, changed by each answer's `Set-Cookie`. */
export class Jar {
  cookies = new Map<string, string>()
  absorb(headers: Headers) {
    for (const line of headers.getSetCookie()) {
      const [pair = '', ...attributes] = line.split(';')
      const at = pair.indexOf('=')
      const name = pair.slice(0, at)
      const gone = pair.slice(at + 1) === '' || attributes.some((a) => a.trim() === 'Max-Age=0')
      if (gone) this.cookies.delete(name)
      else this.cookies.set(name, pair.slice(at + 1))
    }
  }
  header() {
    return [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; ')
  }
  copy() {
    const jar = new Jar()
    jar.cookies = new Map(this.cookies)
    return jar
  }
}

// The dispatcher's wrangler vars type its domains as literals, so its requests name them; the
// Hub's own address for a Projeto (`apps.example.test`) is checked where it is made.
const EDGE_DOMAIN = 'conexusapp.tech'
const EDGE_HUB = 'https://hub.conexus.fun'

/** The dispatcher's bindings: the Hub's edge port, and the namespace of the uploaded Workers. */
export function edgeEnv(edgePort: number, key: string, workers: Env['DISPATCHER']) {
  return {
    HUB_PUBLIC_ORIGIN: EDGE_HUB,
    APPS_DOMAIN: EDGE_DOMAIN,
    APP_LOGIN_KEY: key,
    HUB: {
      fetch(input: RequestInfo | URL, init?: RequestInit) {
        const url = new URL(new Request(input).url)
        return globalThis.fetch(`http://127.0.0.1:${edgePort}${url.pathname}${url.search}`, init)
      },
      connect(): Socket {
        throw new Error('the dispatcher never opens a socket to the Hub')
      },
    },
    DISPATCHER: workers,
  } satisfies Env
}

export type Reply = { status: number; headers: Headers; text: string }

/**
 * One request of a browser to an app's host, through the real dispatcher in this process; redirects
 * are not followed, and the jar keeps the cookies.
 */
export async function visitApp(
  door: { env: Env; exports: Parameters<typeof serveDispatch>[2]; label: string },
  jar: Jar,
  path: string,
  body?: unknown,
): Promise<Reply> {
  const origin = `https://${door.label}.${EDGE_DOMAIN}`
  const headers = new Headers()
  if (jar.header() !== '') headers.set('Cookie', jar.header())
  // A page's own call to its app, as the browser sends it.
  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
    headers.set('Origin', origin)
  }
  const request = new Request(`${origin}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: 'manual',
  })
  const response = await serveDispatch(request, door.env, door.exports)
  jar.absorb(response.headers)
  return { status: response.status, headers: response.headers, text: await response.text() }
}

export { EDGE_HUB }
