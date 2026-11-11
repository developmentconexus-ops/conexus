import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CopyDefinition } from '../connectors/public.ts'
import { copyModeOf } from './public.ts'

const base = {
  version: 1,
  source: { kind: 'QUERY', sql: 'select 1' },
  columns: [
    { name: 'ID', type: 'bigint' },
    { name: 'ALTERADO', type: 'timestamp' },
  ],
  key: ['ID'],
  changedSince: null,
}

test('o modo vem da definição', () => {
  function modeOf(extra: object) {
    return copyModeOf(CopyDefinition.parse({ ...base, ...extra }))
  }
  const changed = { changedSince: { column: 'ALTERADO' } }
  const window = { window: { column: 'ALTERADO', days: 7 } }
  assert.deepEqual(modeOf({}), { kind: 'WHOLE' })
  // The engine reads the whole source and deletes what did not come back, window or not.
  assert.deepEqual(modeOf(window), { kind: 'WHOLE' })
  assert.deepEqual(modeOf({ ...changed, ...window }), { kind: 'WINDOW', days: 7 })
  assert.deepEqual(modeOf(changed), { kind: 'CHANGES' })
})
