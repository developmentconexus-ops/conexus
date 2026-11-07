import assert from 'node:assert/strict'
import { test } from 'node:test'
import { everyRead } from '../../hub/identity/roles-world.ts'
import { call, codeOf, memberOn, post } from '../../hub/identity/test-hub.ts'
import {
  agentOf,
  agentsOn,
  drafted,
  madeAgent,
  madeTool,
  ordersOf,
  publishedNow,
  savedCodeTool,
} from './test-agents.ts'

const DORA = { name: 'Dora Reis', email: 'dora@example.test' }
const INSTRUCTIONS = 'Responda com os pedidos do dia.'

/** The company where the developer's reads lack the free query, and Dora is one. */
async function developerWithoutFreeQuery(t: Parameters<typeof agentsOn>[0]) {
  const on = await agentsOn(t)
  const dora = await memberOn(on.hub, on.companyId, DORA, 'developer')
  const without = {
    ...everyRead,
    sankhya: (everyRead.sankhya ?? []).filter((one) => one !== 'consultar'),
  }
  const changed = await call(on.hub, on.ana, 'PUT', `${on.company}/roles/developer`, {
    connectors: without,
  })
  assert.equal(changed.statusCode, 200, changed.body)
  return { ...on, dora }
}

test('a consulta livre pelo papel: publicar por quem não tem consultar dá NOT_IN_ROLE com a operação e não publica; por quem tem, publica', async (t) => {
  const on = await developerWithoutFreeQuery(t)
  const made = await madeAgent(on.hub, on.ana, on.agents)
  const chosen = await drafted(on.hub, on.ana, on.agents, made, {
    instructions: INSTRUCTIONS,
    ready: [{ connectionId: on.matriz, operation: 'consultar' }],
  })
  assert.deepEqual(
    chosen.tools.map((each) => each.operation),
    ['consultar'],
  )
  const refused = await post(on.hub, on.dora, `${on.agents}/${made.id}/publish`, {
    revision: chosen.revision,
    message: '',
  })
  assert.equal(refused.statusCode, 409, refused.body)
  assert.equal(codeOf(refused), 'NOT_IN_ROLE')
  assert.equal(Object(refused.json()).person, 'consultar')
  const after = await call(on.hub, on.ana, 'GET', `${on.agents}/${made.id}`)
  assert.deepEqual(agentOf(after).state, { kind: 'DRAFT' })

  const published = await publishedNow(on.hub, on.ana, on.agents, chosen)
  assert.deepEqual(published.state, { kind: 'PUBLISHED', version: 1, changed: false })
})

test('publicar pelo papel: uma ferramenta de leitura que o papel de quem publica tem publica, e a que ele perdeu depois recusa', async (t) => {
  const on = await developerWithoutFreeQuery(t)
  const orders = await madeTool(on.hub, on.ana, on.tools, ordersOf(on.matriz))
  const made = await madeAgent(on.hub, on.ana, on.agents)
  const chosen = await drafted(on.hub, on.ana, on.agents, made, {
    instructions: INSTRUCTIONS,
    tools: [orders.latest.id],
  })
  assert.deepEqual(chosen.draft.connections, [on.matriz])
  const lost = await call(on.hub, on.ana, 'PUT', `${on.company}/roles/developer`, {
    connectors: { sankhya: ['empresas'] },
  })
  assert.equal(lost.statusCode, 200, lost.body)
  const refused = await post(on.hub, on.dora, `${on.agents}/${made.id}/publish`, {
    revision: chosen.revision,
    message: '',
  })
  assert.equal(codeOf(refused), 'NOT_IN_ROLE')
  assert.equal(Object(refused.json()).person, 'pedidos')
})

test('a seleção: gravar uma ferramenta acrescenta a ligação dela às selecionadas, e tirar a ligação tira as ferramentas dela', async (t) => {
  const on = await agentsOn(t)
  const orders = await madeTool(on.hub, on.ana, on.tools, ordersOf(on.matriz))
  const made = await madeAgent(on.hub, on.ana, on.agents)
  const chosen = await drafted(on.hub, on.ana, on.agents, made, { tools: [orders.latest.id] })
  assert.deepEqual(chosen.draft.connections, [on.matriz])
  const unselected = await drafted(on.hub, on.ana, on.agents, chosen, { connections: [] })
  assert.deepEqual(unselected.tools, [])
  assert.deepEqual(unselected.draft.connections, [])
})

test('a ferramenta em código: declarar uma leitura que o papel de quem publica não tem dá NOT_IN_ROLE com a operação', async (t) => {
  const on = await developerWithoutFreeQuery(t)
  const lost = await call(on.hub, on.ana, 'PUT', `${on.company}/roles/developer`, {
    connectors: { sankhya: ['empresas'] },
  })
  assert.equal(lost.statusCode, 200, lost.body)
  const saved = await savedCodeTool(on)
  const made = await madeAgent(on.hub, on.ana, on.agents)
  const chosen = await drafted(on.hub, on.ana, on.agents, made, {
    instructions: INSTRUCTIONS,
    tools: [saved.latest.id],
  })
  const refused = await post(on.hub, on.dora, `${on.agents}/${made.id}/publish`, {
    revision: chosen.revision,
    message: '',
  })
  assert.equal(codeOf(refused), 'NOT_IN_ROLE')
  assert.equal(Object(refused.json()).person, 'pedidos')
  assert.deepEqual((await publishedNow(on.hub, on.ana, on.agents, chosen)).state, {
    kind: 'PUBLISHED',
    version: 1,
    changed: false,
  })
})
