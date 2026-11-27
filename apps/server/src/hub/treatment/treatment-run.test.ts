import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { CompanyId, LakeTableName } from '@conexus/hub-api'
import { z } from 'zod'
import { until } from '../../platform/test-until.ts'
import { TEST_LAKE } from '../copies/test-lake-run.ts'
import type { TreatmentOn } from './test-treatment.ts'
import { built, OF_NOTAS, tableOf, treatmentOn, treatResult } from './test-treatment.ts'

const BOTH = ['tratado__sankhya_notas', 'tratado__sankhya_parceiros']
const RunTask = z.object({
  startedBy: z.string(),
  clientToken: z.string(),
  overrides: z.object({
    taskRoleArn: z.string(),
    containerOverrides: z.array(
      z.object({ environment: z.array(z.object({ name: z.string(), value: z.string() })) }),
    ),
  }),
})

function linesOf(on: TreatmentOn, message: string) {
  return on.hub.lines.filter((line) => line.message === message).map(({ fields }) => fields)
}

async function consuming(t: TestContext, on: TreatmentOn) {
  t.after(() => on.hub.lakeRuns.queue.stop())
  await on.hub.lakeRuns.queue.start()
}

async function closedRun(on: TreatmentOn, run: string) {
  await until(async () => {
    const [row] = await on.rows(`select ended_at from treatment.run where id = $1`, [run])
    return row?.ended_at !== null
  }, 'the run closed')
}

/** The open run closed by its task's result, every model it asked for built. */
async function builtAll(t: TestContext, on: TreatmentOn) {
  const runs = await on.treatRuns()
  const open = runs.find((run) => run.state === 'RUNNING')
  assert.ok(open !== undefined, 'a run is open')
  const select = z.array(z.string()).parse(open.select)
  on.aws.enqueue(
    treatResult(
      open.id,
      select.map((name) => built(name)),
    ),
  )
  if (!on.hub.lakeRuns.queue.reading()) await consuming(t, on)
  await closedRun(on, open.id)
  await on.hub.treatment.idle()
  return open.id
}

test('o fim completo de uma cópia abre a rodada da empresa: os modelos nunca gravados, a especificação no depósito de estado e o RunTask da cópia com o papel do tratamento', async (t) => {
  const on = await treatmentOn(t)
  await on.copyEnded()

  const [run, ...others] = await on.treatRuns()
  assert.ok(run !== undefined)
  assert.deepEqual(others, [])
  assert.deepEqual(
    [run.cause, run.state, run.select, run.pending, run.lake_id, run.attempt],
    ['COPY', 'RUNNING', BOTH, [], TEST_LAKE, 1],
  )
  const spec = on.specIn(run.id)
  assert.deepEqual(
    [spec.runId, spec.companyId, spec.select, spec.models.map((model) => model.name)],
    [run.id, on.companyId, BOTH, BOTH],
  )
  assert.equal(spec.queueUrl, on.config.aws.copy.queueUrl)
  const task = on.taskOf(run.id)
  assert.equal(run.task, task.arn)
  const request = RunTask.parse(
    JSON.parse(on.aws.requests().find((each) => each.includes(run.id)) ?? ''),
  )
  const { account, region } = on.config.aws
  assert.deepEqual(
    [request.startedBy, request.clientToken, request.overrides.taskRoleArn],
    [run.id, `${run.id}-1`, `arn:aws:iam::${account}:role/conexus-${TEST_LAKE}-tratador`],
  )
  assert.deepEqual(request.overrides.containerOverrides[0]?.environment, [
    {
      name: 'CONEXUS_TREAT_OBJECT',
      value: `s3://conexus-estado-${account}-${region}/tratamento/${on.companyId}/${run.id}-1.json`,
    },
  ])
  assert.deepEqual(linesOf(on, 'TREATMENT_SPEC_WRITTEN'), [
    {
      companyId: on.companyId,
      runId: run.id,
      key: `tratamento/${on.companyId}/${run.id}-1.json`,
    },
  ])
})

