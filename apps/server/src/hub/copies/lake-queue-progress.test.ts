import assert from 'node:assert/strict'
import { test } from 'node:test'
import { until } from '../../platform/test-until.ts'
import {
  consumerOn,
  drained,
  endedLines,
  flakyDatabase,
  NOTAS,
  PARCEIROS,
  progress,
  result,
  running,
} from './test-lake-queue.ts'
import type { LakeRunOn } from './test-lake-run.ts'
import { completed, lakeRunOn } from './test-lake-run.ts'

async function scoreboardOf(on: LakeRunOn, run: string) {
  const [row] = await on.rows(
    `select progress, progress_seq, ended_at is not null as ended from copies.lake_run where id = $1`,
    [run],
  )
  return row
}

test('o placar grava e não fecha: a rodada aberta guarda o placar inteiro com o seq, segue aberta e a mensagem sai da fila', async (t) => {
  const on = await lakeRunOn(t)
  const { run } = await running(on)
  await on.queue.start()
  on.aws.enqueue(progress(run, 1))
  await drained(on)
  const row = await scoreboardOf(on, run)
  assert.equal(row?.progress_seq, 1)
  assert.equal(row?.ended, false, 'the round stays open')
  assert.deepEqual(row?.progress, JSON.parse(progress(run, 1)))
  assert.equal(on.aws.parameters().length, 1, 'the round kept its parameter')
  assert.equal(endedLines(on, run).length, 0)
})

test('o placar velho não volta: o seq igual ou menor não muda nada, e o maior troca o placar', async (t) => {
  const on = await lakeRunOn(t)
  const { run } = await running(on)
  await on.queue.start()
  on.aws.enqueue(progress(run, 5))
  on.aws.enqueue(progress(run, 3))
  on.aws.enqueue(progress(run, 5, { phase: { kind: 'UPDATING', table: NOTAS.name } }))
  await drained(on)
  const row = await scoreboardOf(on, run)
  assert.equal(row?.progress_seq, 5)
  assert.deepEqual(row?.progress, JSON.parse(progress(run, 5)), 'the first seq 5 stays')
  on.aws.enqueue(progress(run, 6))
  await drained(on)
  assert.equal((await scoreboardOf(on, run))?.progress_seq, 6)
})

test('o placar de outra tentativa ou de rodada fechada é descartado: sai da fila sem gravar', async (t) => {
  const on = await lakeRunOn(t)
  const open = await running(on)
  const closed = await running(on, [PARCEIROS], 'Filial')
  assert.equal((await completed(on, closed.run)).kind, 'CLOSED')
  await on.queue.start()
  const unknown = crypto.randomUUID()
  on.aws.enqueue(progress(open.run, 1, { attempt: 2 }))
  on.aws.enqueue(progress(closed.run, 1))
  on.aws.enqueue(progress(unknown, 1))
  await drained(on)
  assert.equal((await scoreboardOf(on, open.run))?.progress, null, 'another attempt wrote nothing')
  assert.equal((await scoreboardOf(on, closed.run))?.progress, null, 'a closed round wrote nothing')
  assert.equal(
    on.lines.filter(({ message }) => message === 'COPY_QUEUE_RUN_UNKNOWN').length,
    2,
    'the closed and the unknown round',
  )
  assert.equal((await scoreboardOf(on, open.run))?.ended, false)
})

test('o banco fora não prende o placar: registra COPY_PROGRESS_NOT_WRITTEN, tira da fila, e o próximo placar grava', async (t) => {
  const on = await lakeRunOn(t)
  const { run } = await running(on)
  const refusals = { left: 1 }
  const lines: { fields: object; message: string }[] = []
  const log = {
    info: (fields: object, message: string) => void lines.push({ fields, message }),
    error: (fields: object, message: string) => void lines.push({ fields, message }),
  }
  const queue = consumerOn(on, { database: flakyDatabase(on, refusals), log })
  t.after(() => queue.stop())
  await queue.start()
  on.aws.enqueue(progress(run, 1))
  await drained(on)
  assert.equal(refusals.left, 0, 'the first scoreboard met the database out')
  const refused = lines.filter(({ message }) => message === 'COPY_PROGRESS_NOT_WRITTEN')
  assert.equal(refused.length, 1)
  assert.equal(Object(refused[0]?.fields).runId, run)
  const row = await scoreboardOf(on, run)
  assert.equal(row?.progress, null)
  assert.equal(row?.ended, false, 'the round stays open')
  on.aws.enqueue(progress(run, 2))
  await drained(on)
  assert.equal((await scoreboardOf(on, run))?.progress_seq, 2)
})

test('o fechamento guarda início e fim e limpa o placar', async (t) => {
  const on = await lakeRunOn(t)
  const { run } = await running(on)
  await on.queue.start()
  on.aws.enqueue(progress(run, 1))
  await drained(on)
  assert.equal((await scoreboardOf(on, run))?.progress_seq, 1)
  const started = '2026-11-27T14:02:30Z'
  const ended = '2026-11-27T14:05:10Z'
  on.aws.enqueue(
    result(run, { kind: 'COMPLETE' }, [
      {
        ...{ name: NOTAS.name, read: 12, written: 12, rounded: 0, rows: 40, whole: false },
        ...{ startedAt: started, endedAt: ended },
      },
    ]),
  )
  await drained(on)
  await until(async () => (await scoreboardOf(on, run))?.ended === true, 'the round closed')
  const row = await scoreboardOf(on, run)
  assert.equal(row?.progress, null, 'the scoreboard left with the close')
  assert.equal(row?.progress_seq, null)
  const [times] = await on.rows(
    `select started_at = $2::timestamptz as started, ended_at = $3::timestamptz as ended
       from copies.lake_table_run where run_id = $1`,
    [run, started, ended],
  )
  assert.deepEqual(times, { started: true, ended: true })
})

test('o resultado antigo fecha: sem início e fim, as duas horas ficam nulas', async (t) => {
  const on = await lakeRunOn(t)
  const { run } = await running(on)
  await on.queue.start()
  on.aws.enqueue(
    result(run, { kind: 'COMPLETE' }, [
      { name: NOTAS.name, read: 12, written: 12, rounded: 0, rows: 40, whole: false },
    ]),
  )
  await drained(on)
  await until(async () => (await scoreboardOf(on, run))?.ended === true, 'the round closed')
  const [times] = await on.rows(
    `select started_at is null as started, ended_at is null as ended
       from copies.lake_table_run where run_id = $1`,
    [run],
  )
  assert.deepEqual(times, { started: true, ended: true })
})

test('o banco recusa placar em rodada fechada, e progress sem progress_seq', async (t) => {
  const on = await lakeRunOn(t)
  const open = await running(on)
  const closed = await running(on, [PARCEIROS], 'Filial')
  assert.equal((await completed(on, closed.run)).kind, 'CLOSED')
  const refused = { constraint: 'lake_run_progress' }
  await assert.rejects(
    on.rows(`update copies.lake_run set progress = '{}'::jsonb, progress_seq = 1 where id = $1`, [
      closed.run,
    ]),
    refused,
  )
  await assert.rejects(
    on.rows(`update copies.lake_run set progress = '{}'::jsonb where id = $1`, [open.run]),
    refused,
  )
  await assert.rejects(
    on.rows(`update copies.lake_run set progress_seq = 1 where id = $1`, [open.run]),
    refused,
  )
  await on.rows(
    `update copies.lake_run set progress = '{}'::jsonb, progress_seq = 1 where id = $1`,
    [open.run],
  )
  assert.equal((await scoreboardOf(on, open.run))?.progress_seq, 1, 'an open round takes both')
})
