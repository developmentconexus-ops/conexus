import assert from 'node:assert/strict'
import { test } from 'node:test'
import { AgentId, CompanyId, ProjectId } from '@conexus/hub-api'
import { call, codeOf, post } from '../../hub/identity/test-hub.ts'
import { agentOf, agentsOn, drafted, madeAgent, madeTool, ordersOf, toolOf } from './test-agents.ts'

const INSTRUCTIONS = 'Responda com os pedidos do dia, por vendedor.'

function versionOf(response: { json(): unknown }) {
  return Object(response.json()).version
}

test('publicar: a versão 1 guarda o rascunho e a versão 1 da ferramenta; depois a ferramenta ganha a versão 2 e o rascunho passa a ela, e a versão 1 do agente lê igual, com a versão 1 da ferramenta', async (t) => {
  const on = await agentsOn(t)
  const tool = await madeTool(on.hub, on.ana, on.tools, ordersOf(on.matriz))
  const made = await madeAgent(on.hub, on.ana, on.agents)
  const url = `${on.agents}/${made.id}`
  const chosen = await drafted(on.hub, on.ana, on.agents, made, {
    instructions: INSTRUCTIONS,
    connections: [on.matriz],
    tools: [tool.latest.id],
  })
  const first = await post(on.hub, on.ana, `${url}/publish`, {
    revision: chosen.revision,
    message: 'Primeira',
  })
  assert.equal(first.statusCode, 200, first.body)
  assert.deepEqual(agentOf(first).state, { kind: 'PUBLISHED', version: 1, changed: false })
  assert.equal(versionOf(first).number, 1)
  assert.equal(versionOf(first).active, true)
  const again = await post(on.hub, on.ana, `${url}/publish`, {
    revision: chosen.revision,
    message: 'Primeira',
  })
  assert.equal(again.statusCode, 200, again.body)
  assert.deepEqual(versionOf(again), versionOf(first))

  const v2 = {
    description: 'Os pedidos da empresa 2.',
    bound: { codigoEmpresa: 2 },
    open: ['page'],
  }
  const grown = await post(on.hub, on.ana, `${on.tools}/${tool.id}/versions`, v2)
  assert.equal(grown.statusCode, 201, grown.body)
  assert.equal(toolOf(grown).latest.number, 2)
  const changed = await drafted(on.hub, on.ana, on.agents, agentOf(first), {
    instructions: 'Outra coisa.',
    tools: [toolOf(grown).latest.id],
  })
  assert.deepEqual(changed.state, { kind: 'PUBLISHED', version: 1, changed: true })

  const ids = { companyId: CompanyId.parse(on.companyId), projectId: ProjectId.parse(on.projectId) }
  const active = await on.hub.agents.activeOf(ids, AgentId.parse(made.id))
  assert.equal(active?.instructions, INSTRUCTIONS)
  assert.deepEqual(active?.connections, [on.matriz])
  assert.deepEqual(active?.source, { kind: 'VERSION', number: 1 })
  assert.deepEqual(
    active?.tools.map(({ slug, operation, description, bound, open }) => ({
      ...{ slug, operation, description, bound, open },
    })),
    [
      {
        ...{ slug: 'pedidos_matriz', operation: 'pedidos', bound: { codigoEmpresa: 1 } },
        ...{ description: ordersOf(on.matriz).description, open: ordersOf(on.matriz).open },
      },
    ],
  )
  const read = agentOf(await call(on.hub, on.ana, 'GET', url))
  assert.deepEqual(
    read.tools.map((each) => [each.version.number, each.latest.number]),
    [[2, 2]],
  )
  const logged = on.lines.find((line) => line.message === 'AGENT_PUBLISHED')
  assert.deepEqual(logged?.fields, { companyId: on.companyId, agentId: made.id, version: 1 })
})

test('publicar: um rascunho sem instruções, com uma ligação que o Projeto perdeu ou com uma ferramenta dela, dá AGENT_DRAFT_INVALID com o campo; um revision velho, AGENT_DRAFT_STALE', async (t) => {
  const on = await agentsOn(t)
  const tool = await madeTool(on.hub, on.ana, on.tools, ordersOf(on.matriz))
  const made = await madeAgent(on.hub, on.ana, on.agents)
  const user = await madeAgent(on.hub, on.ana, on.agents, 'Pedidos')
  const using = await drafted(on.hub, on.ana, on.agents, user, {
    instructions: INSTRUCTIONS,
    tools: [tool.latest.id],
  })
  const url = `${on.agents}/${made.id}`
  const empty = await post(on.hub, on.ana, `${url}/publish`, { revision: 1, message: '' })
  assert.equal(empty.statusCode, 422, empty.body)
  assert.equal(codeOf(empty), 'AGENT_DRAFT_INVALID')
  assert.equal(Object(empty.json()).field, 'instructions')

  const ready = await drafted(on.hub, on.ana, on.agents, made, {
    instructions: INSTRUCTIONS,
    connections: [on.matriz],
  })
  const stale = await post(on.hub, on.ana, `${url}/publish`, { revision: 1, message: '' })
  assert.equal(stale.statusCode, 409, stale.body)
  assert.equal(codeOf(stale), 'AGENT_DRAFT_STALE')

  const lost = await call(
    on.hub,
    on.ana,
    'DELETE',
    `${on.company}/projects/${on.projectId}/connections/${on.matriz}`,
  )
  assert.equal(lost.statusCode, 204, lost.body)
  const gone = await post(on.hub, on.ana, `${url}/publish`, {
    revision: ready.revision,
    message: '',
  })
  assert.equal(gone.statusCode, 422, gone.body)
  assert.equal(codeOf(gone), 'AGENT_DRAFT_INVALID')
  assert.equal(Object(gone.json()).field, 'connections')
  assert.deepEqual(agentOf(await call(on.hub, on.ana, 'GET', url)).state, { kind: 'DRAFT' })
  const unbound = await post(on.hub, on.ana, `${on.agents}/${user.id}/publish`, {
    revision: using.revision,
    message: '',
  })
  assert.equal(unbound.statusCode, 422, unbound.body)
  assert.equal(codeOf(unbound), 'AGENT_DRAFT_INVALID')
  assert.equal(Object(unbound.json()).field, 'tools')
})

