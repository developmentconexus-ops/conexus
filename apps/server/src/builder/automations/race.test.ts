import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { call, post } from '../../hub/identity/test-hub.ts'
import { automating, automationOf, salesSummary } from './test-automations.ts'

test('a tentativa ao mesmo tempo, de verdade: as duas criações chegam juntas à agenda, uma perde a chave, e as duas respondem 201 com a mesma automação', async (t) => {
  const on = await automating(t)
  const { schedules } = on.hub.mastra
  const arrived = Promise.withResolvers<void>()
  let waiting = 0
  const real = schedules.create.bind(schedules)
  t.mock.method(schedules, 'create', async (...args: Parameters<typeof real>) => {
    waiting += 1
    if (waiting === 2) arrived.resolve()
    await arrived.promise
    return real(...args)
  })
  const body = salesSummary([])
  const key = randomUUID()
  const [first, second] = await Promise.all([
    post(on.hub, on.ana, on.automations, body, key),
    post(on.hub, on.ana, on.automations, body, key),
  ])
  assert.deepEqual([first?.statusCode, second?.statusCode], [201, 201])
  assert.ok(first !== undefined && second !== undefined)
  assert.equal(automationOf(first).id, automationOf(second).id)
  assert.equal(
    Object((await call(on.hub, on.ana, 'GET', on.automations)).json()).automations.length,
    1,
  )
})