test('o resultado fecha a rodada e grava cada modelo; repetido, não muda nada; a próxima cópia só pede o que está abaixo do copiado, e nada abre sem modelo a tratar', async (t) => {
  const on = await treatmentOn(t)
  await on.copyEnded()
  const [run] = await on.treatRuns()
  assert.ok(run !== undefined)
  const failed = {
    name: 'tratado__sankhya_parceiros',
    status: 'FAILED',
    failure: 'COLUMN_NOT_FOUND',
    line: 2,
  }
  const sent = treatResult(run.id, [built('tratado__sankhya_notas', 7), failed])
  on.aws.enqueue(sent)
  on.aws.enqueue(sent)
  await consuming(t, on)
  await closedRun(on, run.id)
  await until(() => on.aws.queued() === 0, 'the queue emptied')

  const modelRuns = await on.rows(
    `select name, status, rows, failure, line from treatment.model_run order by name`,
  )
  assert.deepEqual(modelRuns, [
    { name: 'tratado__sankhya_notas', status: 'BUILT', rows: 7, failure: null, line: null },
    { ...failed, rows: null },
  ])
  const [closed] = await on.treatRuns()
  assert.deepEqual([closed?.state, closed?.failure], ['DONE', null])
  assert.equal(linesOf(on, 'TREATMENT_RUN_CLOSED').length, 1)

  await on.copyEnded(['sankhya_notas'])
  const [, next] = await on.treatRuns()
  assert.deepEqual(next?.select, BOTH, 'the copied table, and the one that failed last')
  await builtAll(t, on)
  await on.copyEnded(['sankhya_vendedores'])
  assert.equal((await on.treatRuns()).length, 2, 'a table with no model opens no run')
  await on.copyEnded(['sankhya_parceiros'])
  const [, , third] = await on.treatRuns()
  assert.deepEqual(third?.select, ['tratado__sankhya_parceiros'])
})

test('duas ligações: as duas cópias terminam juntas, uma rodada abre e a outra cai em pending; quando a aberta fecha, a próxima roda só pelo que ficou', async (t) => {
  const on = await treatmentOn(t)
  await on.copyEnded()
  await builtAll(t, on)
  const notas = [LakeTableName.parse('sankhya_notas')]
  const parceiros = [LakeTableName.parse('sankhya_parceiros')]

  const answers = await Promise.all([
    on.hub.treatment.hooks.afterCopy(on.companyId, notas),
    on.hub.treatment.hooks.afterCopy(on.companyId, parceiros),
  ])
  await on.hub.treatment.idle()

  const kinds = answers.map((answer) => Object(answer).kind).sort()
  assert.deepEqual(kinds, ['COALESCED', 'OPENED'])
  const [, open, ...more] = await on.treatRuns()
  assert.ok(open !== undefined)
  assert.deepEqual(more, [])
  const coalesced = open.select[0] === 'tratado__sankhya_notas' ? parceiros : notas
  assert.deepEqual(open.pending, [{ layer: 'current', table: coalesced[0] }])

  await builtAll(t, on)
  const [, , next] = await on.treatRuns()
  assert.deepEqual(next?.select, [`tratado__${coalesced[0]}`])
  assert.deepEqual([next?.cause, next?.pending], ['COPY', []])
})

