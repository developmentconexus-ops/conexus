import assert from 'node:assert/strict'
import { test } from 'node:test'
import { activated, lastState, monthsOf, NOW, sankhyaDouble, tap, WINDOW } from './test-tap.ts'

test('a data que recua com uma passada inteira salva: a passada é planejada de novo, inteira, desde a data nova; a igual e a mais nova retomam', async () => {
  const run = await tap(sankhyaDouble(), { streams: WINDOW, startDate: '2026-10-01' })
  const middle = run.messages.filter(({ type }) => type === 'STATE')[0] ?? assert.fail()
  const saved = lastState({ ...run, messages: [middle] })
  const pass = saved.bookmarks.efd?.pass ?? assert.fail()
  async function again(startDate: string | null, state = saved) {
    const next = await tap(sankhyaDouble(), {
      streams: WINDOW,
      state,
      startDate,
      now: NOW + 60_000,
    })
    const versions = activated(next, 'efd').map((message) => message.version)
    return { months: monthsOf(next), versions }
  }
  for (const startDate of ['2026-08-01', null]) {
    const replanned = await again(startDate)
    assert.ok(replanned.months.includes('2026-08'), `${startDate}`)
    assert.deepEqual(replanned.versions, [NOW + 60_000], `${startDate}`)
  }
  const withPoint = await again('2026-08-01', {
    bookmarks: { efd: { replication_key_value: '2026-11', pass } },
  })
  assert.ok(withPoint.months.includes('2026-08'), 'replanejada inteira, não do ponto')
  for (const startDate of ['2026-10-01', '2026-11-01']) {
    assert.deepEqual((await again(startDate)).versions, [NOW], startDate)
  }
  const changed = await again('2026-08-01', {
    bookmarks: { efd: { pass: { ...pass, whole: false } } },
  })
  assert.equal(changed.months.includes('2026-08'), false, 'a passada que não é inteira retoma')
})
