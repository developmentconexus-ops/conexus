import assert from 'node:assert/strict'
import { test } from 'node:test'
import { call, codeOf, memberOn, post } from '../../hub/identity/test-hub.ts'
import { automating, salesSummary } from './test-automations.ts'

const DIEGO = { name: 'Diego Reis', email: 'diego@example.test' }
const BRUNO = { name: 'Bruno Reis', email: 'bruno@example.test' }

test('o desenvolvedor: cria, lista e apaga as suas automações como o administrador; o membro recebe NOT_FOUND em todas', async (t) => {
  const on = await automating(t)
  const diego = await memberOn(on.hub, on.companyId, DIEGO, 'developer')
  const created = await post(on.hub, diego, on.automations, salesSummary([]))
  assert.equal(created.statusCode, 201, created.body)
  const id = String(Object(created.json()).automation.id)
  const listed = await call(on.hub, diego, 'GET', on.automations)
  assert.equal(listed.statusCode, 200, listed.body)
  assert.deepEqual(
    Object(listed.json()).automations.map((each: { id: string }) => each.id),
    [id],
  )
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'member')
  const refused = [
    await post(on.hub, bruno, on.automations, salesSummary([])),
    await call(on.hub, bruno, 'GET', on.automations),
    await call(on.hub, bruno, 'DELETE', `${on.automations}/${id}`),
  ]
  assert.deepEqual(
    refused.map((each) => [each.statusCode, codeOf(each)]),
    refused.map(() => [404, 'NOT_FOUND']),
  )
  assert.equal((await call(on.hub, diego, 'DELETE', `${on.automations}/${id}`)).statusCode, 204)
})
