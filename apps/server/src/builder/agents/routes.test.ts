import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { AGENT_INSTRUCTIONS_MAX } from '@conexus/hub-api'
import { call, codeOf, memberOn, plantCompany, post } from '../../hub/identity/test-hub.ts'
import type { Agent } from './test-agents.ts'
import {
  agentOf,
  agentsOn,
  drafted,
  madeAgent,
  madeTool,
  ordersOf,
  otherProject,
  patch,
  plantedTool,
} from './test-agents.ts'

const BIA = { name: 'Bia Souza', email: 'bia@example.test' }

function fieldOf(response: { json(): unknown }) {
  return [codeOf(response), Object(response.json()).field]
}

test('criar: 201 com o rascunho e os padrões; a mesma chave e o mesmo corpo dão o mesmo agente, também ao mesmo tempo; outro corpo, IDEMPOTENCY_CONFLICT', async (t) => {
  const on = await agentsOn(t)
  const key = randomUUID()
  const body = { name: 'Vendas do dia', description: 'Os pedidos de ontem.' }
  const [first, second] = await Promise.all([
    post(on.hub, on.ana, on.agents, body, key),
    post(on.hub, on.ana, on.agents, body, key),
  ])
  assert.equal(first.statusCode, 201, first.body)
  assert.equal(second.statusCode, 201, second.body)
  const agent = agentOf(first)
  assert.equal(agentOf(second).id, agent.id)
  assert.deepEqual(agent.state, { kind: 'DRAFT' })
  assert.equal(agent.revision, 1)
  assert.deepEqual(agent.draft, {
    ...{ name: 'Vendas do dia', description: 'Os pedidos de ontem.', instructions: '' },
    ...{ model: null, memory: { observational: true }, connections: [], web: false },
    ...{ appData: false, machine: false },
  })
  assert.deepEqual(agent.tools, [])
  assert.deepEqual(agent.createdBy, { personId: on.ana.id, name: 'Ana Lima' })
  assert.deepEqual(
    agent.offered.map((each) => each.connectionId),
    [on.matriz],
  )
  assert.equal(
    agent.offered[0]?.reads.find((read) => read.operation === 'pedidos')?.label,
    'Pedidos',
  )
  const other = await post(on.hub, on.ana, on.agents, { name: 'Outro' }, key)
  assert.equal(other.statusCode, 409, other.body)
  assert.equal(codeOf(other), 'IDEMPOTENCY_CONFLICT')
  const list = await call(on.hub, on.ana, 'GET', on.listed)
  assert.equal(list.statusCode, 200, list.body)
  assert.deepEqual(
    Object(list.json()).agents.map((each: Agent) => [each.id, each.name]),
    [[agent.id, 'Vendas do dia']],
  )
  const created = on.lines.filter((line) => line.message === 'AGENT_CREATED')
  assert.deepEqual(
    created.map((line) => line.fields),
    [{ companyId: on.companyId, agentId: agent.id }],
  )
})

