import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { LakeTableName } from '@conexus/hub-api'
import { until } from '../../platform/test-until.ts'
import { TEST_LAKE } from '../copies/test-lake-run.ts'
import { ANA_OWNER, BRUNO, memberOn } from '../identity/test-hub.ts'
import type { TreatmentOn } from './test-treatment.ts'
import { built, treatmentOn, treatResult } from './test-treatment.ts'

const BOTH = ['tratado__sankhya_notas', 'tratado__sankhya_parceiros']

async function answerOf(response: ReturnType<TreatmentOn['stopRun']>) {
  const answered = await response
  return [answered.statusCode, answered.json()]
}

async function consuming(t: TestContext, on: TreatmentOn) {
  t.after(() => on.hub.lakeRuns.queue.stop())
  await on.hub.lakeRuns.queue.start()
}

async function rowOf(on: TreatmentOn, run: string) {
  const [row] = await on.rows(
    `select state, failure, stopped_by, ended_at is not null as ended from treatment.run where id = $1`,
    [run],
  )
  return row
}

async function closed(on: TreatmentOn, run: string) {
  await until(async () => (await rowOf(on, run))?.ended === true, 'the run closed')
  return rowOf(on, run)
}

/** An open run with its task in the double, which keeps running after a StopTask. */
async function running(on: TreatmentOn) {
  await on.copyEnded()
  const [run] = (await on.treatRuns()).slice(-1)
  assert.ok(run !== undefined && run.state === 'RUNNING')
  on.aws.lagStops(1_000)
  return { run: run.id, arn: on.taskOf(run.id).arn }
}

/** An open run whose start never reached AWS: no task kept and none to find. */
async function taskless(on: TreatmentOn, stoppedBy: string | null = null) {
  const run = randomUUID()
  await on.rows(
    `insert into treatment.run (id, company_id, lake_id, cause, state, "select", attempt, stopped_by, started_at)
     values ($1, $2, $3, 'NOW', 'STARTING', $4, 1, $5, now())`,
    [run, on.companyId, TEST_LAKE, JSON.stringify(BOTH), stoppedBy],
  )
  return run
}

function linesOf(on: TreatmentOn, message: string) {
  return on.hub.lines.filter((line) => line.message === message).map(({ fields }) => fields)
}

test('parar com a rodada aberta: 202 sem esperar, quem pediu em stopped_by, o StopTask pedido; o fim da tarefa fecha STOPPED com quem parou, não TREAT_TASK_STOPPED', async (t) => {
  const on = await treatmentOn(t)
  const { run, arn } = await running(on)
  const calls = on.aws.calls().length

  assert.deepEqual(await answerOf(on.stopRun()), [202, { stopping: true }])
  assert.deepEqual(on.aws.calls().slice(calls), ['StopTask'])
  assert.deepEqual(await rowOf(on, run), {
    state: 'RUNNING',
    failure: null,
    stopped_by: on.ana.id,
    ended: false,
  })
  const asked = (await on.listed()).lastRun
  assert.equal(asked?.state === 'RUNNING' && asked.stopping, true)
  assert.deepEqual(linesOf(on, 'TREATMENT_STOP_ASKED'), [
    { by: on.ana.id, companyId: on.companyId, runId: run },
  ])

  on.aws.endTask(arn, 'STOPPED_BY_HUB')
  await consuming(t, on)
  assert.deepEqual(await closed(on, run), {
    state: 'STOPPED',
    failure: null,
    stopped_by: on.ana.id,
    ended: true,
  })
  const view = (await on.listed()).lastRun
  assert.deepEqual(view?.state === 'STOPPED' && view.stoppedBy, { name: ANA_OWNER.name })
})

test('parar sem rodada aberta: 200, nada escrito e nenhuma chamada à AWS', async (t) => {
  const on = await treatmentOn(t)
  const calls = on.aws.calls().length
  assert.deepEqual(await answerOf(on.stopRun()), [200, { stopping: false }])
  assert.deepEqual(on.aws.calls().slice(calls), [])
  assert.deepEqual(await on.treatRuns(), [])
})

test('parar sem tarefa: a rodada fecha STOPPED na hora; dois pedidos guardam quem pediu primeiro e pedem o StopTask de novo', async (t) => {
  const on = await treatmentOn(t)
  const bare = await taskless(on)
  assert.deepEqual(await answerOf(on.stopRun()), [202, { stopping: true }])
  assert.deepEqual(await rowOf(on, bare), {
    state: 'STOPPED',
    failure: null,
    stopped_by: on.ana.id,
    ended: true,
  })

  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'admin')
  const { run } = await running(on)
  const calls = on.aws.calls().length
  assert.deepEqual(await answerOf(on.stopRun(bruno)), [202, { stopping: true }])
  assert.deepEqual(await answerOf(on.stopRun()), [202, { stopping: true }])
  assert.deepEqual(on.aws.calls().slice(calls), ['StopTask', 'StopTask'])
  assert.equal((await rowOf(on, run))?.stopped_by, bruno.id)
})

test('o varredor fecha STOPPED a rodada com pedido cuja tarefa sumiu, e TREAT_TASK_STOPPED a sem pedido', async (t) => {
  const on = await treatmentOn(t)
  const asked = await taskless(on, on.ana.id)
  await on.hub.treatment.sweepAll()
  assert.deepEqual(await rowOf(on, asked), {
    state: 'STOPPED',
    failure: null,
    stopped_by: on.ana.id,
    ended: true,
  })
  const lost = await taskless(on)
  await on.hub.treatment.sweepAll()
  assert.deepEqual(await rowOf(on, lost), {
    state: 'FAILED',
    failure: 'TREAT_TASK_STOPPED',
    stopped_by: null,
    ended: true,
  })
  assert.deepEqual(
    linesOf(on, 'TREATMENT_RUN_SWEPT').map(({ reason }) => reason),
    ['NO_TASK', 'NO_TASK'],
  )
})

test('o resultado que chega depois do pedido vale; a rodada parada não abre a próxima pelo pending, e os modelos que ela pedia entram na próxima seleção como falhos', async (t) => {
  const on = await treatmentOn(t)
  const { run } = await running(on)
  assert.deepEqual(await answerOf(on.stopRun()), [202, { stopping: true }])
  on.aws.enqueue(
    treatResult(
      run,
      BOTH.map((name) => built(name)),
    ),
  )
  await consuming(t, on)
  assert.deepEqual(await closed(on, run), {
    state: 'DONE',
    failure: null,
    stopped_by: on.ana.id,
    ended: true,
  })

  const now = await on.treatNow()
  assert.equal(now.statusCode, 202, now.body)
  await on.hub.treatment.idle()
  const parceiros = [LakeTableName.parse('sankhya_parceiros')]
  const coalesced = await on.hub.treatment.hooks.afterCopy(on.companyId, parceiros)
  assert.equal(Object(coalesced).kind, 'COALESCED')
  const [, stopped] = await on.treatRuns()
  assert.ok(stopped !== undefined)
  assert.deepEqual(await answerOf(on.stopRun()), [202, { stopping: true }])
  const arn = on.taskOf(stopped.id).arn
  on.aws.endTask(arn, 'STOPPED_BY_HUB')
  assert.equal((await closed(on, stopped.id))?.state, 'STOPPED')
  await on.hub.treatment.idle()
  assert.equal((await on.treatRuns()).length, 2, 'the pending tables open no run')

  await on.copyEnded(['sankhya_vendedores'])
  const [, , next] = await on.treatRuns()
  assert.deepEqual(next?.select, BOTH)
})
