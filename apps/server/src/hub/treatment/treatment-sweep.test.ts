import assert from 'node:assert/strict'
import { test } from 'node:test'
import { RESULT_GRACE_MS } from '../copies/public.ts'
import type { TreatmentOn } from './test-treatment.ts'
import { treatmentOn } from './test-treatment.ts'

async function open(on: TreatmentOn) {
  await on.copyEnded()
  const [run] = (await on.treatRuns()).slice(-1)
  assert.ok(run !== undefined && run.state === 'RUNNING')
  return { run: run.id, arn: on.taskOf(run.id).arn }
}

async function stateOf(on: TreatmentOn, run: string) {
  const [row] = await on.rows(`select state, failure from treatment.run where id = $1`, [run])
  return row
}

function reasons(on: TreatmentOn) {
  return on.hub.lines
    .filter((line) => line.message === 'TREATMENT_RUN_SWEPT')
    .map(({ fields }) => fields.reason)
}

test('o varredor: a tarefa que a AWS não conhece fecha a rodada com TREAT_TASK_STOPPED', async (t) => {
  const on = await treatmentOn(t)
  const { run } = await open(on)
  const unknown = on.taskOf(run).arn.replace(/[0-9a-f]{32}$/, 'f'.repeat(32))
  await on.rows(`update treatment.run set task = $1 where id = $2`, [unknown, run])
  await on.hub.treatment.sweepAll()
  assert.deepEqual(await stateOf(on, run), { state: 'FAILED', failure: 'TREAT_TASK_STOPPED' })
  assert.deepEqual(reasons(on), ['MISSING'])
})

test('o varredor: a tarefa parada dentro da espera do resultado deixa a rodada aberta', async (t) => {
  const on = await treatmentOn(t)
  const { run, arn } = await open(on)
  on.aws.endTask(arn, 'EXITED', new Date())
  await on.hub.treatment.sweepAll()
  assert.deepEqual(await stateOf(on, run), { state: 'RUNNING', failure: null })
  assert.deepEqual(reasons(on), [])
})

test('o varredor: a tarefa parada há mais que a espera do resultado fecha a rodada com TREAT_TASK_STOPPED', async (t) => {
  const on = await treatmentOn(t)
  const { run, arn } = await open(on)
  on.aws.endTask(arn, 'EXITED', new Date(Date.now() - RESULT_GRACE_MS - 60_000))
  await on.hub.treatment.sweepAll()
  assert.deepEqual(await stateOf(on, run), { state: 'FAILED', failure: 'TREAT_TASK_STOPPED' })
  assert.deepEqual(reasons(on), ['STOPPED'])
})

test('o varredor da cópia, ao abrir a rodada da ligação, não fecha a rodada de tratamento da empresa', async (t) => {
  const on = await treatmentOn(t)
  const { run } = await open(on)
  await on.rows(`update treatment.run set started_at = now() - interval '3 days' where id = $1`, [
    run,
  ])
  assert.equal((await on.run(on.connection)).statusCode, 202)
  await on.hub.lakeRuns.idle()
  assert.deepEqual(await stateOf(on, run), { state: 'RUNNING', failure: null })
  await on.hub.treatment.sweepAll()
  assert.deepEqual(await stateOf(on, run), { state: 'FAILED', failure: 'TREAT_TASK_STOPPED' })
  assert.deepEqual(reasons(on), ['STALE'])
})
