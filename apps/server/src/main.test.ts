import assert from 'node:assert/strict'
import type { ChildProcess } from 'node:child_process'
import { spawn } from 'node:child_process'
import { on, once } from 'node:events'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { connect } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { after, before, test } from 'node:test'
import { Version } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { createStatus } from './hub/status/public.ts'
import { createHub } from './main.ts'
import type { TestDatabase } from './platform/test-database.ts'
import { createTestDatabase, freePort, urlFile } from './platform/test-database.ts'

const MAIN = join(import.meta.dirname, 'main.ts')
const apps: FastifyInstance[] = []
const children: ChildProcess[] = []
const dirs: string[] = []
let shared: TestDatabase
const cleanups: (() => Promise<void> | void)[] = []
before(async () => {
  shared = await createTestDatabase({ after: (cleanup) => cleanups.push(cleanup) })
})
after(async () => {
  for (const child of children) child.kill('SIGKILL')
  for (const app of apps) await app.close()
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
  for (const cleanup of cleanups) await cleanup()
})

async function hub(webRoot?: string) {
  const config = {
    version: Version.parse('v0.1.0'),
    port: 1,
    logLevel: 'error',
    databaseUrl: shared.runtimeUrl,
  } as const
  const status = createStatus({ version: config.version, database: shared.database })
  const app = await createHub(config, { status, webRoot })
  apps.push(app)
  return app
}

function problem(response: {
  statusCode: number
  headers: Record<string, unknown>
  json(): unknown
}) {
  const { traceId, ...rest } = withTraceId(response.json())
  assert.match(traceId, /^[0-9a-f-]{36}$/)
  assert.match(String(response.headers['content-type']), /^application\/problem\+json/)
  return rest
}

function withTraceId(value: unknown): { traceId: string } & Record<string, unknown> {
  assert.ok(typeof value === 'object' && value !== null && 'traceId' in value)
  assert.equal(typeof value.traceId, 'string')
  return { ...value, traceId: String(value.traceId) }
}

const NOT_FOUND = {
  type: 'urn:conexus:problem:NOT_FOUND',
  title: 'Não encontramos o que você procurou.',
  status: 404,
  code: 'NOT_FOUND',
}

test('saúde', async () => {
  const response = await (await hub()).inject({ method: 'GET', url: '/api/health' })
  assert.equal(response.statusCode, 200)
  assert.equal(response.body, '{"status":"LIVE"}')
})

test('caminho desconhecido responde 404 em problem+json', async () => {
  const response = await (await hub()).inject({ method: 'GET', url: '/nope' })
  assert.equal(response.statusCode, 404)
  assert.deepEqual(problem(response), NOT_FOUND)
})

test('o 404 vem antes do corpo', async () => {
  const app = await hub()
  const cases = [
    { url: '/nope', payload: '{bad' },
    { url: '/api/health', payload: '{"a":1}' },
  ]
  for (const { url, payload } of cases) {
    const response = await app.inject({
      method: 'POST',
      url,
      payload,
      headers: { 'content-type': 'application/json' },
    })
    assert.equal(response.statusCode, 404, url)
    assert.deepEqual(problem(response), NOT_FOUND)
  }
})

function raw(port: number, bytes: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let received = ''
    const socket = connect(port, '127.0.0.1', () => socket.write(bytes))
    socket.on('data', (chunk) => {
      received += chunk
    })
    socket.on('end', () => resolve(received))
    socket.on('error', reject)
  })
}

function assertSecurityHeaders(head: string) {
  assert.match(
    head,
    /\r\nContent-Security-Policy: [^\r]*script-src 'self'[^\r]*frame-ancestors 'none'/i,
  )
  assert.match(head, /\r\nReferrer-Policy: no-referrer\r\n/i)
  assert.match(head, /\r\nX-Frame-Options: DENY\r\n/i)
  assert.doesNotMatch(head, /access-control-/i)
}

