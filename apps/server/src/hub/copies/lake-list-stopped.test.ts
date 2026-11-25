import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { LakeRun } from '@conexus/hub-api'
import { LakeRunId } from '@conexus/hub-api'
import { codeOf, personOn } from '../identity/test-hub.ts'
import { lakeCopyOn } from './test-lake-copy.ts'
import type { On } from './test-lake-list.ts'
import { listed, named, read, runsOf, twoConnections } from './test-lake-list.ts'

type Stop = Readonly<{ ago: string; code: string; failedTable: string | null }>

async function stoppedRun(on: On, connection: string, stop: Stop) {
  const [row] = await on.rows(
    `insert into copies.lake_run (id, company_id, connection_id, started_at, ended_at, outcome, whole, attempt, code, failed_table)
     values ($1, $2, $3, now() + $4::interval, now() + $4::interval, 'ERROR', false, 1, $5, $6) returning id`,
    [crypto.randomUUID(), on.companyId, connection, stop.ago, stop.code, stop.failedTable],
  )
  assert.ok(row !== undefined)
  return LakeRunId.parse(row.id)
}

async function endedWithout(
  on: On,
  connection: string,
  ago: string,
  outcome: 'INTERRUPTED' | 'COMPLETE' | null,
) {
  const [row] = await on.rows(
    `insert into copies.lake_run (id, company_id, connection_id, started_at, ended_at, outcome, whole, attempt)
     values ($1, $2, $3, now() + $4::interval, case when $5::text is null then null else now() + $4::interval end, $5, false, 1) returning id`,
    [crypto.randomUUID(), on.companyId, connection, ago, outcome],
  )
  assert.ok(row !== undefined)
  return LakeRunId.parse(row.id)
}

function errorsOf(runs: readonly LakeRun[]) {
  return runs.map((run) => [run.id, run.outcome === 'ERROR' ? run.code : run.outcome])
}

async function scene(t: Parameters<typeof lakeCopyOn>[0]) {
  const on = await lakeCopyOn(t)
  const { matriz, filial } = await twoConnections(on)
  const tables = await listed(on)
  const notas = named(tables, 'sankhya_notas')
  const [first] = await runsOf(on, notas)
  assert.ok(first?.outcome === 'COMPLETE')
  function stop(connection: string, ago: string, code: string, failedTable: string | null) {
    return stoppedRun(on, connection, { ago, code, failedTable })
  }
  const lost = await stop(matriz, '2 minutes', 'COPY_TASK_LOST', null)
  const inNotas = await stop(matriz, '1 minute', 'COPY_SOURCE_REFUSED', 'sankhya_notas')
  const other = await stop(filial, '3 minutes', 'COPY_TASK_LOST', null)
  const before = await stop(matriz, '-10 days', 'COPY_TASK_LOST', null)
  await on.rows(
    `update copies.lake_run set outcome = 'ERROR', code = 'COPY_SOURCE_REFUSED', failed_table = 'sankhya_notas' where id = $1`,
    [first.id],
  )
  return {
    on,
    tables,
    notas,
    first: first.id,
    lost,
    inNotas,
    other,
    before,
    interrupted: await endedWithout(on, matriz, '30 seconds', 'INTERRUPTED'),
    interruptedBefore: await endedWithout(on, matriz, '-11 days', 'INTERRUPTED'),
    interruptedOther: await endedWithout(on, filial, '40 seconds', 'INTERRUPTED'),
    unmarked: await endedWithout(on, matriz, '10 seconds', 'COMPLETE'),
    open: await endedWithout(on, matriz, '20 seconds', null),
    openOther: await endedWithout(on, filial, '50 seconds', null),
  }
}

async function idsOf(on: On, tables: Awaited<ReturnType<typeof listed>>, name: string) {
  return (await runsOf(on, named(tables, name))).map((run) => run.id)
}

test('as rodadas de uma tabela: a rodada sem linha dela aparece, com erro, interrompida ou aberta, e a que tem linha dela aparece uma vez só', async (t) => {
  const a = await scene(t)
  assert.deepEqual(
    errorsOf(await runsOf(a.on, a.notas)),
    [
      [a.lost, 'COPY_TASK_LOST'],
      [a.inNotas, 'COPY_SOURCE_REFUSED'],
      [a.interrupted, 'INTERRUPTED'],
      [a.open, 'RUNNING'],
      [a.first, 'COPY_SOURCE_REFUSED'],
    ],
    'newest first; each round once, with its outcome',
  )
  assert.equal(
    (await idsOf(a.on, a.tables, 'sankhya_notas')).includes(a.unmarked),
    false,
    'a completed round without the table`s row is from before it was marked',
  )
  const stopped = (await runsOf(a.on, a.notas)).find((run) => run.id === a.inNotas)
  assert.deepEqual(
    stopped?.outcome === 'ERROR' && [stopped.read, stopped.written, stopped.failedTable],
    [0, 0, 'sankhya_notas'],
  )
})

test('as rodadas de uma tabela: a rodada com erro que parou em outra tabela só aparece nela, e a da tarefa perdida em todas', async (t) => {
  const a = await scene(t)
  const ids = await idsOf(a.on, a.tables, 'sankhya_parceiros')
  assert.equal(ids.includes(a.lost), true, 'the task lost every marked table`s round')
  assert.equal(ids.includes(a.inNotas), false, 'it stopped in another table')
  for (const id of [a.interrupted, a.open])
    assert.equal(ids.includes(id), true, 'a round without the table`s row, whatever the outcome')
})

test('as rodadas de uma tabela: nenhuma rodada de outra ligação nem anterior à cópia aparece, qualquer que seja o resultado', async (t) => {
  const a = await scene(t)
  const filialIds = await idsOf(a.on, a.tables, 'sankhya_filial_notas')
  for (const id of [a.other, a.interruptedOther, a.openOther])
    assert.equal(filialIds.includes(id), true, 'the connection`s own rounds')
  for (const id of [a.lost, a.inNotas, a.before, a.interrupted, a.open])
    assert.equal(filialIds.includes(id), false, 'a round of another connection')
  for (const name of ['sankhya_notas', 'sankhya_parceiros']) {
    const own = await idsOf(a.on, a.tables, name)
    for (const id of [a.other, a.interruptedOther, a.openOther, a.before, a.interruptedBefore])
      assert.equal(own.includes(id), false, 'another connection, or before the copy existed')
  }
  const stranger = await personOn(a.on.hub, { name: 'Fora', email: 'fora@example.test' })
  const refused = await read(
    a.on,
    `/api/companies/${a.on.companyId}/lake-tables/${a.notas.id}/runs`,
    stranger,
  )
  assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'NOT_FOUND'])
  assert.equal(refused.body.includes('COPY_TASK_LOST'), false, 'no round of the stopped task leaks')
})
