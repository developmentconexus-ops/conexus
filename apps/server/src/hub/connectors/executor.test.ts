import assert from 'node:assert/strict'
import { test } from 'node:test'
import { call, hubWithLog } from '../identity/test-hub.ts'
import { connectionsOn, linkSankhya, testOf } from './test-connections.ts'

test('a origem, o redirecionamento e o teto', async (t) => {
  const { hub, fake, ana, base } = await connectionsOn(t)
  const { connection } = Object((await linkSankhya(hub, ana, base, fake.credential)).json())

  fake.switches.redirect = true
  const redirected = await testOf(hub, ana, base, connection.id)
  assert.equal(Object(redirected.json()).result, 'UNREACHABLE')
  assert.equal(Object(redirected.json()).connection.state, 'NEW')
  fake.switches.redirect = false

  fake.switches.oversize = true
  const oversize = await testOf(hub, ana, base, connection.id)
  assert.equal(Object(oversize.json()).result, 'WORKING')
  const checks = Object(oversize.json()).checks.map((check: { outcome: string }) => check.outcome)
  assert.equal(checks[0], 'UNREADABLE')
  assert.ok(checks.every((outcome: string) => outcome !== 'READS'))
})

test('o Hub com a origem de um conector que o kit não tem não sobe', async (t) => {
  await assert.rejects(
    hubWithLog(t, (config) => ({
      ...config,
      connectorOrigins: new Map([['nenhum', 'http://127.0.0.1:4180']]),
    })),
    (error: unknown) => {
      assert.equal(Reflect.get(Object(error), 'code'), 'CONFIG_INVALID')
      return true
    },
  )
})

test('testar: as chamadas juntas passam do orçamento e o fornecedor conta como fora do ar', async (t) => {
  const { hub, fake, ana, base } = await connectionsOn(t)
  const { connection } = Object((await linkSankhya(hub, ana, base, fake.credential)).json())
  // Each call answers inside its own deadline; together they pass the Testar's budget.
  fake.switches.delayMs = 150
  const slow = await testOf(hub, ana, base, connection.id)
  assert.equal(slow.statusCode, 200)
  assert.deepEqual(Object(slow.json()), { result: 'UNREACHABLE', connection })
  const listed = await call(hub, ana, 'GET', base)
  assert.deepEqual(Object(listed.json()).connections, [connection])
})
