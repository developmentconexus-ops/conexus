import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import type { Hub } from '../../hub/identity/test-hub.ts'
import { call, codeOf, post } from '../../hub/identity/test-hub.ts'
import { holding, hubBeside } from '../conversation/test-conversation.ts'
import type { Summary } from './test-automations.ts'
import {
  answering,
  automating,
  conversing,
  created,
  dyingHub,
  ended,
  nextSeven,
  ranNow,
  runsOf,
  salesSummary,
} from './test-automations.ts'

// The pool's idle time (POOL_LIMITS) and a margin: what lets Neon put the branch to sleep (D27).
const QUIET_MS = 15_000
/** How long the Hub waits for its turns when it is told to stop. */
const SETTLE_MS = 3_000

/** The connections Mastra's login holds open to the Hub's database. */
async function mastraOpen(hub: Hub): Promise<number> {
  const database = new URL(hub.test.mastraUrl.reveal()).pathname.slice(1)
  const [row] = await hub.test.asOwner(
    `select count(*)::int as n from pg_stat_activity where usename = 'mastra_runtime' and datname = $1`,
    [database],
  )
  return Number(Object(row).n)
}

/** The reads of Mastra's schedule table since the database was made, read in Mastra's database. */
async function scheduleReads(hub: Hub): Promise<number> {
  const read = await hub.test.mastraPool.query(
    `select coalesce(seq_scan, 0) + coalesce(idx_scan, 0) as n from pg_stat_user_tables
      where schemaname = 'mastra' and relname = 'mastra_schedules'`,
  )
  return Number(read.rows[0]?.n)
}

test('sem automação, a agenda não liga: nenhum trabalhador scheduler, nenhuma leitura da agenda depois da partida, e o pool do Mastra chega a zero', {
  timeout: 90_000,
}, async (t) => {
  const on = await automating(t)
  assert.equal(on.hub.mastra.getWorker('scheduler'), undefined)
  const automation = await created(on.hub, on.ana, on.automations, salesSummary([]))
  const deleted = await call(on.hub, on.ana, 'DELETE', `${on.automations}/${automation.id}`)
  assert.equal(deleted.statusCode, 204, deleted.body)
  await on.hub.mastra.getWorker('scheduler')?.stop()

  const back = await hubBeside(t, on.hub)
  assert.equal(back.mastra.getWorker('scheduler'), undefined)
  await sleep(QUIET_MS)
  assert.equal(await mastraOpen(on.hub), 0)
  const reads = await scheduleReads(on.hub)
  assert.ok(reads >= 1, 'the schedules were read')
  await sleep(SETTLE_MS)
  assert.equal(await scheduleReads(on.hub), reads)
})

test('a primeira automação liga a agenda, e o pool do Mastra nunca chega a zero; com uma guardada, a partida a acha e liga', {
  timeout: 90_000,
}, async (t) => {
  const on = await automating(t)
  await created(on.hub, on.ana, on.automations, salesSummary([]))
  assert.equal(on.hub.mastra.getWorker('scheduler')?.isRunning, true)
  const deadline = Date.now() + QUIET_MS
  while (Date.now() < deadline) {
    assert.ok((await mastraOpen(on.hub)) > 0, 'the scheduler holds a connection')
    await sleep(1_000)
  }
  const later = await hubBeside(t, on.hub)
  assert.equal(later.mastra.getWorker('scheduler')?.isRunning, true)
})

