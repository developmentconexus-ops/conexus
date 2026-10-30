import assert from 'node:assert/strict'
import { test } from 'node:test'
import { connectionsOn, linkSankhya, outcomes, testOf } from './test-connections.ts'

// A Sankhya read is a POST with a body (the door's `consultar`, `carregar`): the repeat after a
// 429's wait must send a fresh request, not the one the first send spent.
test('429 do Sankhya numa leitura da porta, com espera que cabe: o Hub espera, repete e a leitura funciona', async (t) => {
  const { hub, fake, ana, base } = await connectionsOn(t)
  const { connection } = Object((await linkSankhya(hub, ana, base, fake.credential)).json())
  fake.switches.busyReads = 1
  fake.switches.busyWait = { header: 'retry-after-ms', value: '10' }
  const response = await testOf(hub, ana, base, connection.id)
  assert.equal(Object(response.json()).result, 'WORKING')
  assert.equal(fake.switches.busyReads, 0, 'the 429 was answered once')
  assert.ok(
    outcomes(response).every(([, outcome]: string[]) => outcome === 'READS'),
    'the repeat read, not an unreachable Sankhya',
  )
})
