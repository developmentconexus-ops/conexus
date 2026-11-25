import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { ConnectionId } from '@conexus/hub-api'
import { endOf } from '../../harness/routes/test-conversation.ts'
import { tool } from '../../harness/routes/test-questions.ts'
import type { Principal } from '../../hub/access/public.ts'
import { call, memberOn, post } from '../../hub/identity/test-hub.ts'
import { said, talking } from '../assistant/test-assistant.ts'
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

test('selecionar a ligação não dá leitura ao vivo: o modelo recebe o caderno dela e as duas ferramentas do dado copiado, e a Consulta livre só chega com a ferramenta marcada', async (t) => {
  const on = await agentsOn(t)
  const only = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Responda sobre as vendas.',
    connections: [on.matriz],
  })
  assert.deepEqual(await offeredTo(t, on, only.id), [
    'connector_notes',
    'data_describe',
    'data_query',
  ])

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
  assert.ok(offered?.includes('connector_notes'))
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

test('o caderno fora da versão: a versão que não seleciona a Matriz que o Projeto recebeu lê o caderno dela como NOT_GRANTED', async (t) => {
  const on = await agentsOn(t)
  const door = on.hub.connectors.assistant
  const asked: Principal[] = []
  const listed = door.connections.bind(door)
  door.connections = (scope) => {
    asked.push(scope)
    return listed(scope)
  }
  const none = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Responda sem os sistemas.',
    connections: [],
  })
  assert.ok(!(await offeredTo(t, on, none.id))?.includes('connector_notes'))
  const run = asked.findLast((scope) => scope.consumer === 'agent')
  assert.ok(run, "the agent's run asked the door as its version")
  assert.equal(await door.notes(run, ConnectionId.parse(on.matriz)), null)
  const line = on.lines.findLast((each) => each.message === 'ASSISTANT_READ_REFUSED')
  assert.equal(line?.fields.reason, 'NOT_CHOSEN')
})

const DORA = { name: 'Dora Reis', email: 'dora@example.test' }

async function ordersRunBy(t: TestContext, who: 'DORA' | 'ANA', body: object = {}) {
  const on = await agentsOn(t, [[tool('tool_pedidos_matriz', { page: 1 })], [said('Pronto.')]])
  const orders = await madeTool(on.hub, on.ana, on.tools, ordersOf(on.matriz))
  const agent = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Responda sobre os pedidos.',
    connections: [on.matriz],
    tools: [orders.latest.id],
  })
  const dora = await memberOn(on.hub, on.companyId, DORA, 'developer')
  const narrowed = await call(on.hub, on.ana, 'PUT', `${on.company}/roles/developer`, {
    connectors: { sankhya: ['empresas'] },
    unattended: false,
  })
  assert.equal(narrowed.statusCode, 200, narrowed.body)
  const person = who === 'DORA' ? dora : on.ana
  const url = await talkedTo(on.hub, person, on.agents, agent.id, body)
  const before = on.lines.filter((line) => line.message === 'CONNECTOR_CALLED').length
  assert.equal(endOf(await (await talking(t, on.hub, person, url)).say('Os pedidos?')), 'complete')
  const answered = on.calls[1]?.texts.join('\n') ?? ''
  const called = on.lines.filter((line) => line.message === 'CONNECTOR_CALLED').length - before
  return { answered, called }
}

test('o teto: o agente salvo rodado por um Desenvolvedor sem a leitura é recusado, nada ao dublê; pelo Dono, lê', async (t) => {
  const refused = await ordersRunBy(t, 'DORA')
  assert.match(refused.answered, /NOT_IN_ROLE/)
  assert.equal(refused.called, 0)
  const read = await ordersRunBy(t, 'ANA')
  assert.doesNotMatch(read.answered, /NOT_IN_ROLE/)
  assert.equal(read.called, 1)
})

test('o teto do rascunho: a conversa de teste segue o mesmo teto', async (t) => {
  const refused = await ordersRunBy(t, 'DORA', { draft: true })
  assert.match(refused.answered, /NOT_IN_ROLE/)
  assert.equal(refused.called, 0)
  const read = await ordersRunBy(t, 'ANA', { draft: true })
  assert.doesNotMatch(read.answered, /NOT_IN_ROLE/)
  assert.equal(read.called, 1)
})
