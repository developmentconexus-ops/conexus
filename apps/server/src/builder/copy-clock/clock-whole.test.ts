import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import type { CopyRun } from '@conexus/hub-api'
import type { CopiesOn } from '../../hub/copies/test-copies.ts'
import { copiesOn, holdPage, plantCopy } from '../../hub/copies/test-copies.ts'
import { copiesUrl, enabled, listed, runsPage } from '../../hub/copies/test-routes.ts'
import { call, post } from '../../hub/identity/test-hub.ts'
import { until } from '../../platform/test-until.ts'
import { COPY_WORKFLOW } from './public.ts'

const TICK_MS = 200
const DEADLINE_MS = 60_000

function ended(runs: CopyRun[]) {
  return runs.filter((run) => run.outcome.kind !== 'RUNNING')
}

async function endedRuns(on: CopiesOn, copyId: string, count: number) {
  await until(
    async () => ended((await runsPage(on, on.ana, copyId)).runs).length === count,
    `the copy ${copyId} has ${count} ended runs`,
    DEADLINE_MS,
  )
}

async function started(on: CopiesOn, model: string) {
  const copy = await enabled(on, model)
  await endedRuns(on, copy.id, 1)
  return copy
}

function rowsOf(on: CopiesOn) {
  return on.hub.mastra.schedules.list({ workflowId: COPY_WORKFLOW })
}

function normalId(copyId: string) {
  return `schedule_${copyId}`
}

function wholeId(copyId: string) {
  return `schedule_${copyId}-whole`
}

async function due(on: CopiesOn, id: string) {
  const store = await on.hub.mastra.getStorage()?.getStore('schedules')
  assert.ok(store)
  await store.updateSchedule(id, { nextFireAt: Date.now() - 3 * 86_400_000 })
  on.hub.mastra.scheduler?.wake()
}

function wholeFlags(on: CopiesOn, copyId: string) {
  return on.hub.test.asOwner(
    'select whole from copies.copy_run where copy_id = $1 order by started_at',
    [copyId],
  )
}

test('a linha semanal anda com a cópia', { timeout: 120_000 }, async (t) => {
  const on = await copiesOn(t, undefined, TICK_MS)
  const { hub } = on
  const copy = await started(on, 'clientes')
  const url = `${copiesUrl(on)}/${copy.id}`
  const weekly = await hub.mastra.schedules.get(wholeId(copy.id))
  assert.ok(weekly && 'inputData' in weekly, 'the weekly row exists')
  assert.deepEqual(
    {
      cron: weekly.cron,
      timezone: weekly.timezone,
      inputData: weekly.inputData,
      status: weekly.status,
    },
    {
      cron: '7 4 * * 0',
      timezone: 'America/Sao_Paulo',
      inputData: { version: 1, companyId: on.companyId, copyId: copy.id, whole: true },
      status: 'active',
    },
  )
  async function statuses() {
    return [
      (await hub.mastra.schedules.get(normalId(copy.id)))?.status,
      (await hub.mastra.schedules.get(wholeId(copy.id)))?.status,
    ]
  }
  assert.equal((await post(hub, on.ana, `${url}/pause`, {})).statusCode, 200)
  assert.deepEqual(await statuses(), ['paused', 'paused'])
  assert.equal((await post(hub, on.ana, `${url}/resume`, {})).statusCode, 200)
  assert.deepEqual(await statuses(), ['active', 'active'])
  assert.equal((await call(hub, on.ana, 'DELETE', url)).statusCode, 200)
  assert.deepEqual(await rowsOf(on), [])
})

test('a cópia que relê tudo não tem linha semanal', { timeout: 120_000 }, async (t) => {
  const on = await copiesOn(t, undefined, TICK_MS)
  const copy = await started(on, 'clientes')
  await plantCopy(on, copy.id, "definition = jsonb_set(definition, '{changedSince}', 'null')")
  const [planted] = await on.hub.test.asOwner(
    "select definition->'changedSince' is null as gone, definition->>'changedSince' is null as sql_null from copies.copy where id = $1",
    [copy.id],
  )
  assert.deepEqual(planted, { gone: false, sql_null: true }, 'a data de alteração agora é nula')
  const changed = await call(on.hub, on.ana, 'PATCH', `${copiesUrl(on)}/${copy.id}`, {
    interval: '2h',
  })
  assert.equal(changed.statusCode, 200, changed.body)
  assert.equal(await on.hub.mastra.schedules.get(wholeId(copy.id)), null)
  assert.equal((await on.hub.mastra.schedules.get(normalId(copy.id)))?.cron, '0 */2 * * *')
  const url = `${copiesUrl(on)}/${copy.id}`
  assert.equal((await post(on.hub, on.ana, `${url}/pause`, {})).statusCode, 200)
  assert.equal((await on.hub.mastra.schedules.get(normalId(copy.id)))?.status, 'paused')
  assert.equal((await post(on.hub, on.ana, `${url}/resume`, {})).statusCode, 200)
  assert.equal((await on.hub.mastra.schedules.get(normalId(copy.id)))?.status, 'active')
})

