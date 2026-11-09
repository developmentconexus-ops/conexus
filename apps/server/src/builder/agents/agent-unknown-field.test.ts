import assert from 'node:assert/strict'
import { test } from 'node:test'
import { said, talking } from '../assistant/test-assistant.ts'
import { endOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { madeTool, publishedAgent, talkedTo } from './test-agents.ts'
import { approving } from './test-approval.ts'

test('um campo que a leitura não tem: a ferramenta Clientes do agente recusa o nome com o nome do campo, e a leitura não corre', async (t) => {
  const on = await approving(t, [
    [tool('tool_clientes_matriz', { page: 0, nome: 'Silva' })],
    [said('Não filtra por nome.')],
  ])
  const clients = await madeTool(on.hub, on.ana, on.tools, {
    slug: 'clientes_matriz',
    connectionId: on.matriz,
    operation: 'clientes',
    description: 'Os clientes da empresa, uma página por vez.',
    bound: {},
    open: ['page', 'dataHoraAlteracao'],
  })
  const reader = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Responda sobre os clientes.',
    connections: [on.matriz],
    tools: [clients.latest.id],
  })
  const { say } = await talking(
    t,
    on.hub,
    on.ana,
    await talkedTo(on.hub, on.ana, on.agents, reader.id),
  )
  assert.equal(endOf(await say('Quem é o cliente Silva?')), 'complete')
  const [refused] = on.calls[1]?.toolResults ?? []
  assert.match(refused?.text ?? '', /Unrecognized key.*nome/)
})
