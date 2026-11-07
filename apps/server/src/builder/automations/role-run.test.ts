import assert from 'node:assert/strict'
import { test } from 'node:test'
import { call, memberOn } from '../../hub/identity/test-hub.ts'
import { reading } from '../assistant/test-assistant.ts'
import { automating, created, ended, ranNow, salesSummary } from './test-automations.ts'

const DIEGO = { name: 'Diego Reis', email: 'diego@example.test' }

test('a automação roda pelo papel do dono: o modelo recebe só o que o papel do dono lê, e a consulta que o papel dele não tem não chega ao dublê', async (t) => {
  const on = await automating(t, [[reading('Matriz')]])
  const diego = await memberOn(on.hub, on.companyId, DIEGO, 'developer')
  const without = await call(on.hub, on.ana, 'PUT', `${on.company}/roles/developer`, {
    connectors: { sankhya: ['pedidos'] },
  })
  assert.equal(without.statusCode, 200, without.body)
  const body = salesSummary([on.matriz], { projectId: on.projectId })
  const automation = await created(on.hub, diego, on.automations, body)
  const url = `${on.automations}/${automation.id}`
  const run = await ended(on.hub, diego, url, await ranNow(on.hub, diego, url))
  assert.equal(run.state.kind, 'DONE')
  const answered = JSON.stringify(on.calls[1])
  assert.ok(answered.includes('sankhya.pedidos'), 'the model is offered what the owner may read')
  assert.ok(!answered.includes('sankhya.empresas'))
  assert.equal(on.hub.lines.filter((line) => line.message === 'CONNECTOR_CALLED').length, 0)
})