const SOCKET_REFUSALS = [
  ['Content-Length errado', 'GET /api/health HTTP/1.1\r\nHost: x\r\nContent-Length: abc\r\n\r\n'],
  ['linha malformada', 'NOT A REQUEST LINE\r\n\r\n'],
] as const
for (const [name, bytes] of SOCKET_REFUSALS) {
  test(`${name} responde 400 em problem+json`, async () => {
    const app = await hub()
    await app.listen({ host: '127.0.0.1', port: 0 })
    const answer = await raw(app.addresses()[0]?.port ?? 0, bytes)
    const [head = '', body = ''] = answer.split('\r\n\r\n')
    assert.match(head, /^HTTP\/1\.1 400 Bad Request\r\nContent-Type: application\/problem\+json/)
    assertSecurityHeaders(head)
    const { traceId, ...rest } = withTraceId(JSON.parse(body))
    assert.match(traceId, /^[0-9a-f-]{36}$/)
    assert.deepEqual(rest, {
      type: 'urn:conexus:problem:REQUEST_MALFORMED',
      title: 'O Conexus não entendeu o pedido.',
      status: 400,
      code: 'REQUEST_MALFORMED',
    })
  })
}

test('HEAD só em páginas', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-web-'))
  dirs.push(dir)
  writeFileSync(join(dir, 'index.html'), '<!doctype html><title>x</title>')
  const app = await hub(dir)
  assert.equal((await app.inject({ method: 'HEAD', url: '/' })).statusCode, 200)
  assert.equal((await app.inject({ method: 'HEAD', url: '/api/status' })).statusCode, 404)
  const page = await app.inject({ method: 'GET', url: '/' })
  assert.equal(page.body, '<!doctype html><title>x</title>')
  assert.match(String(page.headers['cache-control']), /max-age=0/)
})

test('sem a página construída, / responde 404', async () => {
  const response = await (await hub(join(tmpdir(), 'conexus-no-such-web'))).inject({ url: '/' })
  assert.equal(response.statusCode, 404)
  assert.deepEqual(problem(response), NOT_FOUND)
})

test('cabeçalhos', async () => {
  const app = await hub()
  for (const url of ['/api/health', '/nope']) {
    const { headers } = await app.inject({ method: 'GET', url })
    const policy = String(headers['content-security-policy'])
    assert.match(policy, /(^|;)script-src 'self'(;|$)/)
    assert.match(policy, /(^|;)frame-ancestors 'none'(;|$)/)
    assert.doesNotMatch(policy, /unsafe-inline/)
    assert.equal(headers['referrer-policy'], 'no-referrer')
    assert.deepEqual(
      Object.keys(headers).filter((name) => name.startsWith('access-control-')),
      [],
    )
  }
})

async function startChild(t: TestContext) {
  const port = await freePort()
  const env = {
    CONEXUS_VERSION: 'v0.1.0',
    HUB_PORT: String(port),
    LOG_LEVEL: 'info',
    HUB_DATABASE_URL_FILE: urlFile(t, shared.runtimeUrl),
  }
  const child = spawn(process.execPath, [MAIN], { env, stdio: ['ignore', 'pipe', 'pipe'] })
  children.push(child)
  const lines: Record<string, unknown>[] = []
  const seen = new Map<string, PromiseWithResolvers<void>>()
  function until(message: string) {
    const waiter = seen.get(message) ?? Promise.withResolvers<void>()
    seen.set(message, waiter)
    return waiter.promise
  }
  child.stdout.on('data', (chunk: Buffer) => {
    for (const text of String(chunk).split('\n').filter(Boolean)) {
      const line = JSON.parse(text)
      lines.push(line)
      const message = String(line.msg)
      const waiter = seen.get(message) ?? Promise.withResolvers<void>()
      seen.set(message, waiter)
      waiter.resolve()
    }
  })
  const exited = new Promise<{ code: number | null; signal: string | null }>((resolve) => {
    child.on('exit', (code, signal) => resolve({ code, signal }))
  })
  await until('LISTENING')
  return { child, port, lines, exited, until }
}