test('o rascunho: revision igual grava e sobe; velho dá AGENT_DRAFT_STALE e nada muda; ligação não oferecida, modelo fora do seletor e instruções longas dão REQUEST_MALFORMED', async (t) => {
  const on = await agentsOn(t)
  const made = await madeAgent(on.hub, on.ana, on.agents)
  const url = `${on.agents}/${made.id}`
  const saved = await drafted(on.hub, on.ana, on.agents, made, {
    instructions: 'Os pedidos do dia.',
    model: 'anthropic/claude-sonnet-5-5',
    connections: [on.matriz],
  })
  assert.equal(saved.revision, 2)
  assert.equal(saved.draft.instructions, 'Os pedidos do dia.')
  assert.deepEqual(saved.draft.connections, [on.matriz])
  const stale = await patch(on.hub, on.ana, `${url}/draft`, { revision: 1, name: 'Velho' })
  assert.equal(stale.statusCode, 409, stale.body)
  assert.equal(codeOf(stale), 'AGENT_DRAFT_STALE')
  assert.deepEqual(agentOf(await call(on.hub, on.ana, 'GET', url)), saved)

  const filial = await patch(on.hub, on.ana, `${url}/draft`, {
    revision: 2,
    connections: [on.filial],
  })
  assert.equal(filial.statusCode, 400, filial.body)
  assert.deepEqual(fieldOf(filial), ['REQUEST_MALFORMED', 'connections'])
  const model = await patch(on.hub, on.ana, `${url}/draft`, { revision: 2, model: 'nada/modelo' })
  assert.deepEqual(fieldOf(model), ['REQUEST_MALFORMED', 'model'])
  const long = await patch(on.hub, on.ana, `${url}/draft`, {
    revision: 2,
    instructions: 'a'.repeat(AGENT_INSTRUCTIONS_MAX + 1),
  })
  assert.equal(long.statusCode, 400, long.body)
  assert.equal(codeOf(long), 'REQUEST_MALFORMED')
  assert.deepEqual(agentOf(await call(on.hub, on.ana, 'GET', url)), saved)
  // The cap's measure: the Mastra 1.79 starter agent renders 1,457 characters of instructions by
  // default (templates/template-starter-agent, measured 2026-11-02).
  const full = await drafted(on.hub, on.ana, on.agents, saved, {
    instructions: 'a'.repeat(AGENT_INSTRUCTIONS_MAX),
  })
  assert.equal(full.draft.instructions.length, AGENT_INSTRUCTIONS_MAX)
})

test('as ferramentas do rascunho: escolher troca as ferramentas e sobe o revision; a escolhida e a mais nova; outra empresa, ligação não recebida ou a mesma ferramenta duas vezes dão AGENT_TOOL_REFUSED; uma pronta entra na biblioteca', async (t) => {
  const on = await agentsOn(t)
  const tool = await madeTool(on.hub, on.ana, on.tools, ordersOf(on.matriz))
  const made = await madeAgent(on.hub, on.ana, on.agents)
  const url = `${on.agents}/${made.id}`
  const chosen = await drafted(on.hub, on.ana, on.agents, made, { tools: [tool.latest.id] })
  assert.equal(chosen.revision, 2)
  const v2 = {
    description: 'Os pedidos da empresa 2.',
    bound: { codigoEmpresa: 2 },
    open: ['page'],
    basedOn: 1,
  }
  const grown = await post(on.hub, on.ana, `${on.tools}/${tool.id}/versions`, v2)
  assert.equal(grown.statusCode, 201, grown.body)
  const read = agentOf(await call(on.hub, on.ana, 'GET', url))
  assert.deepEqual(
    read.tools.map((each) => [each.slug, each.effect, each.version.number, each.latest.number]),
    [['pedidos_matriz', 'READ', 1, 2]],
  )
  const latest = Object(grown.json()).tool.latest.id
  const twice = await patch(on.hub, on.ana, `${url}/draft`, {
    revision: 2,
    tools: [tool.latest.id, latest],
  })
  assert.equal(twice.statusCode, 422, twice.body)
  assert.deepEqual(fieldOf(twice), ['AGENT_TOOL_REFUSED', 'tools'])

  const elsewhere = await plantCompany(on.hub.test, on.ana.id, 'Outra Empresa')
  const theirs = await plantedTool(on.hub, elsewhere, on.matriz)
  const foreign = await patch(on.hub, on.ana, `${url}/draft`, {
    revision: 2,
    tools: [theirs.versionId],
  })
  assert.deepEqual(fieldOf(foreign), ['AGENT_TOOL_REFUSED', 'tools'])
  const ready = await drafted(on.hub, on.ana, on.agents, read, {
    tools: [latest],
    ready: [{ connectionId: on.matriz, operation: 'clientes' }],
  })
  assert.deepEqual(
    ready.tools.map((each) => [each.operation, each.version.number]),
    [
      ['clientes', 1],
      ['pedidos', 2],
    ],
  )
  const library = Object((await call(on.hub, on.ana, 'GET', on.tools)).json())
  assert.equal(
    library.ready.some((each: { operation: string }) => each.operation === 'clientes'),
    false,
  )

  const revoked = `${on.company}/projects/${on.projectId}/connections/${on.matriz}`
  assert.equal((await call(on.hub, on.ana, 'DELETE', revoked)).statusCode, 204)
  const lost = await patch(on.hub, on.ana, `${url}/draft`, {
    revision: ready.revision,
    tools: [latest],
  })
  assert.deepEqual(fieldOf(lost), ['AGENT_TOOL_REFUSED', 'tools'])
})

