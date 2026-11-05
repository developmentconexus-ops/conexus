import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import type { Hub } from '../../hub/identity/test-hub.ts'
import { call, codeOf, post } from '../../hub/identity/test-hub.ts'
import { TEST_IDLE_MS } from '../../platform/test-mastra-database.ts'
import { holding, hubBeside } from '../conversation/test-conversation.ts'
import type { Summary } from './test-automations.ts'
import {
  answering,
  automating,
  conversing,
  created,
  dueNow,
  dyingHub,
  ended,
  nextSeven,
  ranNow,
  runsOf,
  salesSummary,
  TEST_CLOCK,
} from './test-automations.ts'

// The test pool's idle time and a margin: what lets Neon put the branch to sleep (D27).
const QUIET_MS = TEST_IDLE_MS + 2_000
/** How long the Hub waits for its turns when it is told to stop. */
const SETTLE_MS = 3_000
/** Five ticks of the scheduler: a fire or a read that was going to come would have come by now. */
const TICKS_MS = 5 * TEST_CLOCK.schedulerTickMs

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
  await sleep(TICKS_MS)
  assert.equal(await scheduleReads(on.hub), reads)
})

/** The São Paulo minute `ahead` ms from now, as a cadence's `time` names it. */
function minuteAhead(ahead: number): string {
  const at = new Date(Date.now() + ahead)
  return new Intl.DateTimeFormat('pt-BR', {
    ...{ timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' },
  }).format(at)
}

test('a primeira automação liga a agenda, que dorme até o próximo disparo: o pool do Mastra chega a zero, uma automação nova a acorda e dispara, e uma guardada é achada na partida', {
  timeout: 180_000,
}, async (t) => {
  const on = await automating(t)
  const far = { kind: 'DAILY', time: minuteAhead(12 * 3_600_000) }
  await created(on.hub, on.ana, on.automations, salesSummary([], { cadence: far }))
  assert.equal(on.hub.mastra.getWorker('scheduler')?.isRunning, true)
  await sleep(QUIET_MS)
  assert.equal(await mastraOpen(on.hub), 0)
  const asleep = await scheduleReads(on.hub)
  await sleep(SETTLE_MS)
  assert.equal(await scheduleReads(on.hub), asleep, 'no read while it sleeps')

  const cadence = { kind: 'DAILY', time: minuteAhead(70_000) }
  const soon = await created(on.hub, on.ana, on.automations, salesSummary([], { cadence }))
  const fired = await ended(on.hub, on.ana, `${on.automations}/${soon.id}`)
  assert.equal(fired.trigger, 'SCHEDULED')
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

test('o processo que morreu entre publicar e criar a execução: a linha da agenda sem execução aparece FAILED com INTERRUPTED, e rodar agora funciona', async (t) => {
  const on = await automating(t)
  const automation = await created(on.hub, on.ana, on.automations, salesSummary([]))
  const url = `${on.automations}/${automation.id}`
  const store = await on.hub.mastra.getStorage()?.getStore('schedules')
  assert.ok(store, 'the schedules store')
  const firedAt = Date.now() - 60_000
  await store.recordTrigger({
    ...{ scheduleId: automation.id, scheduledFireAt: firedAt, actualFireAt: firedAt },
    ...{ runId: `sched_${automation.id}_${firedAt}`, outcome: 'published', triggerKind: 'manual' },
  })
  const [cut] = (await runsOf(on.hub, on.ana, url)).runs
  assert.deepEqual(cut?.state, { kind: 'FAILED', code: 'INTERRUPTED', conversationId: null })
  const again = await ended(on.hub, on.ana, url, await ranNow(on.hub, on.ana, url))
  assert.equal(again.state.kind, 'DONE')
})

test('o horário perdido: com o Hub parado, roda uma vez quando ele volta, e o próximo volta ao horário', {
  timeout: 90_000,
}, async (t) => {
  const on = await automating(t)
  const automation = await created(on.hub, on.ana, on.automations, salesSummary([]))
  await on.hub.mastra.getWorker('scheduler')?.stop()
  await dueNow(on.hub, automation.id)

  const back = await hubBeside(t, on.hub)
  const url = `${on.automations}/${automation.id}`
  const run = await ended(back, on.ana, url)
  assert.equal(run.trigger, 'SCHEDULED')
  await sleep(TICKS_MS)
  assert.equal((await runsOf(back, on.ana, url)).runs.length, 1)
  const listed = await call(back, on.ana, 'GET', on.automations)
  const [shown]: Summary[] = Object(listed.json()).automations
  assert.equal(shown?.nextRunAt, nextSeven(new Date()))
})
