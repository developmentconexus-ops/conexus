import assert from 'node:assert/strict'
import { test } from 'node:test'
import { connectionsOn, linkSankhya, testOf } from './test-connections.ts'

test('429 do Sankhya na leitura do Testar, com espera que cabe: o Hub espera, repete e a leitura funciona', async (t) => {
  const { hub, fake, ana, base } = await connectionsOn(t)
  const { connection } = Object((await linkSankhya(hub, ana, base, fake.credential)).json())
  fake.switches.busyReads = 1
  fake.switches.busyWait = { header: 'retry-after-ms', value: '10' }
  const response = await testOf(hub, ana, base, connection.id)
  assert.equal(Object(response.json()).result, 'WORKING')
  assert.equal(fake.switches.busyReads, 0, 'the 429 was answered once')
})
