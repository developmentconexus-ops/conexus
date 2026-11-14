import assert from 'node:assert/strict'
import { test } from 'node:test'
import { post } from '../../hub/identity/test-hub.ts'
import { talking } from '../assistant/test-assistant.ts'
import { endOf } from '../conversation/test-conversation.ts'
import {
  agentOf,
  agentsOn,
  drafted,
  madeAgent,
  madeTool,
  ordersOf,
  publishedAgent,
  talkedTo,
} from './test-agents.ts'

/** What the agent's model is offered for one answer. */
async function offeredTo(
  t: Parameters<typeof agentsOn>[0],
  on: Awaited<ReturnType<typeof agentsOn>>,
  id: string,
) {
  const conversation = await talking(
    t,
    on.hub,
    on.ana,
    await talkedTo(on.hub, on.ana, on.agents, id),
  )
  assert.equal(endOf(await conversation.say('Quanto vendemos?')), 'complete')
  return on.calls.at(-1)?.tools.toSorted()
}

test('selecionar a ligação não dá leitura: o modelo não recebe ferramenta dela, e a Consulta livre só chega com a ferramenta marcada', async (t) => {
  const on = await agentsOn(t)
  const only = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Responda sobre as vendas.',
    connections: [on.matriz],
  })
  assert.deepEqual(await offeredTo(t, on, only.id), [])

  const orders = await madeTool(on.hub, on.ana, on.tools, ordersOf(on.matriz))
  const made = await madeAgent(on.hub, on.ana, on.agents, 'Com pedidos')
  const chosen = await drafted(on.hub, on.ana, on.agents, made, {
    instructions: 'Responda sobre as vendas.',
    tools: [orders.latest.id],
  })
  assert.deepEqual(chosen.draft.connections, [on.matriz], 'a tool brings its connection')
  assert.equal(chosen.draft.byTool, true)
  const published = await post(on.hub, on.ana, `${on.agents}/${made.id}/publish`, {
    revision: chosen.revision,
    message: '',
  })
  assert.equal(published.statusCode, 200, published.body)
  const offered = await offeredTo(t, on, made.id)
  assert.ok(offered?.includes('tool_pedidos_matriz'))
  assert.ok(!offered?.includes('connector_read'))
  assert.ok(!offered?.some((name) => /consultar/.test(name)), 'the free query is not marked')
})

test('a versão antiga sem a consulta livre: connections [X] sem ferramenta de X se lê como as leituras do kit de X, sem a porta de leitura, e nada é regravado', async (t) => {
  const on = await agentsOn(t)
  const made = await madeAgent(on.hub, on.ana, on.agents)
  const drafted1 = await drafted(on.hub, on.ana, on.agents, made, {
    instructions: 'Responda sobre as vendas.',
    connections: [on.matriz],
  })
  await on.hub.test.asOwner("update builder.agent set draft = draft - 'byTool' where id = $1", [
    made.id,
  ])
  const published = await post(on.hub, on.ana, `${on.agents}/${made.id}/publish`, {
    revision: drafted1.revision,
    message: '',
  })
  assert.equal(published.statusCode, 200, published.body)
  const offered = await offeredTo(t, on, made.id)
  assert.ok(offered?.includes(`tool_pedidos_${on.matriz.slice(0, 6)}`))
  assert.ok(!offered?.some((name) => /consultar|carregar/.test(name)))
  assert.ok(!offered?.includes('connector_read'))
  const [row] = await on.hub.test.asOwner('select config from builder.agent_version limit 1')
  assert.equal(Object(Object(row).config).byTool, false, 'the version keeps what it was written as')

  const saved = await drafted(on.hub, on.ana, on.agents, agentOf(published), {
    instructions: 'Responda sobre as vendas, agora.',
  })
  assert.equal(saved.draft.byTool, true)
  const operations = saved.tools.map((each) => each.operation)
  assert.ok(operations.includes('pedidos'))
  assert.ok(!operations.includes('consultar'))
})
