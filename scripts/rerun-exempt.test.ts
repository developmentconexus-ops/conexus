import assert from 'node:assert/strict'
import { test } from 'node:test'
import { neverRerun } from './rerun-exempt.ts'

test('um teste de isolamento, recusa ou vazamento nunca ganha a segunda rodada, pelo arquivo ou pelo nome', () => {
  const protectedFiles = [
    'src/platform/isolation-apps.test.ts',
    'src/builder/agents/approval-refused.test.ts',
    'src/builder/conversation/conversation-refusal.test.ts',
    'tests/e2e/refusals.test.ts',
  ]
  for (const file of protectedFiles) assert.equal(neverRerun({ file, name: 'x' }), true, file)
  for (const name of [
    'recusa uma pessoa de outra empresa',
    'o texto do fornecedor não vaza',
    'a company B não lê o projeto de outro',
    'isolation between projects',
  ]) {
    assert.equal(neverRerun({ file: 'src/a.test.ts', name }), true, name)
  }
})

test('um teste comum ganha a segunda rodada', () => {
  assert.equal(neverRerun({ file: 'src/a.test.ts', name: 'lista as conversas em ordem' }), false)
})