test('a lista conta as ferramentas: cada agente traz quantas o rascunho tem, e zero sem nenhuma', async (t) => {
  const on = await agentsOn(t)
  const tool = await madeTool(on.hub, on.ana, on.tools, ordersOf(on.matriz))
  const bare = await madeAgent(on.hub, on.ana, on.agents)
  const equipped = await madeAgent(on.hub, on.ana, on.agents)
  await drafted(on.hub, on.ana, on.agents, equipped, { tools: [tool.latest.id] })
  const list = await call(on.hub, on.ana, 'GET', on.listed)
  assert.equal(list.statusCode, 200, list.body)
  assert.deepEqual(
    Object(list.json()).agents.map((each: Agent & { tools: number }) => [each.id, each.tools]),
    [
      [bare.id, 0],
      [equipped.id, 1],
    ],
  )
})

test('as recusas: o membro e um Projeto de outra empresa dão NOT_FOUND; o agente de outro Projeto, AGENT_NOT_FOUND; nome vazio ou acima de 80, REQUEST_MALFORMED', async (t) => {
  const on = await agentsOn(t)
  const made = await madeAgent(on.hub, on.ana, on.agents)
  const url = `${on.agents}/${made.id}`
  const tool = await madeTool(on.hub, on.ana, on.tools, ordersOf(on.matriz))
  const toolUrl = `${on.tools}/${tool.id}`
  const bia = await memberOn(on.hub, on.companyId, BIA, 'member')
  const asked = [
    await call(on.hub, bia, 'GET', on.listed),
    await post(on.hub, bia, on.agents, { name: 'Dela' }),
    await call(on.hub, bia, 'GET', url),
    await patch(on.hub, bia, `${url}/draft`, { revision: 1, name: 'Dela' }),
    await post(on.hub, bia, `${url}/publish`, { revision: 1, message: '' }),
    await call(on.hub, bia, 'GET', `${url}/versions`),
    await post(on.hub, bia, `${url}/versions/1/activate`, {}),
    await call(on.hub, bia, 'DELETE', url),
    await call(on.hub, bia, 'GET', on.tools),
    await post(on.hub, bia, on.tools, ordersOf(on.matriz, { slug: 'dela' })),
    await call(on.hub, bia, 'GET', toolUrl),
    await post(on.hub, bia, `${toolUrl}/versions`, {
      ...{ description: 'Dela.', bound: {}, open: [] },
      basedOn: 1,
    }),
    await call(on.hub, bia, 'DELETE', toolUrl),
  ]
  assert.deepEqual(
    asked.map((each) => [each.statusCode, codeOf(each)]),
    asked.map(() => [404, 'NOT_FOUND']),
  )
  const theirs = await plantCompany(on.hub.test, bia.id, 'Outra Empresa')
  for (const strange of [
    `${on.company}/projects/${randomUUID()}/agents`,
    `/api/companies/${theirs}/projects/${on.projectId}/agents`,
  ]) {
    const nowhere = await post(on.hub, on.ana, strange, { name: 'Lá' })
    assert.deepEqual([nowhere.statusCode, codeOf(nowhere)], [404, 'NOT_FOUND'])
  }

  const vendas = await otherProject(on.hub, on.ana, on.company, [])
  const there = `${vendas.agents}/${made.id}`
  const crossed = [
    await call(on.hub, on.ana, 'GET', there),
    await patch(on.hub, on.ana, `${there}/draft`, { revision: 1, name: 'Lá' }),
    await post(on.hub, on.ana, `${there}/publish`, { revision: 1, message: '' }),
    await call(on.hub, on.ana, 'GET', `${there}/versions`),
    await post(on.hub, on.ana, `${there}/versions/1/activate`, {}),
    await call(on.hub, on.ana, 'DELETE', there),
  ]
  assert.deepEqual(
    crossed.map((each) => [each.statusCode, codeOf(each)]),
    crossed.map(() => [404, 'AGENT_NOT_FOUND']),
  )
  for (const name of ['', '   ', 'a'.repeat(81)]) {
    const refused = await post(on.hub, on.ana, on.agents, { name })
    assert.deepEqual([refused.statusCode, codeOf(refused)], [400, 'REQUEST_MALFORMED'])
  }
  assert.equal(agentOf(await call(on.hub, on.ana, 'GET', url)).name, 'Vendas do dia')
})

