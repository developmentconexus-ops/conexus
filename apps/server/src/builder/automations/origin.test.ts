import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { call, post } from '../../hub/identity/test-hub.ts'
import type { Summary } from './test-automations.ts'
import { automating, automationOf, salesSummary } from './test-automations.ts'

function listed(response: { json(): unknown }): Summary[] {
  return Object(response.json()).automations
}

test('criar com a origem: a automação guarda a conversa e a chamada da proposta, e a lista os devolve; sem origem, null', async (t) => {
  const on = await automating(t)
  const origin = { conversationId: randomUUID(), toolCallId: 'call-propose-1' }
  const made = await post(on.hub, on.ana, on.automations, {
    ...salesSummary([on.matriz]),
    origin,
  })
  assert.equal(made.statusCode, 201, made.body)
  assert.deepEqual(automationOf(made).origin, origin)
  const bare = await post(on.hub, on.ana, on.automations, salesSummary([on.matriz]))
  assert.equal(automationOf(bare).origin, null)
  const list = await call(on.hub, on.ana, 'GET', on.automations)
  assert.deepEqual(
    listed(list)
      .map((each) => each.origin)
      .sort((x, y) => Number(x === null) - Number(y === null)),
    [origin, null],
  )
})

test('uma automação criada antes da origem: o mesmo pedido com a origem a responde, a guarda na linha e a lista a devolve', async (t) => {
  const on = await automating(t)
  const key = randomUUID()
  const body = salesSummary([on.matriz])
  const earlier = await post(on.hub, on.ana, on.automations, body, key)
  assert.equal(earlier.statusCode, 201, earlier.body)
  assert.equal(automationOf(earlier).origin, null)
  const origin = { conversationId: randomUUID(), toolCallId: 'call-propose-1' }
  const again = await post(on.hub, on.ana, on.automations, { ...body, origin }, key)
  assert.equal(again.statusCode, 201, again.body)
  assert.equal(automationOf(again).id, automationOf(earlier).id)
  assert.deepEqual(automationOf(again).origin, origin)
  const list = await call(on.hub, on.ana, 'GET', on.automations)
  assert.deepEqual(
    listed(list).map((each) => each.origin),
    [origin],
  )
  const other = await post(on.hub, on.ana, on.automations, { ...body, name: 'Outro', origin }, key)
  assert.equal(other.statusCode, 409, other.body)
})
