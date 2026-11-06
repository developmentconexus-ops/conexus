import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MACHINE_TOOL } from '@conexus/hub-api'
import { talking } from '../assistant/test-assistant.ts'
import { endOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { agentsOn, madeTool, ordersOf, publishedAgent, talkedTo } from './test-agents.ts'

const ORDERS = 'tool_pedidos_matriz'
const PROGRAM = MACHINE_TOOL.codeMode

// 51 reads at once, counted by the turn's key: the 51st is refused with the connectors' own word.
const FIFTY_ONE = `
const results = await Promise.all(
  Array.from({ length: 51 }, () => external_${ORDERS}({ page: 1 })),
)
return { total: results.length, spent: results.filter((each) => each?.kind === 'CALLS_SPENT').length, read: results.filter((each) => each?.kind === 'OK').length }
`

async function agentWith(on: Awaited<ReturnType<typeof agentsOn>>, machine: boolean) {
  const orders = await madeTool(on.hub, on.ana, on.tools, ordersOf(on.matriz))
  return publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Responda sobre as vendas.',
    connections: [on.matriz],
    tools: [orders.latest.id],
    machine,
  })
}

test('o programa: o agente com Computador recebe execute_typescript ao lado das ferramentas diretas, e o programa chama a ferramenta pelo Hub com o limite de 50 (19)', async (t) => {
  const on = await agentsOn(t, [[tool(PROGRAM, { code: FIFTY_ONE })], []])
  const agent = await agentWith(on, true)
  const conversation = await talking(
    t,
    on.hub,
    on.ana,
    await talkedTo(on.hub, on.ana, on.agents, agent.id),
  )
  assert.equal(endOf(await conversation.say('Quanto vendemos?')), 'complete')

  const offered = on.calls[0]?.tools ?? []
  assert.ok(offered.includes(PROGRAM) && offered.includes(ORDERS), offered.join())
  assert.match(on.calls[0]?.system ?? '', /external_tool_pedidos_matriz/)
  assert.equal(
    on.reads.length,
    51,
    'every call of the program reaches the Hub’s door, under one turn key',
  )
  assert.equal(new Set(on.reads.map((each) => each.turn)).size, 1)
  const result = on.calls.at(-1)?.texts.join('\n') ?? ''
  assert.match(result, /"total":51/)
  assert.match(result, /"spent":1/)
  assert.match(result, /"read":50/)
})

test('o programa: um agente sem Computador não recebe execute_typescript, nem a instrução dele (19)', async (t) => {
  const on = await agentsOn(t)
  const agent = await agentWith(on, false)
  const conversation = await talking(
    t,
    on.hub,
    on.ana,
    await talkedTo(on.hub, on.ana, on.agents, agent.id),
  )
  assert.equal(endOf(await conversation.say('Quanto vendemos?')), 'complete')
  const asked = on.calls.at(-1)
  assert.ok(asked)
  assert.ok(!asked.tools.includes(PROGRAM), asked.tools.join())
  assert.doesNotMatch(asked.system, /execute_typescript|external_/)
})
