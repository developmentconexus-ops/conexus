import assert from 'node:assert/strict'
import { test } from 'node:test'
import { hubBeside } from '../../../harness/routes/test-conversation.ts'
import { call, codeOf, post } from '../../../hub/identity/test-hub.ts'
import { mastraDoor, mastraPoolAt } from '../../../platform/test-mastra-database.ts'
import { automating, created, salesSummary } from './test-automations.ts'

test('a agenda com o banco do Mastra recusando a ligação: listar e pausar respondem 503 DATABASE_UNAVAILABLE', async (t) => {
  const on = await automating(t)
  const made = await created(on.hub, on.ana, on.automations, salesSummary([on.matriz]))
  const door = await mastraDoor(on.hub.config.mastraDatabaseUrl, 'REFUSED')
  const mastraPool = mastraPoolAt(door.address)
  const down = await hubBeside(
    t,
    { ...on.hub, test: { ...on.hub.test, mastraPool } },
    undefined,
    false,
  )
  t.after(() => door.close())
  const answers = {
    list: await call(down, on.ana, 'GET', on.automations),
    pause: await post(down, on.ana, `${on.automations}/${made.id}/pause`, {}),
  }
  // The Hub ends while its test database lives, closing Mastra through the door opened again.
  await door.open()
  await down.close()
  await mastraPool.end()
  for (const [route, answer] of Object.entries(answers)) {
    assert.equal(answer.statusCode, 503, `${route}: ${answer.body}`)
    assert.equal(codeOf(answer), 'DATABASE_UNAVAILABLE', route)
  }
})
