import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, PersonId, ProjectId } from '@conexus/hub-api'
import { call } from '../../hub/identity/test-hub.ts'
import { building, listOf } from './test-construtor.ts'

test('o rascunho pelo Construtor: uma criação repetida, com a mesma chave da chamada, acha o mesmo agente e o Projeto fica com um só', async (t) => {
  const on = await building(t, [])
  const scope = {
    companyId: CompanyId.parse(on.companyId),
    projectId: ProjectId.parse(on.projectId),
    personId: PersonId.parse(on.ana.id),
  }
  const input = { name: 'Vendas do dia', description: 'Conta as vendas' }
  const first = await on.hub.agents.service.create(scope, input, 'call-1')
  const second = await on.hub.agents.service.create(scope, input, 'call-1')
  assert.equal(second.id, first.id)
  const listed = await call(on.hub, on.ana, 'GET', on.listed)
  assert.equal(listOf(Object(listed.json()).agents).length, 1)
})
