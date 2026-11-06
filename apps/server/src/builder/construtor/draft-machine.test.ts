import assert from 'node:assert/strict'
import { test } from 'node:test'
import { call } from '../../hub/identity/test-hub.ts'
import { agentOf, drafted } from '../agents/test-agents.ts'
import { endOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { building, keeping } from './test-construtor.ts'

test('o rascunho pelo Construtor: agent_set sem `machine` mantém o Computador que a pessoa ligou (18)', async (t) => {
  const answers: Record<string, unknown>[] = []
  let agentId = ''
  let revision = 0
  const on = await building(t, [
    () => [tool('agent_draft', { name: 'Vendas', description: 'Vendas' })],
    keeping(answers),
    () => [tool('agent_set', { agentId, revision, instructions: 'Do Construtor.' })],
    keeping(answers),
  ])
  assert.equal(endOf(await on.conversation.say('Crie')), 'complete')
  agentId = String(Object(Object(answers[0]).agent).id)
  const read = agentOf(await call(on.hub, on.ana, 'GET', `${on.agents}/${agentId}`))
  const computer = await drafted(on.hub, on.ana, on.agents, read, { machine: true })
  revision = computer.revision

  assert.equal(endOf(await on.conversation.say('Mude')), 'complete')
  assert.equal(answers[1]?.kind, 'SAVED')
  const after = agentOf(await call(on.hub, on.ana, 'GET', `${on.agents}/${agentId}`))
  assert.equal(after.draft.instructions, 'Do Construtor.')
  assert.equal(after.draft.machine, true)
})
