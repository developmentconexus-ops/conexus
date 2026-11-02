import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Cadence } from '@conexus/hub-api'
import { computeNextFireAt } from '@mastra/core/workflows'
import { AUTOMATION_TIMEZONE, cronOf } from './public.ts'

/** The cadence's first time after `after`, as Mastra's scheduler reads the row's cron and zone. */
function nextRunOf(cadence: Cadence, after: Date): Date {
  return new Date(
    computeNextFireAt(cronOf(cadence), { timezone: AUTOMATION_TIMEZONE, after: after.getTime() }),
  )
}

test('a cadência vira o cron do Mastra, e o próximo horário é o de São Paulo', () => {
  assert.equal(cronOf({ kind: 'DAILY', time: '07:00' }), '0 7 * * *')
  assert.equal(cronOf({ kind: 'WEEKDAYS', time: '08:30' }), '30 8 * * 1-5')
  assert.equal(cronOf({ kind: 'WEEKLY', days: ['MON', 'THU'], time: '08:00' }), '0 8 * * 1,4')
  assert.equal(
    cronOf({ kind: 'WEEKLY', days: ['THU', 'MON', 'THU', 'SUN'], time: '23:59' }),
    '59 23 * * 0,1,4',
  )
  assert.equal(cronOf({ kind: 'MONTHLY', day: 5, time: '09:00' }), '0 9 5 * *')

  const after = new Date('2026-11-02T10:00:30.000Z')
  assert.equal(
    nextRunOf({ kind: 'DAILY', time: '07:00' }, after).toISOString(),
    '2026-11-03T10:00:00.000Z',
  )
  assert.equal(
    nextRunOf({ kind: 'DAILY', time: '07:00' }, new Date('2026-11-02T09:59:00.000Z')).toISOString(),
    '2026-11-02T10:00:00.000Z',
  )
  assert.equal(
    nextRunOf(
      { kind: 'WEEKDAYS', time: '08:30' },
      new Date('2026-11-06T12:00:00.000Z'),
    ).toISOString(),
    '2026-11-09T11:30:00.000Z',
  )
  assert.equal(
    nextRunOf({ kind: 'MONTHLY', day: 5, time: '09:00' }, after).toISOString(),
    '2026-11-05T12:00:00.000Z',
  )
})
