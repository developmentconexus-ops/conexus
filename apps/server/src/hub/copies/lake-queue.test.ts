import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { until } from '../../platform/test-until.ts'
import type { CopyQueue } from './test-lake-queue.ts'
import {
  consumerOn,
  deleteParameterOf,
  drained,
  endedLines,
  flakyDatabase,
  NOTAS,
  namedDatabase,
  PARCEIROS,
  result,
  roundOf,
  running,
  silenceDelete,
  stopTaskOf,
} from './test-lake-queue.ts'
import { completed, lakeRunOn } from './test-lake-run.ts'

test('o resultado e a parada: o resultado fecha com as contagens, rows e o código; a parada que chega depois e a reentrega não mudam nada; a parada de saída 1 lida antes fecha', async (t) => {
  const on = await lakeRunOn(t)
  const first = await running(on, [NOTAS, PARCEIROS])
  const counts = [
    { name: NOTAS.name, read: 12, written: 12, rows: 40, whole: false },
    { name: PARCEIROS.name, read: 3, written: 3, rows: null, whole: true },
  ]
  on.aws.enqueue(result(first.run, { kind: 'COMPLETE' }, counts))
  on.aws.endTask(first.arn)

  const lost = await running(on, [{ source: 'TGFITE', name: 'sankhya_itens' }], 'Filial')
  on.aws.endTask(lost.arn, 'EXITED')

  await on.queue.start()
  await drained(on)

  assert.deepEqual(await roundOf(on, first.run), {
    ...{ outcome: 'COMPLETE', code: null, failed_table: null, ended: true },
  })
  const tables = await on.rows(
    `select t.name, t.rows, t.last_run_id, r.read, r.written, r.rows as run_rows, r.whole
       from copies.lake_table t join copies.lake_table_run r on r.table_id = t.id
      where r.run_id = $1 order by t.name`,
    [first.run],
  )
  assert.deepEqual(tables, [
    {
      ...{ name: NOTAS.name, rows: '40', last_run_id: first.run },
      ...{ read: 12, written: 12, run_rows: '40', whole: false },
    },
    {
      ...{ name: PARCEIROS.name, rows: null, last_run_id: first.run },
      ...{ read: 3, written: 3, run_rows: '0', whole: true },
    },
  ])
  assert.equal(endedLines(on, first.run).length, 1, 'the stop after the result closed nothing')

  assert.deepEqual(await roundOf(on, lost.run), {
    ...{ outcome: 'ERROR', code: 'COPY_TASK_LOST', failed_table: null, ended: true },
  })

  const fell = await running(on, [{ source: 'TGFPRO', name: 'sankhya_produtos' }], 'Outra')
  assert.equal((await completed(on, fell.run)).kind, 'CLOSED')
  const awake = await running(on, [{ source: 'TGFVEN', name: 'sankhya_vendedores' }], 'Quarta')
  on.aws.enqueue(
    result(fell.run, { kind: 'ERROR', code: 'COPY_SOURCE_UNREACHABLE', table: null, system: null }),
  )
  on.aws.enqueue(result(lost.run))
  await drained(on)
  assert.equal((await roundOf(on, lost.run))?.code, 'COPY_TASK_LOST')
  assert.equal(endedLines(on, lost.run).length, 1, 'the result after the stop closed nothing')
  assert.deepEqual(await roundOf(on, fell.run), {
    ...{ outcome: 'COMPLETE', code: null, failed_table: null, ended: true },
  })
  assert.equal(endedLines(on, fell.run).length, 1)
  assert.equal((await roundOf(on, awake.run))?.ended, false)
})

