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
