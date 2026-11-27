import assert from 'node:assert/strict'
import { test } from 'node:test'
import { until } from '../../platform/test-until.ts'
import { call, codeOf } from '../identity/test-hub.ts'
import type { LakeCopyOn } from './test-lake-copy.ts'
import { counts, DAILY, finished, lakeCopyOn, NOTAS, PARCEIROS } from './test-lake-copy.ts'
import { silenceDelete } from './test-lake-queue.ts'
import { testClock } from './test-lake-run.ts'

const SILENT = { kind: 'NO_ANSWER' } as const

function unlink(on: LakeCopyOn, connection: string) {
  return call(on.hub, on.ana, 'DELETE', `${on.base}/${connection}`)
}

async function connectionRows(on: LakeCopyOn, connection: string) {
  const [row] = await on.rows(
    `select (select count(*) from connectors.connection where id = $1)::int as connections`,
    [connection],
  )
  return row?.connections
}

async function markedWithOpenRun(on: LakeCopyOn) {
  const connection = await on.linked()
  assert.equal((await on.put(connection, { tables: [NOTAS, PARCEIROS], ...DAILY })).statusCode, 200)
  await on.hub.lakeRuns.idle()
  on.aws.seedTables(
    'raw/sankhya_notas',
    'current/sankhya_notas',
    'raw/sankhya_parceiros',
    'current/sankhya_parceiros',
  )
  return connection
}

test('desligar com a rodada aberta: a tarefa para, a rodada fecha INTERRUPTED, as tabelas saem da AWS e a linha leva a cópia', async (t) => {
  const on = await lakeCopyOn(t)
  const connection = await markedWithOpenRun(on)
  const [task] = on.aws.tasks()
  assert.equal(task?.stopped, false)
  assert.equal(on.aws.parameters().length, 1)
  assert.notEqual(await on.hub.lakeClock.next(connection), null)

  const answered = await unlink(on, connection)
  assert.equal(answered.statusCode, 200, answered.body)

  assert.equal(on.aws.tasks()[0]?.stopped, true, 'the open task was stopped')
  assert.deepEqual(on.aws.tables(), [])
  assert.deepEqual(on.aws.parameters(), [], 'the round parameter left with the round')
  const ended = on.hub.lines.find(({ message }) => message === 'COPY_RUN_ENDED')
  assert.equal(ended?.fields.outcome, 'INTERRUPTED')
  assert.equal(ended?.fields.cause, 'LEAVE')
  assert.equal(await connectionRows(on, connection), 0)
  assert.deepEqual(await counts(on), { copies: 0, tables: 0, runs: 0, parameters: 0 })
  assert.equal(await on.hub.lakeClock.next(connection), null)

  const again = await unlink(on, connection)
  assert.equal(again.statusCode, 200, 'the second finds the row gone and answers')
})

test('desligar sem cópia não chama a AWS', async (t) => {
  const on = await lakeCopyOn(t, {
    tables: () => ({
      list: () => Promise.reject(new Error('AWS called')),
      drop: () => Promise.reject(new Error('AWS called')),
      forget: () => Promise.reject(new Error('AWS called')),
    }),
    tasks: (real) => ({ ...real, stop: () => Promise.reject(new Error('AWS called')) }),
  })
  const connection = await on.linked()
  assert.equal((await unlink(on, connection)).statusCode, 200)
  assert.equal(await connectionRows(on, connection), 0)
})

test('desligar com a AWS fora: 503 e nada muda; a AWS volta e a repetição termina', async (t) => {
  let down = true
  const on = await lakeCopyOn(t, {
    tables: (real) => ({
      ...real,
      drop: async (...asked) => (down ? SILENT : real.drop(...asked)),
    }),
  })
  const connection = await markedWithOpenRun(on)
  await finished(on, connection, ['sankhya_notas', 'sankhya_parceiros'])
  const before = await counts(on)

  const refused = await unlink(on, connection)
  assert.deepEqual([refused.statusCode, codeOf(refused)], [503, 'COPY_AWS_UNAVAILABLE'])
  assert.equal(await connectionRows(on, connection), 1, 'the connection stays')
  assert.deepEqual(await counts(on), before)
  assert.equal(on.aws.tables().length, 4)
  assert.notEqual(await on.hub.lakeClock.next(connection), null, 'the clock stays')

  down = false
  assert.equal((await unlink(on, connection)).statusCode, 200)
  assert.deepEqual(on.aws.tables(), [])
  assert.equal(await connectionRows(on, connection), 0)
})