test('publicar de novo o rascunho de uma versão depois de voltar a outra a torna ativa outra vez, sem versão nova', async (t) => {
  const on = await agentsOn(t)
  const made = await madeAgent(on.hub, on.ana, on.agents)
  const url = `${on.agents}/${made.id}`
  const one = await drafted(on.hub, on.ana, on.agents, made, { instructions: INSTRUCTIONS })
  const v1 = await post(on.hub, on.ana, `${url}/publish`, {
    revision: one.revision,
    message: 'Primeira',
  })
  assert.equal(v1.statusCode, 200, v1.body)
  const two = await drafted(on.hub, on.ana, on.agents, agentOf(v1), {
    instructions: 'Outra coisa.',
  })
  const v2 = await post(on.hub, on.ana, `${url}/publish`, {
    revision: two.revision,
    message: 'Segunda',
  })
  assert.equal(v2.statusCode, 200, v2.body)
  const back = await post(on.hub, on.ana, `${url}/versions/1/activate`, {})
  assert.deepEqual(agentOf(back).state, { kind: 'PUBLISHED', version: 1, changed: true })

  const again = await post(on.hub, on.ana, `${url}/publish`, {
    revision: two.revision,
    message: 'De novo',
  })
  assert.equal(again.statusCode, 200, again.body)
  assert.deepEqual(agentOf(again).state, { kind: 'PUBLISHED', version: 2, changed: false })
  assert.deepEqual([versionOf(again).number, versionOf(again).active], [2, true])
  const read = agentOf(await call(on.hub, on.ana, 'GET', url))
  assert.deepEqual(read.state, { kind: 'PUBLISHED', version: 2, changed: false })
  const listed = Object((await call(on.hub, on.ana, 'GET', `${url}/versions`)).json()).versions
  assert.deepEqual(
    listed.map((each: { number: number; active: boolean }) => [each.number, each.active]),
    [
      [2, true],
      [1, false],
    ],
  )
  const activated = on.lines.filter((line) => line.message === 'AGENT_ACTIVATED')
  assert.deepEqual(
    activated.map((line) => line.fields),
    [1, 2].map((version) => ({ companyId: on.companyId, agentId: made.id, version })),
  )
})

test('as versões: a lista diz número, quem publicou, a mensagem e a ativa; voltar à 1 não muda o rascunho; uma versão que não existe dá AGENT_VERSION_NOT_FOUND', async (t) => {
  const on = await agentsOn(t)
  const made = await madeAgent(on.hub, on.ana, on.agents)
  const url = `${on.agents}/${made.id}`
  let agent = await drafted(on.hub, on.ana, on.agents, made, { instructions: INSTRUCTIONS })
  for (const message of ['Primeira', 'Segunda']) {
    const published = await post(on.hub, on.ana, `${url}/publish`, {
      revision: agent.revision,
      message,
    })
    assert.equal(published.statusCode, 200, published.body)
    agent = await drafted(on.hub, on.ana, on.agents, agentOf(published), {
      instructions: `${INSTRUCTIONS} ${message}`,
    })
  }
  const listed = await call(on.hub, on.ana, 'GET', `${url}/versions`)
  assert.equal(listed.statusCode, 200, listed.body)
  const versions: { number: number; message: string; active: boolean; publishedBy: unknown }[] =
    Object(listed.json()).versions
  assert.deepEqual(
    versions.map(({ number, message, active, publishedBy }) => [
      number,
      message,
      active,
      publishedBy,
    ]),
    [
      [2, 'Segunda', true, { personId: on.ana.id, name: 'Ana Lima' }],
      [1, 'Primeira', false, { personId: on.ana.id, name: 'Ana Lima' }],
    ],
  )
  const back = await post(on.hub, on.ana, `${url}/versions/1/activate`, {})
  assert.equal(back.statusCode, 200, back.body)
  const after = agentOf(back)
  assert.deepEqual(after.state, { kind: 'PUBLISHED', version: 1, changed: true })
  assert.deepEqual(
    [after.revision, after.draft.instructions],
    [agent.revision, agent.draft.instructions],
  )
  const missing = await post(on.hub, on.ana, `${url}/versions/9/activate`, {})
  assert.equal(missing.statusCode, 404, missing.body)
  assert.equal(codeOf(missing), 'AGENT_VERSION_NOT_FOUND')
})
