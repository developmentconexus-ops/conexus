import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CONSTRUTOR_TOOL, CompanyId, PersonId, ProjectId } from '@conexus/hub-api'
import { call } from '../../hub/identity/test-hub.ts'
import { building, listOf } from './test-construtor.ts'
import { construtorTools } from './tools.ts'

test('o rascunho pelo Construtor: um passo repetido de agent_draft, com a mesma chamada, acha o mesmo agente e o Projeto fica com um só', async (t) => {
  const on = await building(t, [])
  const scope = {
    companyId: CompanyId.parse(on.companyId),
    projectId: ProjectId.parse(on.projectId),
    personId: PersonId.parse(on.ana.id),
  }
  const tools = construtorTools(
    {
      agents: on.hub.agents.service,
      tools: on.hub.agents.tools,
      log: { info: () => undefined, error: () => undefined },
      project: () => Promise.reject(new Error('not read here')),
      automations: () => Promise.resolve([]),
      test: () => Promise.reject(new Error('not tested here')),
    },
    scope,
  )
  const draft = Object(tools[CONSTRUTOR_TOOL.agentDraft])
  const again = { agent: { toolCallId: 'call-1' } }
  const input = { name: 'Vendas do dia', description: 'Conta as vendas' }
  const first = await draft.execute(input, again)
  const second = await draft.execute(input, again)
  assert.equal(first.kind, 'SAVED')
  assert.equal(second.agent.id, first.agent.id)
  const listed = await call(on.hub, on.ana, 'GET', on.listed)
  assert.equal(listOf(Object(listed.json()).agents).length, 1)
})