test('desligar com a rodada aberta e a AWS fora na parada: 503, a rodada segue aberta e a ligação fica', async (t) => {
  const on = await lakeCopyOn(t, {
    tasks: (real) => ({ ...real, stop: async () => SILENT }),
  })
  const connection = await markedWithOpenRun(on)
  const refused = await unlink(on, connection)
  assert.deepEqual([refused.statusCode, codeOf(refused)], [503, 'COPY_AWS_UNAVAILABLE'])
  const [open] = await on.rows(
    `select count(*)::int as n from copies.lake_run where connection_id = $1 and ended_at is null`,
    [connection],
  )
  assert.equal(open?.n, 1)
  assert.equal(on.aws.tables().length, 4)
  assert.equal(await connectionRows(on, connection), 1)
})

async function openRuns(on: LakeCopyOn, connection: string) {
  const [open] = await on.rows(
    `select count(*)::int as n from copies.lake_run where connection_id = $1 and ended_at is null`,
    [connection],
  )
  return open?.n
}

test('desligar espera a tarefa parar: o parâmetro sai antes do StopTask, e nenhuma tabela sai antes do STOPPED', async (t) => {
  const clock = testClock()
  const on = await lakeCopyOn(t, { stopWait: clock })
  const connection = await markedWithOpenRun(on)
  on.aws.lagStops(2)
  const before = on.aws.calls().length
  const started = clock.now()

  const answered = await unlink(on, connection)
  assert.equal(answered.statusCode, 200, answered.body)
  assert.deepEqual(on.aws.calls().slice(before), [
    'DeleteParameter',
    'StopTask',
    'DescribeTasks',
    'DescribeTasks',
    'DescribeTasks',
    'DeleteParameter',
    ...['DeleteTable', 'DeleteTable', 'DeleteTable', 'GetObject'],
    ...['DeleteTable', 'DeleteTable', 'DeleteTable', 'GetObject'],
  ])
  assert.ok(clock.now() > started, 'the leave waited on its clock')
  assert.deepEqual(on.aws.tables(), [])
  assert.equal(await connectionRows(on, connection), 0)
})

test('desligar: o limite da espera vence sem STOPPED, 503, as tabelas ficam, e a repetição termina depois da parada', async (t) => {
  const on = await lakeCopyOn(t, { stopWait: testClock() })
  const connection = await markedWithOpenRun(on)
  on.aws.lagStops(1_000)

  const refused = await unlink(on, connection)
  assert.deepEqual([refused.statusCode, codeOf(refused)], [503, 'COPY_AWS_UNAVAILABLE'])
  assert.equal(on.aws.tables().length, 4, 'no table dropped')
  assert.deepEqual(on.aws.parameters(), [], 'the parameter deleted')
  assert.equal(await openRuns(on, connection), 1, 'the round stays open')
  assert.equal(await connectionRows(on, connection), 1)
  assert.ok(on.hub.errors.some(({ message }) => message === 'COPY_TASK_STOP_SLOW'))

  const [task] = on.aws.tasks()
  assert.ok(task !== undefined)
  on.aws.endTask(task.arn)
  assert.equal((await unlink(on, connection)).statusCode, 200)
  assert.deepEqual(on.aws.tables(), [])
  assert.equal(await connectionRows(on, connection), 0)
})

test('desligar durante a partida: a partida que perde a corrida para a tarefa que iniciou e apaga o parâmetro que regravou', async (t) => {
  const on = await lakeCopyOn(t)
  const connection = await on.linked()
  // The SDK repeats a silent request inside the call: both are held, and the start tries again.
  on.aws.start.script('PutParameter', 'HELD')
  on.aws.start.script('PutParameter', 'HELD')
  assert.equal((await on.put(connection, { tables: [NOTAS], ...DAILY })).statusCode, 200)
  await until(() => on.aws.parameters().length === 1, 'the start wrote its parameter')

  const answered = await unlink(on, connection)
  assert.equal(answered.statusCode, 200, answered.body)
  assert.deepEqual(on.aws.tasks(), [], 'the leave found no task to stop')
  await on.hub.lakeRuns.idle()

  const tasks = on.aws.tasks()
  assert.equal(tasks.length, 1, 'the start began its task after the leave')
  assert.equal(tasks[0]?.stopped, true, 'and stopped it')
  assert.deepEqual(on.aws.parameters(), [])
  assert.ok(on.hub.lines.some(({ message }) => message === 'COPY_START_UNDONE'))
})

test('desligar apaga o parâmetro que o fecho da última rodada deixou', async (t) => {
  const on = await lakeCopyOn(t)
  const connection = await on.linked()
  on.aws.start.script('RunTask', 'REFUSED')
  silenceDelete(on)
  assert.equal((await on.put(connection, { tables: [NOTAS], ...DAILY })).statusCode, 200)
  await on.hub.lakeRuns.idle()
  assert.equal(on.aws.parameters().length, 1, 'the refused start left it')

  assert.equal((await unlink(on, connection)).statusCode, 200)
  assert.deepEqual(on.aws.parameters(), [])
})
