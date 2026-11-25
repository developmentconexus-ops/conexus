import assert from 'node:assert/strict'
import { test } from 'node:test'
import { RESULT_GRACE_MS } from './test-lake-queue.ts'
import { completed, lakeRunOn, queued, roundsOf, testClock } from './test-lake-run.ts'

const NOTAS = { source: 'TGFCAB', name: 'sankhya_notas' }

test('a varredura: a rodada aberta cuja tarefa parou, que a AWS não conhece ou que passou de 48 horas fecha antes da nova', async (t) => {
  const on = await lakeRunOn(t)
  const connection = await on.copied([{ ...NOTAS, done: true }])
  const lost = { outcome: 'ERROR', code: 'COPY_TASK_LOST' }

  const stopped = queued(await on.runs.iniciarRodada(on.at, connection, 'NOW'))
  await on.runs.idle()
  const [task] = on.aws.tasks()
  assert.ok(task !== undefined)
  assert.deepEqual(await on.runs.iniciarRodada(on.at, connection, 'CLOCK'), {
    kind: 'ALREADY_RUNNING',
  })
  on.aws.endTask(task.arn)
  const afterStop = queued(await on.runs.iniciarRodada(on.at, connection, 'CLOCK'))
  await on.runs.idle()
  const parameter = `/conexus/copia/${on.companyId}/${stopped}`
  assert.equal(on.aws.parameters().includes(parameter), false, 'the swept round lost its parameter')

  await completed(on, afterStop)
  const unknown = crypto.randomUUID()
  await on.rows(
    `insert into copies.lake_run (id, company_id, connection_id, started_at, whole, attempt)
     values ($1, $2, $3, now(), false, 1)`,
    [unknown, on.companyId, connection],
  )
  const afterUnknown = queued(await on.runs.iniciarRodada(on.at, connection, 'CLOCK'))
  await on.runs.idle()

  await completed(on, afterUnknown)
  const old = crypto.randomUUID()
  await on.rows(
    `insert into copies.lake_run (id, company_id, connection_id, started_at, whole, attempt, task_arn)
     values ($1, $2, $3, now() - interval '49 hours', false, 1, $4)`,
    [old, on.companyId, connection, on.aws.tasks().at(-1)?.arn],
  )
  queued(await on.runs.iniciarRodada(on.at, connection, 'CLOCK'))
  await on.runs.idle()

  const rounds = await roundsOf(on, connection)
  const byId = new Map(rounds.map((row) => [row.id, { outcome: row.outcome, code: row.code }]))
  assert.deepEqual(byId.get(stopped), lost, 'the task AWS says stopped')
  assert.deepEqual(byId.get(unknown), lost, 'no task AWS knows by its startedBy')
  assert.deepEqual(byId.get(old), lost, 'open past 48 hours, its task still running')
  assert.equal(on.lines.filter(({ message }) => message === 'COPY_RUN_SWEPT').length, 3)
})

test('a varredura espera a graça: a tarefa parada há menos da graça segue aberta; parada há mais, fecha COPY_TASK_LOST', async (t) => {
  const clock = testClock()
  const on = await lakeRunOn(t, clock)
  const connection = await on.copied([{ ...NOTAS, done: true }])
  const run = queued(await on.runs.iniciarRodada(on.at, connection, 'NOW'))
  await on.runs.idle()
  const [task] = on.aws.tasks()
  assert.ok(task !== undefined)
  on.aws.endTask(task.arn, 'EXITED', new Date(clock.now() - RESULT_GRACE_MS + 60_000))

  assert.deepEqual(await on.runs.iniciarRodada(on.at, connection, 'NOW'), {
    kind: 'ALREADY_RUNNING',
  })
  const open = (await roundsOf(on, connection)).find((row) => row.id === run)
  assert.equal(open?.outcome, null, 'a late result may still close it')

  await clock.sleep(60_000)
  const next = queued(await on.runs.iniciarRodada(on.at, connection, 'NOW'))
  await on.runs.idle()
  const rounds = new Map((await roundsOf(on, connection)).map((row) => [row.id, row]))
  assert.deepEqual([rounds.get(run)?.outcome, rounds.get(run)?.code], ['ERROR', 'COPY_TASK_LOST'])
  assert.equal(rounds.get(next)?.outcome, null, 'the new round opened')
})
