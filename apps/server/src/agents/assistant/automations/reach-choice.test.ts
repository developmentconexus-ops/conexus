import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BRUNO, call, codeOf, memberOn, post } from '../../../hub/identity/test-hub.ts'
import { doorDropped } from '../test-door-down.ts'
import type { Summary } from './test-automations.ts'
import { automating, choiceOf, created, salesSummary } from './test-automations.ts'

test('a automação não a guarda: o desenvolvedor sem operação cria com as duas, e nem a agenda nem o resumo as nomeiam', async (t) => {
  const on = await automating(t)
  const emptied = await call(on.hub, on.ana, 'PUT', `${on.company}/roles/developer`, {
    connectors: {},
    unattended: false,
  })
  assert.equal(emptied.statusCode, 200, emptied.body)
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'developer')
  const automation = await created(
    on.hub,
    bruno,
    on.automations,
    salesSummary([on.matriz, on.filial]),
  )
  assert.deepEqual(choiceOf(automation.connections), [])
  const stored = await on.hub.mastra.schedules.get(automation.id)
  assert.deepEqual(Object(stored).inputData.connections, [])
  const listed: Summary[] = Object(
    (await call(on.hub, bruno, 'GET', on.automations)).json(),
  ).automations
  assert.deepEqual(
    listed.map((each) => choiceOf(each.connections)),
    [[]],
  )
  const hers = await created(on.hub, on.ana, on.automations, salesSummary([on.matriz, on.filial]))
  assert.deepEqual(choiceOf(hers.connections), [
    ['Matriz', true],
    ['Filial', true],
  ])
})

test('a porta fora: criar a automação responde 503 DATABASE_UNAVAILABLE, e nenhuma fica', async (t) => {
  const on = await automating(t)
  const made = await doorDropped(on.hub, () =>
    post(on.hub, on.ana, on.automations, salesSummary([on.matriz])),
  )
  assert.deepEqual([made.statusCode, codeOf(made)], [503, 'DATABASE_UNAVAILABLE'])
  const listed = await call(on.hub, on.ana, 'GET', on.automations)
  assert.deepEqual(Object(listed.json()).automations, [])
})
