import assert from 'node:assert/strict'
import { test } from 'node:test'
import { call, codeOf, memberOn, post } from '../../hub/identity/test-hub.ts'
import { agentOf, agentsOn, madeAgent, madeTool, ordersOf, patch } from './test-agents.ts'

const DIEGO = { name: 'Diego Reis', email: 'diego@example.test' }

test('o desenvolvedor: as rotas de agentes e de ferramentas respondem a ele como ao administrador, e a lista da empresa também; o membro, NOT_FOUND em todas', async (t) => {
  const on = await agentsOn(t)
  const diego = await memberOn(on.hub, on.companyId, DIEGO, 'developer')
  const made = await post(on.hub, diego, on.agents, { name: 'Vendas do dia' })
  assert.equal(made.statusCode, 201, made.body)
  const url = `${on.agents}/${agentOf(made).id}`
  const tool = await madeTool(on.hub, diego, on.tools, ordersOf(on.matriz))
  const answered = [
    await call(on.hub, diego, 'GET', on.listed),
    await call(on.hub, diego, 'GET', `${on.company}/agents`),
    await call(on.hub, diego, 'GET', url),
    await patch(on.hub, diego, `${url}/draft`, { revision: 1, name: 'Vendas de hoje' }),
    await call(on.hub, diego, 'GET', on.tools),
    await call(on.hub, diego, 'GET', `${on.tools}/${tool.id}`),
  ]
  assert.deepEqual(
    answered.map((each) => each.statusCode),
    answered.map(() => 200),
  )
  const theirs = await madeAgent(on.hub, on.ana, on.agents, 'Da dona')
  assert.equal((await call(on.hub, diego, 'GET', `${on.agents}/${theirs.id}`)).statusCode, 200)
  const bruno = await memberOn(
    on.hub,
    on.companyId,
    { ...DIEGO, email: 'b@example.test' },
    'member',
  )
  const refused = [
    await call(on.hub, bruno, 'GET', `${on.company}/agents`),
    await call(on.hub, bruno, 'GET', on.agents),
    await call(on.hub, bruno, 'GET', on.tools),
  ]
  assert.deepEqual(
    refused.map((each) => [each.statusCode, codeOf(each)]),
    refused.map(() => [404, 'NOT_FOUND']),
  )
})
