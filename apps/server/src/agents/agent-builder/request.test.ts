import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { endOf } from '../../harness/routes/test-conversation.ts'
import { tool } from '../../harness/routes/test-questions.ts'
import { sameRequests } from '../../harness/spec/test-request.ts'
import { building, resultOf } from './test-construtor.ts'

const INSTRUCTIONS = 'Responda sobre as vendas do dia.'

test('um turno que faz o rascunho e chama o Testar: o Construtor e o agente da versão rodando sozinho', async (t) => {
  let agentId = ''
  const on = await building(t, [
    () => [tool('agent_draft', { name: 'Vendas do dia', description: 'Conta as vendas' })],
    (asked) => {
      const agent = Object(resultOf(asked).agent)
      agentId = String(agent.id)
      return [tool('agent_set', { agentId, revision: agent.revision, instructions: INSTRUCTIONS })]
    },
    () => [tool('agent_test', { agentId, question: 'Quanto vendemos?' })],
    () => [{ type: 'text', text: 'O agente respondeu.' }],
  ])
  assert.equal(endOf(await on.conversation.say('Quero um agente de vendas')), 'complete')
  const turn = on.anthropic.sent.filter((each) => each.stream || each.system.includes(INSTRUCTIONS))
  assert.deepEqual(
    turn.map((each) => each.stream),
    [true, true, true, false, true],
  )
  sameRequests(
    t,
    turn.map((each) => each.body),
    fileURLToPath(new URL('./requests/rascunho-e-testar.snapshot', import.meta.url)),
  )
})
