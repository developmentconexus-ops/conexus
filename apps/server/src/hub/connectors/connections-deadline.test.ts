import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { connectionsOn, linkSankhya, testOf } from './test-connections.ts'

// A call's deadline in these tests is 1 s (test-hub.ts); a slower answer is past it.
const PAST_A_CALL_MILLISECONDS = 1_100
// The login and the check, each cut at its own deadline, and the Hub's own work around them.
const LONGEST_MILLISECONDS = 2 * 1_000 + 300

async function linked(t: TestContext) {
  const { hub, fake, ana, base } = await connectionsOn(t)
  const { connection } = Object((await linkSankhya(hub, ana, base, fake.credential)).json())
  async function test() {
    const started = performance.now()
    const body = Object((await testOf(hub, ana, base, connection.id)).json())
    return { body, elapsed: performance.now() - started }
  }
  return { fake, test }
}

test('testar: a leitura que passa do prazo de uma chamada não alcança e não muda nada', async (t) => {
  const { fake, test } = await linked(t)
  fake.switches.delayMilliseconds = PAST_A_CALL_MILLISECONDS
  const { body, elapsed } = await test()
  assert.deepEqual([body.result, body.native, body.connection.state], ['UNREACHABLE', null, 'NEW'])
  assert.ok(elapsed < LONGEST_MILLISECONDS, `${elapsed} ms`)
})

test('testar: o login que passa do prazo de uma chamada não alcança', async (t) => {
  const { fake, test } = await linked(t)
  fake.switches.loginDelayMilliseconds = PAST_A_CALL_MILLISECONDS
  const { body, elapsed } = await test()
  assert.deepEqual([body.result, body.connection.state], ['UNREACHABLE', 'NEW'])
  assert.ok(elapsed < LONGEST_MILLISECONDS, `${elapsed} ms`)
})
