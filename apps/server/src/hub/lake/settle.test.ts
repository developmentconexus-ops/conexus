import assert from 'node:assert/strict'
import { test } from 'node:test'
import { settle } from './public.ts'
import { TEST_STACK as STACK } from './test-lake.ts'

// Each row state against each stack status the Hub can read, and what it does (criteria 42 to 48, 55).
const TABLE = [
  ['creating', 'CREATE_IN_PROGRESS', 'KEEP'],
  ['creating', 'CREATE_FAILED', 'KEEP'],
  ['creating', 'ROLLBACK_IN_PROGRESS', 'KEEP'],
  ['creating', 'DELETE_IN_PROGRESS', 'KEEP'],
  ['creating', 'CREATE_COMPLETE', 'READY'],
  ['creating', 'DELETE_COMPLETE', 'FAIL'],
  ['creating', 'DELETE_FAILED', 'DELETE_FAILED'],
  ['creating', 'ROLLBACK_COMPLETE', 'DELETE_FAILED'],
  ['creating', 'ROLLBACK_FAILED', 'DELETE_FAILED'],
  ['deleting', 'DELETE_IN_PROGRESS', 'KEEP'],
  ['deleting', 'CREATE_COMPLETE', 'RESEND_DELETE'],
  ['deleting', 'DELETE_COMPLETE', 'GONE'],
  ['deleting', 'DELETE_FAILED', 'DELETE_FAILED'],
  ['ready', 'CREATE_COMPLETE', 'KEEP'],
  ['ready', 'DELETE_COMPLETE', 'KEEP'],
  ['failed', 'DELETE_COMPLETE', 'KEEP'],
  ['delete_failed', 'DELETE_FAILED', 'KEEP'],
] as const

test('settle: a tabela inteira da linha pelo estado da pilha', () => {
  for (const [state, status, step] of TABLE) {
    assert.deepEqual(settle({ state, stackId: STACK }, status), { do: step }, `${state} ${status}`)
  }
})

test('settle: criando sem pilha manda a criação de novo; sem estado lido, nada muda', () => {
  assert.deepEqual(settle({ state: 'creating', stackId: null }, null), { do: 'RESEND_CREATE' })
  assert.deepEqual(settle({ state: 'deleting', stackId: STACK }, null), { do: 'KEEP' })
})