test('o fim do Hub: a agenda para primeiro; rodar, criar e retomar dão HUB_UPDATING; o disparo que chega depois do aviso e o turno cortado terminam INTERRUPTED; depois, rodar agora funciona', {
  timeout: 120_000,
}, async (t) => {
  const held = holding(t)
  const on = await automating(t, answering([held.reply]))
  const stopping = await hubBeside(t, on.hub)
  const automation = await created(stopping, on.ana, on.automations, salesSummary([]))
  const paused = await created(stopping, on.ana, on.automations, salesSummary([]))
  const url = `${on.automations}/${automation.id}`
  const pausedUrl = `${on.automations}/${paused.id}`
  assert.equal((await post(stopping, on.ana, `${pausedUrl}/pause`, {})).statusCode, 200)
  const runId = await ranNow(stopping, on.ana, url)
  const running = await conversing(stopping, on.ana, url, runId)
  while (on.calls.length < 1) await sleep(10)

  const closed = stopping.close(SETTLE_MS)
  const scheduler = stopping.mastra.getWorker('scheduler')
  while (scheduler?.isRunning) await sleep(10)
  for (const [path, body] of [
    [`${url}/run`, {}],
    [on.automations, salesSummary([])],
    [`${pausedUrl}/resume`, {}],
  ] as const) {
    const refused = await post(stopping, on.ana, path, body)
    assert.deepEqual([refused.statusCode, codeOf(refused)], [503, 'HUB_UPDATING'], path)
  }
  assert.equal(scheduler?.isRunning, false)
  const late = await stopping.mastra.schedules.run(paused.id)
  await closed

  const cut = await ended(on.hub, on.ana, url, runId)
  assert.deepEqual(cut.state, {
    kind: 'FAILED',
    code: 'INTERRUPTED',
    conversationId: running.state.conversationId,
  })
  const notOpened = await ended(on.hub, on.ana, pausedUrl, late.claimId)
  assert.deepEqual(notOpened.state, { kind: 'FAILED', code: 'INTERRUPTED', conversationId: null })
  const again = await ended(on.hub, on.ana, url, await ranNow(on.hub, on.ana, url))
  assert.equal(again.state.kind, 'DONE')
})

test('o processo que morreu: a execução que ficou running aparece FAILED com INTERRUPTED depois da volta, e rodar agora funciona', {
  timeout: 120_000,
}, async (t) => {
  const held = holding(t)
  const on = await automating(t, answering([held.reply]))
  const dying = await dyingHub(t, on.hub)
  const automation = await created(on.hub, on.ana, on.automations, salesSummary([]))
  const url = `${on.automations}/${automation.id}`
  const runId = await ranNow(dying.hub, on.ana, url)
  const running = await conversing(on.hub, on.ana, url, runId)
  while (on.calls.length < 1) await sleep(10)
  await dying.die()

  const back = await hubBeside(t, on.hub)
  const [cut] = (await runsOf(back, on.ana, url)).runs
  assert.deepEqual(cut?.state, {
    kind: 'FAILED',
    code: 'INTERRUPTED',
    conversationId: running.state.conversationId,
  })
  const again = await ended(back, on.ana, url, await ranNow(back, on.ana, url))
  assert.equal(again.state.kind, 'DONE')
})

test('o horário perdido: com o Hub parado, roda uma vez quando ele volta, e o próximo volta ao horário', {
  timeout: 90_000,
}, async (t) => {
  const on = await automating(t)
  const automation = await created(on.hub, on.ana, on.automations, salesSummary([]))
  await on.hub.mastra.getWorker('scheduler')?.stop()
  const store = await on.hub.mastra.getStorage()?.getStore('schedules')
  assert.ok(store)
  await store.updateSchedule(automation.id, { nextFireAt: Date.now() - 3 * 86_400_000 })

  const back = await hubBeside(t, on.hub)
  const url = `${on.automations}/${automation.id}`
  const run = await ended(back, on.ana, url)
  assert.equal(run.trigger, 'SCHEDULED')
  await sleep(SETTLE_MS)
  assert.equal((await runsOf(back, on.ana, url)).runs.length, 1)
  const listed = await call(back, on.ana, 'GET', on.automations)
  const [shown]: Summary[] = Object(listed.json()).automations
  assert.equal(shown?.nextRunAt, nextSeven(new Date()))
})
