import assert from 'node:assert/strict'
import { test } from 'node:test'
import { flakyTests } from './rerun-state.ts'

type Child = { line: number; column: number }

function child(line: number): Child {
  return { line, column: 3 }
}

function entry(name: string, attempt: number, children: Child[] = []) {
  return { name, children, passed_on_attempt: attempt }
}

test('só o que passou na segunda tentativa é instável, e o teste de um grupo leva o nome do grupo', () => {
  const state = [
    { 'a.test.ts:5:3': entry('ok', 0) },
    {
      'a.test.ts:5:3': entry('ok', 0),
      'a.test.ts:6:3': entry('instável', 1),
      'a.test.ts:4:1': entry('grupo', 1, [child(5), child(6)]),
      'b.test.ts:2:1': entry('solto', 1),
    },
  ]
  assert.deepEqual(flakyTests(JSON.stringify(state)), [
    { file: 'a.test.ts', name: 'grupo › instável' },
    { file: 'b.test.ts', name: 'solto' },
  ])
})

test('um grupo que passou tarde sem teste tardio é instável por si, como um gancho que falhou uma vez', () => {
  const state = [
    { 'a.test.ts:4:1': entry('grupo', 1, [child(5)]), 'a.test.ts:5:3': entry('ok', 0) },
  ]
  assert.deepEqual(flakyTests(JSON.stringify(state)), [{ file: 'a.test.ts', name: 'grupo' }])
})

test('sem segunda tentativa nada é instável', () => {
  assert.deepEqual(flakyTests(JSON.stringify([{ 'a.test.ts:1:1': entry('ok', 0) }])), [])
  assert.deepEqual(flakyTests('[]'), [])
})
