import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { DataReadEntry } from '@conexus/hub-api'
import { call } from '../identity/test-hub.ts'
import { exportUrl, idsNewestFirst, registry, sampled } from './test-reads.ts'

const DAY_MS = 86_400_000

function iso(ms: number) {
  return new Date(ms).toISOString()
}

test('a exportação leva no máximo 31 dias', async (t) => {
  const w = await registry(t)
  await sampled(w, w.ana)
  const now = Date.now()
  const from = now - 30 * DAY_MS
  const thirtyOne = await call(
    w.hub,
    w.ana,
    'GET',
    exportUrl(w, iso(from), iso(from + 31 * DAY_MS)),
  )
  assert.equal(thirtyOne.statusCode, 200, thirtyOne.body)
  assert.equal(Object(thirtyOne.json()).reads.length, 1)
  const refused = [
    exportUrl(w, iso(from), iso(from + 32 * DAY_MS)),
    exportUrl(w, iso(now), iso(now - DAY_MS)),
    `/api/companies/${w.companyId}/data-reads/export?from=${encodeURIComponent(iso(from))}`,
    `/api/companies/${w.companyId}/data-reads/export?to=${encodeURIComponent(iso(now))}`,
  ]
  for (const address of refused) {
    const answer = await call(w.hub, w.ana, 'GET', address)
    assert.equal(answer.statusCode, 400, address)
    assert.equal(Object(answer.json()).code, 'REQUEST_MALFORMED')
    assert.equal(Object(answer.json()).reads, undefined)
  }
  const before = await call(w.hub, w.ana, 'GET', exportUrl(w, iso(from - 20 * DAY_MS), iso(from)))
  assert.deepEqual(before.json(), { reads: [], complete: true })
})

test('a exportação para em 5.000', async (t) => {
  const w = await registry(t)
  for (let batch = 0; batch < 50; batch += 1) {
    await Promise.all(Array.from({ length: 100 }, () => sampled(w, w.bruno)))
  }
  await sampled(w, w.bruno)
  const now = Date.now()
  const period = [iso(now - DAY_MS), iso(now + DAY_MS)] as const
  const all = await call(w.hub, w.ana, 'GET', exportUrl(w, ...period))
  assert.equal(all.statusCode, 200)
  const body = Object(all.json())
  assert.deepEqual([body.reads.length, body.complete], [5000, false])
  const ids: string[] = body.reads.map((read: DataReadEntry) => read.id)
  assert.deepEqual(ids, (await idsNewestFirst(w)).slice(0, 5000))
  await w.hub.test.asOwner(
    `delete from data.data_read where id = (select id from data.data_read order by at limit 1)`,
  )
  const whole = Object((await call(w.hub, w.ana, 'GET', exportUrl(w, ...period))).json())
  assert.deepEqual([whole.reads.length, whole.complete], [5000, true])
  const cut = await call(w.hub, w.ana, 'GET', exportUrl(w, ...period, `&person=${w.ana.id}`))
  assert.deepEqual(cut.json(), { reads: [], complete: true })
})
