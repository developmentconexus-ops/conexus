import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { CHECK_IDS, connectionsOn, linkSankhya, outcomes, testOf } from './test-connections.ts'

// The Hub's deadlines in these tests: 200 ms a call, 1 s the whole test (test-hub.ts). A slow
// answer takes 175 ms, so five fit the whole test and the sixth is the one it cuts.
const SLOW_MILLISECONDS = 150
const FITS = 5
// The whole test's response may pass its deadline by less than a call's (200 ms), or a call kept
// its own deadline instead of what was left.
const MARGIN_MILLISECONDS = 100
// Late in the test: after the fifth slow answer begins, before the sixth does.
const LATE_MILLISECONDS = 800

async function slowTest(t: TestContext) {
  const { hub, fake, ana, base } = await connectionsOn(t)
  const { connection } = Object((await linkSankhya(hub, ana, base, fake.credential)).json())
  fake.switches.delayMilliseconds = SLOW_MILLISECONDS
  async function test() {
    const started = performance.now()
    const response = await testOf(hub, ana, base, connection.id)
    return { response, body: Object(response.json()), elapsed: performance.now() - started }
  }
  function late(change: () => void) {
    const timer = setTimeout(change, LATE_MILLISECONDS)
    t.after(() => clearTimeout(timer))
  }
  return { fake, test, late }
}

function reached(response: { json(): unknown }) {
  return outcomes(response).filter(([, outcome]: string[]) => outcome === 'READS').length
}

test('testar: o prazo do teste inteiro', async (t) => {
  const { test } = await slowTest(t)
  // Each answer fits its own deadline (200 ms) but all 25 do not fit the whole test's (1 s).
  const { response, body, elapsed } = await test()
  assert.equal(response.statusCode, 200)
  assert.equal(body.result, 'WORKING')
  assert.equal(body.connection.state, 'ACTIVE')
  const found = outcomes(response)
  assert.deepEqual(
    found.map(([id]: string[]) => id),
    CHECK_IDS,
  )
  // The item in flight when the whole test ends is cut: only what fits was read.
  const untested = found.findIndex(([, outcome]: string[]) => outcome === 'NOT_TESTED')
  assert.ok(untested > 0 && untested <= FITS, `${untested} items were read`)
  assert.ok(found.slice(0, untested).every(([, outcome]: string[]) => outcome === 'READS'))
  assert.ok(found.slice(untested).every(([, outcome]: string[]) => outcome === 'NOT_TESTED'))
  assert.ok(elapsed < 1_000 + MARGIN_MILLISECONDS, `${elapsed} ms`)
})

test('testar: o token que vence no fim e a chamada repetida', async (t) => {
  const { fake, test, late } = await slowTest(t)
  late(() => fake.expireTokens())
  const { body, response, elapsed } = await test()
  // The new token is good, and the repeated call is cut by what is left: not read, not "down".
  assert.equal(body.result, 'WORKING')
  assert.equal(body.connection.state, 'ACTIVE')
  assert.ok(fake.logins() >= 2, 'a second login')
  assert.ok(reached(response) <= FITS, `${reached(response)} items were read`)
  assert.ok(elapsed < 1_000 + MARGIN_MILLISECONDS, `${elapsed} ms`)
})

test('testar: o login que não cabe no prazo', async (t) => {
  const { fake, test, late } = await slowTest(t)
  late(() => {
    fake.expireTokens()
    // Within a call's deadline (200 ms) but not within what is left of the test's.
    fake.switches.loginDelayMilliseconds = 190
  })
  const { body, elapsed } = await test()
  assert.equal(body.result, 'UNREACHABLE')
  assert.equal(body.connection.state, 'NEW')
  assert.ok(elapsed < 1_000 + MARGIN_MILLISECONDS, `${elapsed} ms`)
})

test('testar: o Sankhya que cai no fim do teste', async (t) => {
  const { fake, test, late } = await slowTest(t)
  late(() => {
    fake.switches.redirect = true
  })
  const { body } = await test()
  // Time was left, so this is the provider failing, not an item the test did not reach.
  assert.equal(body.result, 'UNREACHABLE')
  assert.equal(body.connection.state, 'NEW')
})
