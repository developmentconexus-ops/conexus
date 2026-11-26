import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import type { TreatmentRunId } from '@conexus/hub-api'
import { until } from '../../platform/test-until.ts'
import { finished } from '../copies/test-lake-queue.ts'
import type { TreatmentOn } from './test-treatment.ts'
import { built, treatmentOn, treatResult } from './test-treatment.ts'
import { TreatTaskResult } from './treat-task.ts'
import type { TreatmentEnd } from './treatment-rows.ts'
import { closedIn } from './treatment-rows.ts'

const BOTH = ['tratado__sankhya_notas', 'tratado__sankhya_parceiros']

async function openRun(on: TreatmentOn) {
  await on.copyEnded()
  const [run] = await on.treatRuns()
  assert.ok(run !== undefined)
  return run
}

function resultOf(run: string) {
  const models = BOTH.map((name) => built(name))
  return {
    kind: 'RESULT',
    result: TreatTaskResult.parse(JSON.parse(treatResult(run, models))),
  } as const
}

const HELD_MS = 300

/** The close of a run as its own transaction, the way each of the queue's reads makes it. */
function closing(on: TreatmentOn, run: TreatmentRunId, end: TreatmentEnd, held?: () => void) {
  const reads = { source: on.hub.connectors.copies, treatable: on.config.aws.treatable }
  return on.hub.test.database.command(on.at, async (tx) => {
    const closed = await closedIn(reads, tx, { companyId: on.companyId, run, end })
    held?.()
    if (held !== undefined) await sleep(HELD_MS)
    return closed
  })
}

/** Two closes that meet: the first holds its transaction open after writing, and the second starts then. */
async function meeting(
  on: TreatmentOn,
  run: TreatmentRunId,
  ends: readonly [TreatmentEnd, TreatmentEnd],
) {
  const written = Promise.withResolvers<void>()
  const first = closing(on, run, ends[0], written.resolve)
  await written.promise
  const second = closing(on, run, ends[1])
  return Promise.all([first, second])
}

async function writtenBy(on: TreatmentOn) {
  const [closed, ...others] = await on.treatRuns()
  assert.deepEqual(others, [])
  const modelRuns = await on.rows(`select name from treatment.model_run order by name`)
  return { closed, names: modelRuns.map((row) => row.name) }
}

test('dois fechos da mesma rodada ao mesmo tempo: uma linha fechada, um model_run por modelo, e o segundo vê a rodada já fechada', async (t) => {
  const on = await treatmentOn(t)
  const run = await openRun(on)
  const end = resultOf(run.id)

  const answers = await meeting(on, run.id, [end, end])

  assert.deepEqual(
    answers.map((answer) => answer === null),
    [false, true],
  )
  const { closed, names } = await writtenBy(on)
  assert.deepEqual([closed?.state, closed?.failure], ['DONE', null])
  assert.deepEqual(names, BOTH)
})

test('o resultado e a parada da tarefa se encontram: quem fecha primeiro vale, o segundo não grava nada, e a parada que perde não apaga os modelos', async (t) => {
  const on = await treatmentOn(t)
  const run = await openRun(on)
  const lost = { kind: 'LOST', cause: 'ECS_STOPPED' } as const

  const answers = await meeting(on, run.id, [resultOf(run.id), lost])

  assert.deepEqual(
    answers.map((answer) => answer === null),
    [false, true],
  )
  const { closed, names } = await writtenBy(on)
  assert.deepEqual([closed?.state, closed?.failure, names], ['DONE', null, BOTH])
})

async function consuming(t: TestContext, on: TreatmentOn) {
  t.after(() => on.hub.lakeRuns.queue.stop())
  await on.hub.lakeRuns.queue.start()
}

test('a parada da tarefa com saída 0 chega antes do resultado: a rodada espera, e o resultado a fecha DONE com os modelos', async (t) => {
  const on = await treatmentOn(t)
  const run = await openRun(on)
  finished(on, { run: run.id, arn: on.taskOf(run.id).arn })
  await consuming(t, on)
  await until(() => on.aws.queued() === 0, 'the stop was read')

  on.aws.enqueue(
    treatResult(
      run.id,
      BOTH.map((name) => built(name)),
    ),
  )
  await until(async () => {
    const [row] = await on.rows(`select ended_at from treatment.run where id = $1`, [run.id])
    return row?.ended_at !== null
  }, 'the run closed')
  await on.hub.treatment.idle()

  const [closed] = await on.treatRuns()
  assert.deepEqual([closed?.id, closed?.state, closed?.failure], [run.id, 'DONE', null])
  const modelRuns = await on.rows(`select name, status from treatment.model_run order by name`)
  assert.deepEqual(
    modelRuns,
    BOTH.map((name) => ({ name, status: 'BUILT' })),
  )
})
