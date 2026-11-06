import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { ToolCallKey, ToolVersionId } from '@conexus/hub-api'
import { createEdgeTools } from './edge-tools.ts'
import { testAppsConfig, toolsAt } from './test-cloudflare.ts'

// The tools' host at its HTTP door (T14): each test names the answer, and every request is kept.
type Answer = (response: ServerResponse) => void
const EDGE_DEADLINE_MS = 50

async function edgeAt(t: TestContext, answer: Answer) {
  const received: { request: IncomingMessage; body: string }[] = []
  const server = createServer(async (request, response) => {
    let body = ''
    for await (const chunk of request) body += chunk
    received.push({ request, body })
    answer(response)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => {
    server.closeAllConnections()
    server.close()
  })
  const address = server.address()
  assert.ok(address !== null && typeof address === 'object')
  const config = { ...testAppsConfig(), toolsOrigin: toolsAt(`http://127.0.0.1:${address.port}`) }
  const logged: unknown[] = []
  const log = { info: () => undefined, error: (fields: unknown) => logged.push(fields) }
  const edge = createEdgeTools({ config, log, edgeDeadlineMs: EDGE_DEADLINE_MS })
  const toolVersionId = ToolVersionId.parse(randomUUID())
  const call = ToolCallKey.parse(randomUUID())
  return {
    received,
    logged,
    toolVersionId,
    call: (signal?: AbortSignal) => edge.call({ toolVersionId, call, input: { mes: 9 }, signal }),
    /** No log line carries either half of the service token (S36). */
    tokenLeft() {
      const text = JSON.stringify(logged)
      const { clientId, clientSecret } = config.toolsAccess
      return text.includes(clientId.reveal()) || text.includes(clientSecret.reveal())
    },
    config,
    callKey: call,
  }
}

function json(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { 'content-type': 'application/json' }).end(JSON.stringify(body))
}

test('a borda responde: a resposta dela, com o token só nos cabeçalhos e só o id no caminho', async (t) => {
  const on = await edgeAt(t, (response) => json(response, 200, { kind: 'OK', value: { total: 3 } }))
  assert.deepEqual(await on.call(), { kind: 'OK', value: { total: 3 } })
  const [sent] = on.received
  assert.equal(sent?.request.method, 'POST')
  assert.equal(sent?.request.url, `/${on.toolVersionId}`)
  const { clientId, clientSecret } = on.config.toolsAccess
  assert.equal(sent?.request.headers['cf-access-client-id'], clientId.reveal())
  assert.equal(sent?.request.headers['cf-access-client-secret'], clientSecret.reveal())
  assert.deepEqual(JSON.parse(sent?.body ?? ''), { call: on.callKey, input: { mes: 9 } })
  assert.deepEqual(on.logged, [])
})

test('a borda fora: o Access recusa, o status não é 200, não é JSON, outra forma ou corte, UNAVAILABLE pelo motivo, sem o token no log', async (t) => {
  const cases: [Answer, unknown][] = [
    [(response) => response.writeHead(403).end('Forbidden'), { status: 403, reason: 'status' }],
    [
      (response) => json(response, 500, { kind: 'OK', value: 1 }),
      { status: 500, reason: 'status' },
    ],
    [
      (response) => response.writeHead(200, { 'content-type': 'text/html' }).end('<h1>oi</h1>'),
      { status: 200, reason: 'not json' },
    ],
    [(response) => json(response, 200, { kind: 'TALVEZ' }), { status: 200, reason: 'shape' }],
  ]
  for (const [answer, why] of cases) {
    const on = await edgeAt(t, answer)
    assert.deepEqual(await on.call(), { kind: 'UNAVAILABLE' })
    assert.deepEqual(on.logged, [{ toolVersionId: on.toolVersionId, ...Object(why) }])
    assert.equal(on.tokenLeft(), false)
  }

  const cut = await edgeAt(t, (response) => {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.write('{"kind":"OK","va')
    response.socket?.destroy()
  })
  assert.deepEqual(await cut.call(), { kind: 'UNAVAILABLE' })
  assert.equal(cut.logged.length, 1)
  assert.equal(cut.tokenLeft(), false)
})

test('o prazo: o FAILED DEADLINE da borda chega dentro da margem do Hub; sem resposta, UNAVAILABLE', async (t) => {
  const late = await edgeAt(t, (response) => {
    setTimeout(
      () => json(response, 200, { kind: 'FAILED', reason: 'DEADLINE' }),
      EDGE_DEADLINE_MS + 100,
    )
  })
  assert.deepEqual(await late.call(), { kind: 'FAILED', reason: 'DEADLINE' })

  const silent = await edgeAt(t, () => undefined)
  assert.deepEqual(await silent.call(), { kind: 'UNAVAILABLE' })
  assert.deepEqual(silent.logged, [{ toolVersionId: silent.toolVersionId, reason: 'TimeoutError' }])
  assert.equal(silent.tokenLeft(), false)

  const ended = await edgeAt(t, () => undefined)
  assert.deepEqual(await ended.call(AbortSignal.abort()), { kind: 'UNAVAILABLE' })
  assert.deepEqual(ended.logged, [{ toolVersionId: ended.toolVersionId, reason: 'AbortError' }])
})