test('as 100 mais novas: o fim deixa as 100 rodadas mais novas da ligação, e as contagens das outras saem com elas', async (t) => {
  const on = await lakeRunOn(t)
  const { connection, run } = await running(on)
  const [table] = await on.rows(`select id from copies.lake_table where connection_id = $1`, [
    connection,
  ])
  for (let day = 1; day <= 100; day += 1) {
    const old = crypto.randomUUID()
    await on.rows(
      `insert into copies.lake_run (id, company_id, connection_id, started_at, ended_at, outcome, whole, attempt)
       values ($1, $2, $3, now() - make_interval(days => $4), now() - make_interval(days => $4), 'COMPLETE', false, 1)`,
      [old, on.companyId, connection, day],
    )
    if (day === 100)
      await on.rows(
        `insert into copies.lake_table_run (run_id, table_id, company_id, read, written, rows, whole)
         values ($1, $2, $3, 1, 1, 1, false)`,
        [old, table?.id, on.companyId],
      )
  }
  on.aws.enqueue(result(run))
  await on.queue.start()
  await drained(on)

  const kept = await on.rows(
    `select id from copies.lake_run where connection_id = $1 order by started_at desc`,
    [connection],
  )
  assert.equal(kept.length, 100)
  assert.equal(kept[0]?.id, run, 'the round just closed is kept')
  const [oldest] = await on.rows(
    `select count(*)::int as n from copies.lake_run
      where connection_id = $1 and started_at < now() - interval '99 days 12 hours'`,
    [connection],
  )
  assert.equal(oldest?.n, 0, 'the oldest went')
  const [counts] = await on.rows(
    `select count(*)::int as n from copies.lake_table_run where table_id = $1`,
    [table?.id],
  )
  assert.equal(counts?.n, 0, 'its counts went with it')
})

test('a tarefa que morreu: a parada do ECS sem resultado fecha ERROR COPY_TASK_LOST; a tarefa parada pelo Hub fecha INTERRUPTED', async (t) => {
  const on = await lakeRunOn(t)
  const died = await running(on)
  const stopped = await running(on, [PARCEIROS], 'Filial')
  on.aws.endTask(died.arn, 'EXITED')
  assert.deepEqual(await stopTaskOf(on, stopped.arn), { kind: 'DONE', value: undefined })

  await on.queue.start()
  await drained(on)
  assert.deepEqual(await roundOf(on, died.run), {
    ...{ outcome: 'ERROR', code: 'COPY_TASK_LOST', failed_table: null, ended: true },
  })
  assert.deepEqual(await roundOf(on, stopped.run), {
    ...{ outcome: 'INTERRUPTED', code: null, failed_table: null, ended: true },
  })
  await until(() => !on.queue.reading(), 'the consumer sleeps with no round open')
})

test('o parâmetro sai no fim: a rodada fechada apaga o parâmetro dela; um parâmetro que a AWS não tem conta como apagado', async (t) => {
  const on = await lakeRunOn(t)
  const kept = await running(on)
  const gone = await running(on, [PARCEIROS], 'Filial')
  function parameterOf(run: string) {
    return `/conexus/copia/${on.companyId}/${run}`
  }
  assert.deepEqual(
    on.aws.parameters().sort(),
    [parameterOf(kept.run), parameterOf(gone.run)].sort(),
  )
  assert.equal((await deleteParameterOf(on, gone.run)).kind, 'DONE')

  on.aws.enqueue(result(kept.run))
  on.aws.enqueue(result(gone.run))
  await on.queue.start()
  await drained(on)
  assert.deepEqual(on.aws.parameters(), [])
  assert.equal((await roundOf(on, gone.run))?.outcome, 'COMPLETE')
  assert.equal(
    on.lines.some(({ message }) => message === 'COPY_PARAMETER_LEFT'),
    false,
  )
})

test('o parâmetro que a AWS não apagou: a mensagem fica na fila, é relida, e o parâmetro sai', async (t) => {
  const on = await lakeRunOn(t)
  const { run } = await running(on)
  silenceDelete(on)
  on.aws.enqueue(result(run))
  await on.queue.start()
  await drained(on)
  assert.equal((await roundOf(on, run))?.outcome, 'COMPLETE')
  assert.equal(endedLines(on, run).length, 1, 'the second reading closed nothing')
  assert.equal(
    on.lines.filter(({ message }) => message === 'COPY_PARAMETER_LEFT').length,
    1,
    'the first delete went unanswered',
  )
  assert.deepEqual(on.aws.parameters(), [])
})

