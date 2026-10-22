import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import type { ServerResponse } from 'node:http'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { WorkerUpload } from './cloudflare.ts'
import { createCloudflareApps } from './cloudflare.ts'
import { testAppsConfig } from './test-cloudflare.ts'
import { testConfig, unreachableDatabaseUrl } from './test-database.ts'

// Cloudflare's API at its HTTP door (T14): each test names the answer, and every request is kept.
type Answer = (response: ServerResponse, path: string) => void
type Received = { method: string; path: string; authorization: string; body: Request }

async function cloudflareAt(t: TestContext, answer: Answer) {
  const paths: string[] = []
  const received: Received[] = []
  const server = createServer((request, response) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.on('end', () => {
      paths.push(`${request.method} ${request.url}`)
      received.push({
        method: request.method ?? '',
        path: request.url ?? '',
        authorization: request.headers.authorization ?? '',
        body: new Request('http://cloudflare.example.test/', {
          method: 'POST',
          headers: { 'content-type': request.headers['content-type'] ?? 'text/plain' },
          body: new Uint8Array(Buffer.concat(chunks)),
        }),
      })
      answer(response, request.url ?? '')
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => {
    server.closeAllConnections()
    server.close()
  })
  const address = server.address()
  assert.ok(address !== null && typeof address === 'object')
  const config = {
    ...testConfig(await unreachableDatabaseUrl()),
    ...testAppsConfig(`http://127.0.0.1:${address.port}/client/v4`),
  }
  const logged: unknown[] = []
  const log = { info: () => undefined, error: (fields: unknown) => logged.push(fields) }
  return { cloudflare: createCloudflareApps({ config, log }), paths, received, logged, config }
}

function json(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { 'content-type': 'application/json' })
  response.end(JSON.stringify(body))
}

const UPLOAD: WorkerUpload = {
  worker: 'v-1',
  mainModule: 'worker.js',
  compatibilityDate: '2026-10-18',
  files: [
    {
      path: 'worker.js',
      bytes: new TextEncoder().encode('export default {}'),
      mediaType: 'text/javascript',
    },
  ],
  tags: ['company-c', 'project-p'],
  cpuMs: 50,
}

test('cloudflare: uma resposta sem tamanho declarado que passa de 1 MiB é silêncio, lida só até o teto', async (t) => {
  const { cloudflare } = await cloudflareAt(t, (response) => {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.write('{"success":true,"result":"')
    response.end(`${'x'.repeat(2 * 1024 * 1024)}"}`)
  })
  assert.deepEqual(await cloudflare.exists('v-1'), { kind: 'NO_ANSWER' })
})

test('cloudflare: o código que não inicia (10021) é NOT_STARTING; outra recusa é REFUSED, registrada só pelos códigos', async (t) => {
  const errors = [[{ code: 10_021, message: 'Uncaught Error: segredo' }], [{ code: 10_000 }]]
  const { cloudflare, logged } = await cloudflareAt(t, (response) =>
    json(response, 400, { success: false, errors: errors.shift(), result: null }),
  )
  assert.deepEqual(await cloudflare.upload(UPLOAD), { kind: 'DONE', value: 'NOT_STARTING' })
  assert.deepEqual(await cloudflare.upload(UPLOAD), { kind: 'REFUSED' })
  assert.doesNotMatch(JSON.stringify(logged), /segredo/)
})

test('cloudflare: o script removido lê como ausente, e remover o que já saiu é removido', async (t) => {
  const { cloudflare, paths } = await cloudflareAt(t, (response) =>
    json(response, 404, { success: false, errors: [{ code: 10_007 }], result: null }),
  )
  assert.deepEqual(await cloudflare.exists('v-1'), { kind: 'DONE', value: false })
  assert.deepEqual(await cloudflare.remove('v-1'), { kind: 'DONE', value: 'REMOVED' })
  assert.match(
    paths[0] ?? '',
    /^GET \/client\/v4\/accounts\/a{32}\/workers\/dispatch\/namespaces\/conexus-apps-test\/scripts\/v-1$/,
  )
})

test('cloudflare: o envio com arquivos estáticos, nas formas da API, do pedido de sessão ao script', async (t) => {
  const style = new TextEncoder().encode(':root{}')
  const page = { path: 'assets/index.html', bytes: style, mediaType: 'text/html' }
  const sheet = { path: 'assets/style.css', bytes: style, mediaType: 'text/css' }
  const upload = { ...UPLOAD, files: [...UPLOAD.files, page, sheet] }
  // Each answer as Cloudflare's direct-upload guide documents it: the session's `errors` is null.
  const answers: [number, unknown][] = [
    [
      200,
      {
        result: { jwt: 'sessao', buckets: [[hashOf(page), hashOf(sheet)]] },
        success: true,
        errors: null,
        messages: null,
      },
    ],
    [201, { success: true, errors: [], messages: [], result: { jwt: 'pronto' } }],
    [200, { success: true, errors: [], messages: [], result: { id: 'v-1' } }],
  ]
  const { cloudflare, received, config } = await cloudflareAt(t, (response) => {
    const [status, body] = answers.shift() ?? [500, {}]
    json(response, status, body)
  })
  assert.deepEqual(await cloudflare.upload(upload), { kind: 'DONE', value: 'UPLOADED' })
  const [session, bucket, script] = received
  const token = `Bearer ${config.cloudflareAppsToken.reveal()}`
  assert.match(session?.path ?? '', /\/scripts\/v-1\/assets-upload-session$/)
  assert.equal(session?.authorization, token)
  assert.deepEqual(await session?.body.json(), {
    manifest: {
      '/index.html': { hash: hashOf(page), size: style.byteLength },
      '/style.css': { hash: hashOf(sheet), size: style.byteLength },
    },
  })
  // The same bytes under two types are two files, as Cloudflare's direct-upload guide hashes them.
  assert.notEqual(hashOf(page), hashOf(sheet))
  assert.equal(
    bucket?.path,
    `/client/v4/accounts/${'a'.repeat(32)}/workers/assets/upload?base64=true`,
  )
  assert.equal(bucket?.authorization, 'Bearer sessao')
  const parts = await bucket?.body.formData()
  assert.equal(await Object(parts?.get(hashOf(page))).text(), Buffer.from(style).toString('base64'))
  assert.equal(script?.method, 'PUT')
  assert.equal(script?.authorization, token)
  const form = await script?.body.formData()
  assert.deepEqual(JSON.parse(await Object(form?.get('metadata')).text()), {
    main_module: 'worker.js',
    compatibility_date: '2026-10-18',
    bindings: [],
    assets: {
      jwt: 'pronto',
      config: { run_worker_first: false, not_found_handling: 'single-page-application' },
    },
    limits: { cpu_ms: 50 },
    tags: ['company-c', 'project-p'],
  })
  assert.equal(await Object(form?.get('worker.js')).text(), 'export default {}')
})

/** Cloudflare's direct-upload hash: the SHA-256 of the base64 and the extension, 32 hex digits. */
function hashOf(file: { path: string; bytes: Uint8Array }): string {
  const extension = file.path.split('.').at(-1) ?? ''
  const base64 = Buffer.from(file.bytes).toString('base64')
  return createHash('sha256').update(`${base64}${extension}`).digest('hex').slice(0, 32)
}

test('cloudflare: um envelope fora do formato é silêncio, e o registro diz qual campo, nunca o valor', async (t) => {
  const { cloudflare, logged } = await cloudflareAt(t, (response) =>
    json(response, 200, { success: 'sim', errors: 'nenhum', result: null }),
  )
  assert.deepEqual(await cloudflare.remove('v-1'), { kind: 'NO_ANSWER' })
  assert.deepEqual(logged, [{ reason: 'unreadable', status: 200, fields: 'success,errors' }])
})

test('cloudflare: dois baldes, o primeiro sem token; o Worker leva o token do último', async (t) => {
  const style = new TextEncoder().encode(':root{}')
  const page = { path: 'assets/index.html', bytes: style, mediaType: 'text/html' }
  const sheet = { path: 'assets/style.css', bytes: style, mediaType: 'text/css' }
  const buckets = [[hashOf(page)], [hashOf(sheet)]]
  const answers: [number, unknown][] = [
    [200, { result: { jwt: 'sessao', buckets }, success: true, errors: null, messages: null }],
    [202, { success: true, errors: [], messages: [], result: { jwt: null } }],
    [201, { success: true, errors: [], messages: [], result: { jwt: 'pronto' } }],
    [200, { success: true, errors: [], messages: [], result: { id: 'v-1' } }],
  ]
  const { cloudflare, received } = await cloudflareAt(t, (response) => {
    const [status, body] = answers.shift() ?? [500, {}]
    json(response, status, body)
  })
  const upload = { ...UPLOAD, files: [...UPLOAD.files, page, sheet] }
  assert.deepEqual(await cloudflare.upload(upload), { kind: 'DONE', value: 'UPLOADED' })
  const form = await received[3]?.body.formData()
  const metadata = JSON.parse(await Object(form?.get('metadata')).text())
  assert.equal(metadata.assets.jwt, 'pronto')
})
