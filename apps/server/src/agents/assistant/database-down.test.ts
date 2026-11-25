import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { hubBeside, MODEL, sent } from '../../harness/routes/test-conversation.ts'
import { renamed, switched } from '../../harness/routes/test-questions.ts'
import { call, codeOf, post } from '../../hub/identity/test-hub.ts'
import type { Outage } from '../../platform/test-mastra-database.ts'
import { mastraDoor, mastraPoolAt } from '../../platform/test-mastra-database.ts'
import { assisting, created } from './test-assistant.ts'
import { doorDropped } from './test-door-down.ts'

/**
 * Ana's Assistant on a Hub whose own database answers and whose Mastra database is out as
 * `outage` says: every Assistant route she calls answers 503 DATABASE_UNAVAILABLE, and a creation
 * keeps no row.
 */
async function everyRouteUnavailable(t: TestContext, outage: Outage) {
  const on = await assisting(t)
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const door = await mastraDoor(on.hub.config.mastraDatabaseUrl, outage)
  const mastraPool = mastraPoolAt(door.address)
  const broken = { ...on.hub, test: { ...on.hub.test, mastraPool } }
  const down = await hubBeside(t, broken, undefined, false)
  t.after(() => door.close())
  // Together, so that the routes wait out the connection deadline once, not once each.
  const routes = {
    list: call(down, on.ana, 'GET', on.assistant),
    create: post(down, on.ana, on.assistant, { connections: [on.matriz] }),
    read: call(down, on.ana, 'GET', url),
    choose: call(down, on.ana, 'PUT', `${url}/connections`, { connections: [] }),
    model: switched(down, on.ana, url, { model: MODEL, effort: 'off' }),
    message: sent(down, on.ana, url, 'Quanto vendemos?'),
    rename: renamed(down, on.ana, url, 'Pedidos'),
    delete: call(down, on.ana, 'DELETE', url),
  }
  const answers = Object.fromEntries(
    await Promise.all(
      Object.entries(routes).map(async ([route, answer]) => [route, await answer] as const),
    ),
  )
  // The Hub ends while its test database lives, closing Mastra through the door opened again.
  await door.open()
  await down.close()
  await mastraPool.end()
  for (const [route, answer] of Object.entries(answers)) {
    assert.equal(answer.statusCode, 503, `${route}: ${answer.body}`)
    assert.equal(codeOf(answer), 'DATABASE_UNAVAILABLE', route)
  }
  const kept = await on.hub.test.asOwner(
    'select count(*)::int as n from builder.assistant_conversation',
  )
  assert.deepEqual(kept, [{ n: 1 }], 'the refused creation kept no conversation')
  assert.equal(
    (await call(on.hub, on.ana, 'GET', url)).statusCode,
    200,
    'the refused delete kept the thread',
  )
}

test('banco do Mastra recusando a ligação: cada rota do Assistente responde 503 DATABASE_UNAVAILABLE, e criar não guarda a conversa', async (t) => {
  await everyRouteUnavailable(t, 'REFUSED')
})

test('banco do Mastra que aceita e nunca responde: o prazo de ligação dá 503 DATABASE_UNAVAILABLE em cada rota do Assistente', async (t) => {
  await everyRouteUnavailable(t, 'SILENT')
})

test('a porta fora na criação: listar e criar respondem 503 DATABASE_UNAVAILABLE, e nenhuma conversa fica', async (t) => {
  const on = await assisting(t)
  const listed = await doorDropped(on.hub, () =>
    call(on.hub, on.ana, 'GET', `${on.company}/assistant/connections`),
  )
  assert.deepEqual([listed.statusCode, codeOf(listed)], [503, 'DATABASE_UNAVAILABLE'])
  const made = await doorDropped(on.hub, () =>
    post(on.hub, on.ana, on.assistant, { connections: [on.matriz] }),
  )
  assert.deepEqual([made.statusCode, codeOf(made)], [503, 'DATABASE_UNAVAILABLE'])
  const kept = await on.hub.test.asOwner(
    'select count(*)::int as n from builder.assistant_conversation',
  )
  assert.deepEqual(kept, [{ n: 0 }], 'the refused creation kept no conversation')
  const threads = await on.hub.test.mastraPool.query(
    'select count(*)::int as n from mastra.mastra_threads',
  )
  assert.deepEqual(threads.rows, [{ n: 0 }], 'nor its thread')
})

test('a porta fora na troca: 503 DATABASE_UNAVAILABLE, e a escolha fica como estava', async (t) => {
  const on = await assisting(t)
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const changed = await doorDropped(on.hub, () =>
    call(on.hub, on.ana, 'PUT', `${url}/connections`, { connections: [] }),
  )
  assert.deepEqual([changed.statusCode, codeOf(changed)], [503, 'DATABASE_UNAVAILABLE'])
  const [row] = await on.hub.test.asOwner('select connections from builder.assistant_conversation')
  assert.deepEqual(Object(row).connections, [on.matriz])
})