test('o que o registro leva: COPY_RUN_ENDED com as contagens e a ligação; nem ele nem a fila levam o segredo; a mensagem ilegível sai da fila com COPY_QUEUE_UNREADABLE', async (t) => {
  const on = await lakeRunOn(t)
  const { connection, run, arn } = await running(on, [NOTAS, PARCEIROS])
  const counts = [
    { name: NOTAS.name, read: 12, written: 10, rows: 40, whole: false },
    { name: PARCEIROS.name, read: 3, written: 3, rows: 7, whole: true },
  ]
  on.aws.enqueue('não é JSON')
  on.aws.enqueue(JSON.stringify({ type: 'RESULT', runId: run }))
  on.aws.enqueue(result(run, { kind: 'COMPLETE' }, counts))
  on.aws.endTask(arn, 'EXITED')
  const secrets = Object.values(on.fake.credential)
  const queuedBodies = on.aws.messages().join('\n')
  assert.equal(
    secrets.some((secret) => queuedBodies.includes(secret)),
    false,
    'the queue carries no secret: the stop event names only the parameter',
  )

  await on.queue.start()
  await drained(on)
  const [ended, ...more] = endedLines(on, run)
  assert.deepEqual(more, [])
  assert.deepEqual(ended?.fields, {
    ...{ companyId: on.companyId, connectionId: connection, runId: run, cause: 'RESULT' },
    ...{ outcome: 'COMPLETE', tables: 2, read: 15, written: 13 },
  })
  assert.equal(on.lines.filter(({ message }) => message === 'COPY_QUEUE_UNREADABLE').length, 2)
  const said = JSON.stringify(on.lines)
  assert.equal(
    secrets.some((secret) => said.includes(secret)),
    false,
    'no line carries the secret',
  )
  assert.equal(said.includes('não é JSON'), false, 'nor the body of a message')
})

test('o banco fora: a mensagem fica na fila e, lida de novo, fecha a rodada', async (t) => {
  const on = await lakeRunOn(t)
  const { run } = await running(on)
  const refusals = { left: 1 }
  const queue = consumerOn(on, { database: flakyDatabase(on, refusals) })
  t.after(() => queue.stop())
  on.aws.enqueue(result(run))
  await queue.start()
  await drained(on)
  assert.equal(refusals.left, 0, 'the first close met the database out')
  assert.equal((await roundOf(on, run))?.outcome, 'COMPLETE')
})

test('o banco que dorme: sem rodada aberta o Hub não chama a AWS; com uma, o consumidor lê a fila sem conexão com o banco até chegar mensagem (D27)', async (t) => {
  const on = await lakeRunOn(t)
  let polls = 0
  const counted: CopyQueue = {
    receive: (signal) => {
      polls += 1
      return on.ports.queue.receive(signal)
    },
    acknowledge: (handle) => on.ports.queue.acknowledge(handle),
  }
  const app = `lake-queue-${crypto.randomUUID().slice(0, 8)}`
  const database = namedDatabase(t, on, app)
  function consumer() {
    return consumerOn(on, { database, queue: counted })
  }
  async function connections(): Promise<number> {
    const [row] = await on.rows(
      `select count(*)::int as n from pg_stat_activity where application_name = $1`,
      [app],
    )
    return Number(row?.n)
  }

  const idle = consumer()
  t.after(() => idle.stop())
  await idle.start()
  await sleep(1_000)
  assert.equal(polls, 0, 'no round open: no call to AWS')
  assert.equal(idle.reading(), false)
  await idle.stop()

  const { run } = await running(on)
  const awake = consumer()
  t.after(() => awake.stop())
  await awake.start()
  await until(async () => (await connections()) === 0, 'the consumer holds no connection')
  const before = polls
  await until(() => polls >= before + 3, 'three long polls more')
  assert.equal(await connections(), 0, 'the long polls opened no connection')

  on.aws.enqueue(result(run))
  await drained(on)
  assert.equal((await roundOf(on, run))?.outcome, 'COMPLETE')
  await until(() => !awake.reading(), 'the consumer sleeps once the round closed')
  const after = polls
  await sleep(1_000)
  assert.equal(polls, after, 'no poll with no round open')
})
