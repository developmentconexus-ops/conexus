import assert from 'node:assert/strict'
import type { Server, ServerResponse } from 'node:http'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { FailureCode } from '@conexus/hub-api'
import { createCompany } from '@conexus/hub-api'
import { problemOf } from './src/platform/fixtures.ts'
import { HubFailure, hubMutation } from './src/platform/hub.ts'

// hub.ts against a real socket, which MSW cannot express: a reply that ends after the headers
// (testing T14). Run by node:test, like the other root tests of this package.
type Reply = ServerResponse

async function hubThatAnswers(t: TestContext, answer: (reply: Reply) => void) {
  const server: Server = createServer((_request, reply) => answer(reply))
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => {
    server.closeAllConnections()
    server.close()
  })
  const address = server.address()
  assert.ok(address !== null && typeof address === 'object')
  Object.defineProperty(globalThis, 'location', {
    value: { origin: `http://127.0.0.1:${address.port}` },
    configurable: true,
  })
}

function problem(code: FailureCode) {
  return JSON.stringify(problemOf(code))
}

async function createdWith() {
  const { mutationFn } = hubMutation(createCompany)
  return mutationFn({ body: { name: 'Empresa Teste' }, attemptKey: crypto.randomUUID() }).then(
    () => undefined,
    (error: unknown) => error,
  )
}

function assertUnknown(error: unknown, unknown: boolean) {
  assert.ok(error instanceof HubFailure, `a HubFailure, got ${String(error)}`)
  assert.equal(error.outcomeUnknown, unknown)
  return error
}

test('resposta que não decide: o corpo do 201 é cortado depois dos cabeçalhos', async (t) => {
  await hubThatAnswers(t, (reply) => {
    reply.writeHead(201, { 'content-type': 'application/json', 'content-length': '200' })
    reply.write('{"company":{"id":"aaa')
    setTimeout(() => reply.socket?.destroy(), 20)
  })
  const error = assertUnknown(await createdWith(), true)
  assert.ok(error.cause instanceof Error, 'the body-stream error is kept as the cause')
})

test('resposta que não decide: o corpo para além do prazo', { timeout: 30_000 }, async (t) => {
  await hubThatAnswers(t, (reply) => {
    reply.writeHead(201, { 'content-type': 'application/json', 'content-length': '200' })
    reply.write('{"company":{"id":"aaa')
  })
  const error = assertUnknown(await createdWith(), true)
  assert.ok(error.cause instanceof Error)
})

test('resposta que não decide: a página 502 da borda', async (t) => {
  await hubThatAnswers(t, (reply) => {
    reply.writeHead(502, { 'content-type': 'text/html' })
    reply.end('<html>Bad gateway</html>')
  })
  assertUnknown(await createdWith(), true)
})

test('resposta que não decide: DATABASE_UNAVAILABLE do Hub, inteiro', async (t) => {
  await hubThatAnswers(t, (reply) => {
    reply.writeHead(503, { 'content-type': 'application/problem+json' })
    reply.end(problem('DATABASE_UNAVAILABLE'))
  })
  const error = assertUnknown(await createdWith(), true)
  assert.equal(error.code, 'DATABASE_UNAVAILABLE')
})

test('resposta que decide: uma recusa de usuário do Hub, inteira', async (t) => {
  await hubThatAnswers(t, (reply) => {
    reply.writeHead(404, { 'content-type': 'application/problem+json' })
    reply.end(problem('NOT_FOUND'))
  })
  assert.equal(assertUnknown(await createdWith(), false).code, 'NOT_FOUND')
})

test('resposta que decide: MAIL_UNAVAILABLE do Hub, inteiro, com a mudança que ficou', async (t) => {
  await hubThatAnswers(t, (reply) => {
    reply.writeHead(502, { 'content-type': 'application/problem+json' })
    reply.end(problem('MAIL_UNAVAILABLE'))
  })
  assert.equal(assertUnknown(await createdWith(), false).code, 'MAIL_UNAVAILABLE')
})