test('lago novo: as rodadas do lago apagado não contam, cada modelo é tratado como nunca gravado e Tratado espera a próxima cópia', async (t) => {
  const on = await treatmentOn(t)
  const old = randomUUID()
  await on.rows(
    `insert into treatment.run (id, company_id, lake_id, cause, state, "select", attempt, started_at, ended_at)
     values ($1, $2, 'lagoantigo01', 'COPY', 'DONE', $3, 1, now() - interval '1 day', now() - interval '1 day')`,
    [old, CompanyId.parse(on.companyId), JSON.stringify(BOTH)],
  )
  for (const name of BOTH)
    await on.rows(
      `insert into treatment.model_run (run_id, company_id, name, status, rows) values ($1, $2, $3, 'BUILT', 5)`,
      [old, on.companyId, name],
    )
  const view = await on.listed()
  assert.equal(view.lastRun, null)
  assert.equal(tableOf(view, 'tratado', 'sankhya_notas').lastRun, null)

  await on.copyEnded(['sankhya_vendedores'])
  assert.equal(
    (await on.treatRuns()).length,
    1,
    'a table with no template and no reader opens no run',
  )
  await on.markCopiedWithoutRun('sankhya_parceiros')
  await on.copyEnded(['sankhya_notas'])
  const [, current] = await on.treatRuns()
  assert.deepEqual([current?.lake_id, current?.select], [TEST_LAKE, BOTH])
})

test('o fim de uma cópia não pede o que lê uma tabela sem a primeira cópia, direto ou por outro tratamento; a cópia dela traz os dois', async (t) => {
  const on = await treatmentOn(t)
  const cliente = await on.proposed('select codparc from tratado.sankhya_parceiros', 'cliente')
  await on.approved(cliente.id, cliente.version)
  await on.copyEnded(['sankhya_notas'])
  const [first] = await on.treatRuns()
  assert.deepEqual(first?.select, ['tratado__sankhya_notas'])
  await builtAll(t, on)

  await on.copyEnded(['sankhya_parceiros'])
  const [, next] = await on.treatRuns()
  assert.deepEqual(next?.select, ['tratado__sankhya_parceiros', 'negocio__cliente'])
})

test('a partida recusada pela AWS fecha a rodada com TREAT_START_FAILED, e a próxima cópia a abre de novo', async (t) => {
  const on = await treatmentOn(t)
  on.aws.start.script('RunTask', 'REFUSED')
  await on.copyEnded()
  const [run] = await on.treatRuns()
  assert.deepEqual([run?.state, run?.failure, run?.task], ['FAILED', 'TREAT_START_FAILED', null])
  assert.deepEqual(
    linesOf(on, 'TREAT_START_FAILED').map(({ call, answer }) => [call, answer]),
    [['RunTask', 'REFUSED']],
  )
  await on.copyEnded(['sankhya_notas'])
  const [, again] = await on.treatRuns()
  assert.deepEqual([again?.state, again?.select], ['RUNNING', BOTH])
})

test('a fila separa os dois resultados: o da cópia fecha a cópia e o do tratamento a rodada; a parada da tarefa de cada um fecha o seu, e a do tratamento sem resultado é TREAT_TASK_STOPPED', async (t) => {
  const on = await treatmentOn(t)
  const venda = await on.proposed(OF_NOTAS)
  await on.approved(venda.id, venda.version)
  await on.copyEnded()
  const [run] = await on.treatRuns()
  assert.ok(run !== undefined)
  assert.deepEqual(run.select, [...BOTH, 'negocio__venda'])
  on.aws.endTask(on.taskOf(run.id).arn, 'EXITED')
  assert.equal((await on.run(on.connection)).statusCode, 202)
  await on.hub.lakeRuns.idle()
  const [copy] = await on.rows(
    `select id from copies.lake_run where connection_id = $1 and ended_at is null`,
    [on.connection],
  )
  assert.ok(copy !== undefined)
  await consuming(t, on)
  await closedRun(on, run.id)

  const [stopped] = await on.treatRuns()
  assert.deepEqual([stopped?.state, stopped?.failure], ['FAILED', 'TREAT_TASK_STOPPED'])
  const [copyOpen] = await on.rows(`select ended_at from copies.lake_run where id = $1`, [copy.id])
  assert.equal(copyOpen?.ended_at, null, 'the copy round stays open')
  assert.deepEqual(await on.rows(`select name from treatment.model_run`), [])
})
