import assert from 'node:assert/strict'
import { test } from 'node:test'
import { linkMercadoLivre, mercadoLivreOn, testOf } from './test-connections.ts'

// The Hub's deadlines in these tests: 200 ms a call, 1 s the whole test (test-hub.ts).
const CALL_DEADLINE_MS = 200

async function busyOn(t: Parameters<typeof mercadoLivreOn>[0]) {
  const on = await mercadoLivreOn(t)
  const id = String(
    Object((await linkMercadoLivre(on.hub, on.ana, on.companyId)).json()).connection.id,
  )
  async function tested() {
    const started = performance.now()
    const response = await testOf(on.hub, on.ana, on.base, id)
    return { body: Object(response.json()), elapsed: performance.now() - started }
  }
  return { ...on, tested }
}

test('429 com espera que cabe no prazo: o Hub espera o que o fornecedor pediu, repete uma vez e a leitura funciona', async (t) => {
  const on = await busyOn(t)
  on.fake.switches.busyReads = 1
  on.fake.switches.busyWait = { header: 'retry-after-ms', value: '80' }
  const { body, elapsed } = await on.tested()
  assert.equal(body.result, 'WORKING')
  assert.equal(on.fake.switches.busyReads, 0, 'the 429 was answered once')
  assert.ok(elapsed >= 80, `${elapsed} ms: the wait was kept`)
  assert.ok(
    body.checks.every((check: { outcome: string }) => check.outcome !== 'UNREADABLE'),
    'a 429 is no longer unreadable',
  )
})

test('429 com espera maior que o prazo da chamada: BUSY com a espera pedida, sem esperar nem repetir', async (t) => {
  const on = await busyOn(t)
  on.fake.switches.busyReads = 5
  on.fake.switches.busyWait = { header: 'retry-after', value: '30' }
  const { body, elapsed } = await on.tested()
  assert.equal(body.result, 'BUSY')
  assert.equal(body.waitMs, 30_000)
  assert.equal(body.native.status, 429)
  assert.equal(body.connection.state, 'NEW')
  assert.equal(on.fake.switches.busyReads, 4, 'one 429 only: no repeat')
  assert.ok(elapsed < CALL_DEADLINE_MS * 3, `${elapsed} ms: the wait was not kept`)
})

test('um segundo 429 depois da espera: BUSY, e a leitura foi repetida só uma vez', async (t) => {
  const on = await busyOn(t)
  on.fake.switches.busyReads = 5
  on.fake.switches.busyWait = { header: 'retry-after-ms', value: '20' }
  const { body } = await on.tested()
  assert.equal(body.result, 'BUSY')
  assert.equal(body.waitMs, 20)
  assert.equal(on.fake.switches.busyReads, 3, 'two 429s: the call and its one repeat')
})

test('429 sem Retry-After: BUSY sem espera, sem repetir', async (t) => {
  const on = await busyOn(t)
  on.fake.switches.busyReads = 5
  const { body } = await on.tested()
  assert.deepEqual([body.result, body.waitMs], ['BUSY', null])
  assert.equal(on.fake.switches.busyReads, 4)
})