test('log por pedido', async (t) => {
  const { child, port, lines, exited } = await startChild(t)
  const traceparent = '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01'
  const response = await fetch(`http://127.0.0.1:${port}/api/health`, { headers: { traceparent } })
  assert.equal(response.status, 200)
  child.kill('SIGTERM')
  await exited
  const served = lines.filter((line) => line.msg === 'REQUEST_SERVED')
  assert.equal(served.length, 1)
  const [line] = served
  assert.equal(line?.route, '/api/health')
  assert.equal(line?.status, 200)
  assert.equal(typeof line?.durationMs, 'number')
  assert.match(String(line?.traceId), /^[0-9a-f-]{36}$/)
  assert.doesNotMatch(JSON.stringify(lines), /0af7651916cd43dd8448eb211c80319c/)
})

test('desligamento', async (t) => {
  const { child, lines, exited } = await startChild(t)
  child.kill('SIGTERM')
  assert.deepEqual(await exited, { code: 0, signal: null })
  assert.equal(lines.find((line) => line.msg === 'SHUTTING_DOWN')?.signal, 'SIGTERM')
})

test('segundo sinal', async (t) => {
  const { child, port, exited, until } = await startChild(t)
  const stuck = connect(port, '127.0.0.1')
  stuck.on('error', () => stuck.destroy())
  await once(stuck, 'connect')
  stuck.write('GET /api/health HTTP/1.1\r\nHost: x\r\n')
  child.kill('SIGTERM')
  await until('SHUTTING_DOWN')
  child.kill('SIGTERM')
  assert.deepEqual(await exited, { code: 1, signal: null })
})

test('caminho com porcentagem malformada responde 400 em problem+json, com cabeçalhos e log', async (t) => {
  const { child, port, lines, exited } = await startChild(t)
  for (const path of ['/%zz', '/api/%E0%A4%A']) {
    const answer = await raw(port, `GET ${path} HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n`)
    const [head = '', body = ''] = answer.split('\r\n\r\n')
    assert.match(head, /^HTTP\/1\.1 400 Bad Request\r\n/, path)
    assert.match(head, /\r\ncontent-type: application\/problem\+json/i, path)
    assertSecurityHeaders(head)
    const { traceId, ...rest } = withTraceId(JSON.parse(body))
    assert.match(traceId, /^[0-9a-f-]{36}$/)
    assert.deepEqual(rest, {
      type: 'urn:conexus:problem:REQUEST_MALFORMED',
      title: 'O Conexus não entendeu o pedido.',
      status: 400,
      code: 'REQUEST_MALFORMED',
    })
    assert.doesNotMatch(body, /%zz|E0%A4/)
  }
  child.kill('SIGTERM')
  await exited
  const served = lines.filter((line) => line.msg === 'REQUEST_SERVED')
  assert.deepEqual(
    served.map((line) => line.status),
    [400, 400],
  )
})

const HEALTH_PIPELINE = 'GET /api/health HTTP/1.1\r\nHost: x\r\n'

test('pedido que chega a uma conexão aberta durante o desligamento é atendido, não recusado', async () => {
  const app = await hub()
  const closeStarted = Promise.withResolvers<void>()
  app.addHook('preClose', async () => closeStarted.resolve())
  await app.listen({ host: '127.0.0.1', port: 0 })
  const socket = connect(app.addresses()[0]?.port ?? 0, '127.0.0.1')
  const ended = once(socket, 'close')
  await once(socket, 'connect')
  socket.write(`${HEALTH_PIPELINE}\r\n${HEALTH_PIPELINE}`)
  let received = ''
  socket.on('data', (chunk) => {
    received += chunk
  })
  for await (const _ of on(socket, 'data')) {
    if (received.includes('{"status":"LIVE"}')) break
  }
  const closing = app.close()
  await closeStarted.promise
  socket.write('\r\n')
  await ended
  await closing
  const answers = received.split(/(?=HTTP\/1\.1 )/)
  assert.equal(answers.length, 2)
  const [head = '', body = ''] = (answers[1] ?? '').split('\r\n\r\n')
  assert.match(head, /^HTTP\/1\.1 200 OK\r\n/)
  assertSecurityHeaders(head)
  assert.equal(body, '{"status":"LIVE"}')
})