test('a lista de cópias mostra uma entrada por cópia', { timeout: 120_000 }, async (t) => {
  const on = await copiesOn(t, undefined, TICK_MS)
  const copy = await started(on, 'clientes')
  // The weekly row made last and paused, so that a list that read it as the copy's would show.
  await on.hub.mastra.schedules.delete(wholeId(copy.id))
  await on.hub.copies.ensureWholeLines()
  await on.hub.mastra.schedules.pause(wholeId(copy.id))
  const read = await call(on.hub, on.ana, 'GET', copiesUrl(on))
  const copies: { id: string }[] = Object(read.json()).copies
  assert.equal(copies.filter((each) => each.id === copy.id).length, 1)
  const normal = await on.hub.mastra.schedules.get(normalId(copy.id))
  const shown = await listed(on, on.ana, copy.id)
  assert.deepEqual(shown.schedule, {
    kind: 'ACTIVE',
    nextRunAt: new Date(Number(normal?.nextFireAt)).toISOString(),
  })
})

test('a linha semanal que falha ao nascer não perde a primeira rodada', {
  timeout: 120_000,
}, async (t) => {
  const on = await copiesOn(t, undefined, TICK_MS)
  const { schedules } = on.hub.mastra
  const create = schedules.create.bind(schedules)
  let failed = false
  t.mock.method(schedules, 'create', (input: Parameters<typeof create>[0]) => {
    if (!failed && input.id?.endsWith('-whole')) {
      failed = true
      return Promise.reject(Object.assign(new Error('CREATE FAILED'), { domain: 'STORAGE' }))
    }
    return create(input)
  })
  const key = randomUUID()
  const body = { from: 'MODEL', connectionId: on.connectionId, model: 'clientes', interval: '30m' }
  const first = await post(on.hub, on.ana, copiesUrl(on), body, key)
  assert.notEqual(first.statusCode, 201, first.body)
  assert.deepEqual(await rowsOf(on), [], 'nenhuma linha, nem a normal')
  const again = await post(on.hub, on.ana, copiesUrl(on), body, key)
  assert.equal(again.statusCode, 201, again.body)
  const copyId = String(Object(again.json()).copy.id)
  await endedRuns(on, copyId, 1)
  assert.equal((await rowsOf(on)).length, 2)
  assert.equal((await runsPage(on, on.ana, copyId)).runs.length, 1, 'uma rodada só')
})

test('a linha semanal dispara a passada inteira', { timeout: 120_000 }, async (t) => {
  const on = await copiesOn(t, undefined, TICK_MS)
  const copy = await started(on, 'clientes')
  await due(on, wholeId(copy.id))
  await endedRuns(on, copy.id, 2)
  assert.deepEqual(await wholeFlags(on, copy.id), [{ whole: false }, { whole: true }])
})

test('a linha semanal com uma rodada aberta é pulada', { timeout: 120_000 }, async (t) => {
  const on = await copiesOn(t, undefined, TICK_MS)
  const copy = await started(on, 'clientes')
  const held = holdPage(on)
  assert.equal((await post(on.hub, on.ana, `${copiesUrl(on)}/${copy.id}/run`, {})).statusCode, 202)
  await held.arrived
  await due(on, wholeId(copy.id))
  await until(
    () =>
      on.hub.lines.some(
        (line) =>
          line.message === 'COPY_WHOLE_PASS_SKIPPED' &&
          line.fields.copyId === copy.id &&
          line.fields.companyId === on.companyId,
      ),
    'the weekly fire is skipped',
    DEADLINE_MS,
  )
  assert.deepEqual(await wholeFlags(on, copy.id), [{ whole: false }, { whole: false }])
  held.release()
  await endedRuns(on, copy.id, 2)
})

test('a cópia que sumiu leva as duas linhas', { timeout: 120_000 }, async (t) => {
  const on = await copiesOn(t, undefined, TICK_MS)
  const copy = await started(on, 'clientes')
  await on.hub.test.asOwner('delete from copies.copy where id = $1', [copy.id])
  await due(on, normalId(copy.id))
  await until(async () => (await rowsOf(on)).length === 0, 'both rows leave', DEADLINE_MS)
})

test('ao subir, a cópia antiga ganha a linha semanal', { timeout: 120_000 }, async (t) => {
  const on = await copiesOn(t, undefined, TICK_MS)
  const { hub } = on
  const copy = await started(on, 'clientes')
  assert.equal((await post(hub, on.ana, `${copiesUrl(on)}/${copy.id}/pause`, {})).statusCode, 200)
  await hub.mastra.schedules.delete(wholeId(copy.id))
  const normalBefore = await hub.mastra.schedules.get(normalId(copy.id))
  const before = normalBefore?.nextFireAt
  await hub.copies.ensureWholeLines()
  const weekly = await hub.mastra.schedules.get(wholeId(copy.id))
  assert.equal(weekly?.status, 'paused', 'a semanal nasce no estado da normal')
  assert.equal((await hub.mastra.schedules.get(normalId(copy.id)))?.nextFireAt, before)
  assert.equal((await hub.mastra.schedules.get(normalId(copy.id)))?.updatedAt, normalBefore?.updatedAt)
  const stamp = weekly?.updatedAt
  await hub.copies.ensureWholeLines()
  assert.equal((await hub.mastra.schedules.get(wholeId(copy.id)))?.updatedAt, stamp)
  assert.equal((await rowsOf(on)).length, 2)
  const line = hub.lines.filter((each) => each.message === 'COPY_WHOLE_LINES').at(0)
  assert.deepEqual(line?.fields, { companies: 1, count: 1 })
})
