import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { endOf } from '../../harness/routes/test-conversation.ts'
import { sameRequests } from '../../harness/spec/test-request.ts'
import type { Sent } from '../../platform/test-anthropic.ts'
import { said, talking } from '../assistant/test-assistant.ts'
import { agentsOn, madeTool, ordersOf, publishedAgent, talkedTo } from './test-agents.ts'
import { approving } from './test-approval.ts'

function snapshot(name: string): string {
  return fileURLToPath(new URL(`./requests/${name}.snapshot`, import.meta.url))
}

/** The turn's calls against the scenario's snapshot in `requests/`. */
function same(t: TestContext, calls: readonly Sent[], name: string) {
  sameRequests(
    t,
    calls.map((each) => each.body),
    snapshot(name),
  )
}

test('a conversa com a versão publicada, só de leitura', async (t) => {
  const on = await agentsOn(t, [[said('Vendemos 3 pedidos.')]])
  const orders = await madeTool(on.hub, on.ana, on.tools, ordersOf(on.matriz))
  const agent = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Responda sobre as vendas.',
    connections: [on.matriz],
    tools: [orders.latest.id],
  })
  const url = await talkedTo(on.hub, on.ana, on.agents, agent.id)
  assert.equal(
    endOf(await (await talking(t, on.hub, on.ana, url)).say('Quanto vendemos?')),
    'complete',
  )
  assert.equal(on.calls.length, 1)
  same(t, on.calls, 'publicada-leitura')
})

test('a conversa com o rascunho que tem uma escrita em Pergunta antes', async (t) => {
  const on = await approving(t, [[said('Diga o pedido.')]])
  const agent = await on.writer('ASK')
  const url = await talkedTo(on.hub, on.ana, on.agents, agent.id, { draft: true })
  assert.equal(
    endOf(await (await talking(t, on.hub, on.ana, url)).say('Lance um pedido')),
    'complete',
  )
  assert.equal(on.calls.length, 1)
  same(t, on.calls, 'rascunho-escrita')
})

test('a conversa com a versão que tem o Computador', async (t) => {
  const on = await agentsOn(t, [[said('Pronto.')]])
  const agent = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Faça relatórios.',
    machine: true,
  })
  const url = await talkedTo(on.hub, on.ana, on.agents, agent.id)
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say('Um relatório')), 'complete')
  assert.equal(on.calls.length, 1)
  same(t, on.calls, 'computador')
})
