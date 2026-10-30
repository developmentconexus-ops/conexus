import assert from 'node:assert/strict'
import { test } from 'node:test'
import { codeOf } from '../identity/test-hub.ts'
import { connectionsOn, linkSankhya, testOf } from './test-connections.ts'

test('ligar: os campos colados perdem o espaço das pontas e o vazio é recusado', async (t) => {
  const { hub, fake, ana, base } = await connectionsOn(t)
  const blank = await linkSankhya(hub, ana, base, { ...fake.credential, xToken: '   ' })
  assert.deepEqual([blank.statusCode, codeOf(blank)], [422, 'CONNECTION_CREDENTIAL_INVALID'])
  const padded = Object.fromEntries(
    Object.entries(fake.credential).map(([name, value]) => [name, `  ${value}\n`]),
  )
  const linked = await linkSankhya(hub, ana, base, padded)
  assert.equal(linked.statusCode, 201)
  const tested = await testOf(hub, ana, base, Object(linked.json()).connection.id)
  assert.equal(Object(tested.json()).result, 'WORKING')
})
