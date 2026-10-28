import assert from 'node:assert/strict'
import { test } from 'node:test'
import { unreachableAnswer } from './test-company-postgres.ts'

test('o banco que não atende é silêncio, não recusa', async () => {
  assert.deepEqual(await unreachableAnswer(), { kind: 'NO_ANSWER' })
})
