import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CHECK_IDS, connectionsOn, linkSankhya, outcomes, testOf } from './test-connections.ts'

test('testar: o prazo do teste inteiro', async (t) => {
  const { hub, fake, ana, base } = await connectionsOn(t)
  const { connection } = Object((await linkSankhya(hub, ana, base, fake.credential)).json())
  // Each answer fits its own deadline (200 ms) but all 25 do not fit the whole test's (1 s).
  fake.switches.delayMilliseconds = 150
  const started = performance.now()
  const slow = await testOf(hub, ana, base, connection.id)
  assert.ok(performance.now() - started < 1_500)
  assert.equal(slow.statusCode, 200)
  const body = Object(slow.json())
  assert.equal(body.result, 'WORKING')
  assert.equal(body.connection.state, 'ACTIVE')
  const found = outcomes(slow)
  assert.deepEqual(
    found.map(([id]: string[]) => id),
    CHECK_IDS,
  )
  const untested = found.findIndex(([, outcome]: string[]) => outcome === 'NOT_TESTED')
  assert.ok(untested > 0, 'some items were reached')
  assert.ok(found.slice(0, untested).every(([, outcome]: string[]) => outcome === 'READS'))
  assert.ok(found.slice(untested).every(([, outcome]: string[]) => outcome === 'NOT_TESTED'))
})
