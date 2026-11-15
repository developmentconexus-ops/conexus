import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatDate } from '../starter/src/lib/format.ts'

test('formatDate mostra um dia sem hora como esse mesmo dia e um instante no horário de São Paulo', () => {
  assert.equal(formatDate('2026-10-22'), '22/10/2026')
  assert.equal(formatDate('2026-10-22T00:00:00Z'), '21/10/2026')
  assert.equal(formatDate('2026-10-22T12:00:00-03:00'), '22/10/2026')
})