test('a lista da empresa: o agente de um Projeto em remoção some da lista', async (t) => {
  const on = await agentsOn(t)
  const vendas = await otherProject(on.hub, on.ana, on.company, [])
  const here = await madeAgent(on.hub, on.ana, on.agents, 'Vendas do dia')
  await madeAgent(on.hub, on.ana, vendas.agents, 'Estoque')
  await on.hub.test.asOwner('update projects.project set deleting_since = now() where id = $1', [
    vendas.projectId,
  ])
  const all = await call(on.hub, on.ana, 'GET', `${on.company}/agents`)
  assert.equal(all.statusCode, 200, all.body)
  assert.deepEqual(
    Object(all.json()).agents.map((each: Agent) => each.id),
    [here.id],
  )
})

test('a lista da empresa: sem projectId traz os agentes de todos os Projetos, com projectId só os dele; lastRunAt nulo sem execução; o membro e um Projeto de outra empresa dão NOT_FOUND', async (t) => {
  const on = await agentsOn(t)
  const vendas = await otherProject(on.hub, on.ana, on.company, [])
  const here = await madeAgent(on.hub, on.ana, on.agents, 'Vendas do dia')
  const there = await madeAgent(on.hub, on.ana, vendas.agents, 'Estoque')
  const company = `${on.company}/agents`
  const all = await call(on.hub, on.ana, 'GET', company)
  assert.equal(all.statusCode, 200, all.body)
  const listed: Agent[] = Object(all.json()).agents
  assert.deepEqual(
    listed.map((each) => [each.id, each.projectId]).toSorted(),
    [
      [here.id, on.projectId],
      [there.id, vendas.projectId],
    ].toSorted(),
  )
  assert.ok(listed.every((each) => Object(each).lastRunAt === null))
  const one = await call(on.hub, on.ana, 'GET', `${company}?projectId=${vendas.projectId}`)
  assert.deepEqual(
    Object(one.json()).agents.map((each: Agent) => each.id),
    [there.id],
  )
  const bia = await memberOn(on.hub, on.companyId, BIA, 'member')
  const theirs = await plantCompany(on.hub.test, bia.id, 'Outra Empresa')
  const refused = [
    await call(on.hub, bia, 'GET', company),
    await call(on.hub, on.ana, 'GET', `/api/companies/${theirs}/agents`),
    await call(on.hub, on.ana, 'GET', `${company}?projectId=${randomUUID().replaceAll('-', '')}`),
  ]
  assert.deepEqual(
    refused.map((each) => [each.statusCode, codeOf(each)]),
    refused.map(() => [404, 'NOT_FOUND']),
  )
})
