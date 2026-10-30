import assert from 'node:assert/strict'
import { test } from 'node:test'
import { appCalls } from './test-app-calls.ts'

test('o fim do Hub: cada token vivo recebe o logout; um logout que falha vai ao registro e não para nada', async (t) => {
  const on = await appCalls(t)
  await on.connect('Matriz')
  assert.equal(Object((await on.read()).json()).kind, 'OK')
  assert.equal(on.fake.logouts(), 0)
  await on.hub.connectors.closeAll(2000)
  assert.equal(on.fake.logouts(), 1)
  assert.ok(on.hub.lines.some((line) => line.message === 'CONNECTOR_LOGGED_OUT'))
  assert.equal(Object((await on.read()).json()).kind, 'OK')
  await on.served.close()
  await on.hub.connectors.closeAll(500)
  assert.ok(on.hub.lines.some((line) => line.message === 'CONNECTOR_LOGOUT_FAILED'))
})

test('Desligar faz o logout do token da ligação e solta a fila', async (t) => {
  const on = await appCalls(t)
  const id = await on.connect('Matriz')
  assert.equal(Object((await on.read()).json()).kind, 'OK')
  const { call } = await import('../identity/test-hub.ts')
  const removed = await call(on.hub, on.ana, 'DELETE', `${on.routes.connections}/${id}`)
  assert.equal(removed.statusCode, 200)
  assert.equal(on.fake.logouts(), 1)
})
