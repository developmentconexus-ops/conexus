import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runOf } from '../tools/company/test-company-tools.ts'
import { dataContextOf } from './public.ts'

test('o contexto de dados leva a conversa da execução, e nenhuma na prova de um rascunho', () => {
  const run = runOf('assistant')
  assert.ok(run.conversation.kind === 'THREAD')
  assert.deepEqual(dataContextOf(run), { thread: run.conversation.id })
  assert.deepEqual(dataContextOf({ ...run, conversation: { kind: 'TRIAL' } }), { thread: null })
})
