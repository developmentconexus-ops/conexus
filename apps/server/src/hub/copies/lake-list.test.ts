import assert from 'node:assert/strict'
import { test } from 'node:test'
import { LakeRun, LakeTableSummary } from '@conexus/hub-api'
import { z } from 'zod'
import { call, codeOf, personOn } from '../identity/test-hub.ts'
import { DAILY, finished, lakeCopyOn, NOTAS, PARCEIROS } from './test-lake-copy.ts'

const ORIGENS = { source: 'TGFVAR', name: 'sankhya_origens' }
const Summaries = z.array(LakeTableSummary)
const Runs = z.array(LakeRun)

type On = Awaited<ReturnType<typeof lakeCopyOn>>

function read(on: On, path: string, who = on.ana) {
  return call(on.hub, who, 'GET', path)
}

async function listed(on: On) {
  const answered = await read(on, `/api/companies/${on.companyId}/lake-tables`)
  assert.equal(answered.statusCode, 200, answered.body)
  return Summaries.parse(answered.json())
}

function named(tables: readonly LakeTableSummary[], name: string) {
  const found = tables.find((table) => table.name === name)
  assert.ok(found !== undefined, name)
  return found
}

async function runsOf(on: On, table: LakeTableSummary) {
  const answered = await read(on, `/api/companies/${on.companyId}/lake-tables/${table.id}/runs`)
  assert.equal(answered.statusCode, 200, answered.body)
  return Runs.parse(answered.json())
}

const SINCE = '2024-01-01'

async function twoConnections(on: On) {
  const matriz = await on.linked('Matriz')
  const filial = await on.linked('Filial')
  const body = { tables: [NOTAS, PARCEIROS, ORIGENS], interval: '24h', startDate: SINCE }
  assert.equal((await on.put(matriz, body)).statusCode, 200)
  const own = { tables: [{ source: 'TGFCAB', name: 'sankhya_filial_notas' }], interval: 'MANUAL' }
  assert.equal((await on.put(filial, { ...own, startDate: null })).statusCode, 200)
  await finished(on, matriz, ['sankhya_notas', 'sankhya_parceiros', 'sankhya_origens'])
  await finished(on, filial, ['sankhya_filial_notas'])
  return { matriz, filial }
}

test('a lista de Dados: agrupada pela ligação, com o rótulo, o modo, o estado, as linhas, as colunas e o relógio', async (t) => {
  const on = await lakeCopyOn(t)
  const { matriz } = await twoConnections(on)
  const tables = await listed(on)
  assert.deepEqual(
    tables.map((table) => [table.connection.name, table.name]),
    [
      ['Filial', 'sankhya_filial_notas'],
      ['Matriz', 'sankhya_notas'],
      ['Matriz', 'sankhya_origens'],
      ['Matriz', 'sankhya_parceiros'],
    ],
    'grouped by connection',
  )
  const notas = named(tables, 'sankhya_notas')
  assert.deepEqual([notas.connection.id, notas.connection.connector], [matriz, 'sankhya'])
  assert.deepEqual([notas.source, notas.interval, notas.rows], ['TGFCAB', '24h', 3])
  assert.ok(notas.label.length > 0)
  assert.deepEqual(notas.mode, { kind: 'CHANGED', column: 'DTALTER', registry: false })
  assert.equal(notas.startDate, SINCE, 'the date limits this table')
  assert.equal(notas.columns.length, 450)
  assert.equal(notas.lastRun?.outcome, 'COMPLETE')
  assert.ok(notas.next !== null && !Number.isNaN(Date.parse(notas.next)), 'the clock says when')
  const origens = tables.find((table) => table.name === 'sankhya_origens')
  assert.deepEqual([origens?.startDate, origens?.mode], [null, { kind: 'FULL' }])
  const manual = tables.find((table) => table.name === 'sankhya_filial_notas')
  assert.deepEqual([manual?.interval, manual?.next], ['MANUAL', null], 'MANUAL has no clock')
})

test('a lista de Dados: a rodada aberta é RUNNING e as linhas são as da última completa', async (t) => {
  const on = await lakeCopyOn(t)
  const { matriz } = await twoConnections(on)
  assert.equal((await on.run(matriz)).statusCode, 202)
  await on.hub.lakeRuns.idle()
  const open = (await listed(on)).find((table) => table.name === 'sankhya_notas')
  assert.deepEqual([open?.lastRun?.outcome, open?.rows], ['RUNNING', 3])
})

test('as rodadas de uma tabela: as da ligação que a levaram, com as contagens e o whole dela', async (t) => {
  const on = await lakeCopyOn(t)
  const { matriz } = await twoConnections(on)
  assert.equal((await on.run(matriz)).statusCode, 202)
  await finished(on, matriz, ['sankhya_notas'])
  await on.rows(
    `update copies.lake_table_run set read = 9, written = 7, whole = false
     where table_id = (select id from copies.lake_table where name = 'sankhya_notas')
       and run_id = (select id from copies.lake_run where connection_id = $1 order by started_at desc limit 1)`,
    [matriz],
  )
  const tables = await listed(on)
  const notas = await runsOf(on, named(tables, 'sankhya_notas'))
  const counts = notas.map((run) =>
    run.outcome === 'COMPLETE' ? [run.whole, run.read, run.written] : [run.outcome],
  )
  assert.deepEqual(
    counts,
    [
      [false, 9, 7],
      [true, 3, 3],
    ],
    'newest first, the table`s own counts',
  )
  assert.equal((await runsOf(on, named(tables, 'sankhya_parceiros'))).length, 1)
  assert.equal((await runsOf(on, named(tables, 'sankhya_filial_notas'))).length, 1)
})

test('as rodadas de uma tabela: a máquina da rodada vai com ela, na lista e nas rodadas; a rodada sem medida leva null', async (t) => {
  const on = await lakeCopyOn(t)
  const { matriz } = await twoConnections(on)
  assert.equal((await on.run(matriz)).statusCode, 202)
  const machine = {
    allocated: { vcpu: 1, memoryMib: 2048 },
    peak: { vcpu: 0.97, memoryMib: 771 },
    everySeconds: 5,
    samples: [
      [0.4, 300],
      [0.97, 771],
    ] satisfies [number, number][],
  }
  await finished(on, matriz, ['sankhya_notas'], machine)
  const tables = await listed(on)
  const notas = named(tables, 'sankhya_notas')
  assert.deepEqual(notas.lastRun?.outcome === 'COMPLETE' && notas.lastRun.machine, machine)
  const runs = await runsOf(on, notas)
  assert.deepEqual(
    runs.map((run) => run.outcome === 'COMPLETE' && run.machine),
    [machine, null],
    'newest first; the first round had no measure',
  )
})

type Stop = Readonly<{ ago: string; code: string; failedTable: string | null }>

async function stoppedRun(on: On, connection: string, stop: Stop) {
  const [row] = await on.rows(
    `insert into copies.lake_run (id, company_id, connection_id, started_at, ended_at, outcome, whole, attempt, code, failed_table)
     values ($1, $2, $3, now() + $4::interval, now() + $4::interval, 'ERROR', false, 1, $5, $6) returning id`,
    [crypto.randomUUID(), on.companyId, connection, stop.ago, stop.code, stop.failedTable],
  )
  assert.ok(row !== undefined)
  return String(row.id)
}

function errorsOf(runs: readonly LakeRun[]) {
  return runs.map((run) => [run.id, run.outcome === 'ERROR' ? run.code : run.outcome])
}

test('as rodadas de uma tabela: a rodada com erro sem linha da tabela aparece, parada pela tarefa em cada tabela, e na tabela em que parou só nela', async (t) => {
  const on = await lakeCopyOn(t)
  const { matriz, filial } = await twoConnections(on)
  const tables = await listed(on)
  const [notas, parceiros, filialNotas] = [
    'sankhya_notas',
    'sankhya_parceiros',
    'sankhya_filial_notas',
  ].map((name) => named(tables, name))
  assert.ok(notas && parceiros && filialNotas)
  const [first] = await runsOf(on, notas)
  assert.ok(first?.outcome === 'COMPLETE')

  const lost = await stoppedRun(on, matriz, {
    ago: '2 minutes',
    code: 'COPY_TASK_LOST',
    failedTable: null,
  })
  const inNotas = await stoppedRun(on, matriz, {
    ago: '1 minute',
    code: 'COPY_SOURCE_REFUSED',
    failedTable: 'sankhya_notas',
  })
  const other = await stoppedRun(on, filial, {
    ago: '3 minutes',
    code: 'COPY_TASK_LOST',
    failedTable: null,
  })
  const before = await stoppedRun(on, matriz, {
    ago: '-10 days',
    code: 'COPY_TASK_LOST',
    failedTable: null,
  })

  assert.deepEqual(
    errorsOf(await runsOf(on, notas)),
    [
      [lost, 'COPY_TASK_LOST'],
      [inNotas, 'COPY_SOURCE_REFUSED'],
      [first.id, 'COMPLETE'],
    ],
    'newest first; stopped by the task and stopped in this table, with their codes',
  )
  const stopped = (await runsOf(on, notas)).find((run) => run.id === inNotas)
  assert.deepEqual(
    stopped?.outcome === 'ERROR' && [stopped.read, stopped.written, stopped.failedTable],
    [0, 0, 'sankhya_notas'],
  )
  const ids = (await runsOf(on, parceiros)).map((run) => run.id)
  assert.equal(ids.includes(lost), true, 'the task lost every marked table`s round')
  assert.equal(ids.includes(inNotas), false, 'it stopped in another table')
  const filialIds = (await runsOf(on, filialNotas)).map((run) => run.id)
  assert.equal(filialIds.includes(other), true)
  for (const id of [lost, inNotas, before])
    assert.equal(filialIds.includes(id), false, 'other connection')
  const stranger = await personOn(on.hub, { name: 'Fora', email: 'fora@example.test' })
  const refused = await read(
    on,
    `/api/companies/${on.companyId}/lake-tables/${notas.id}/runs`,
    stranger,
  )
  assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'NOT_FOUND'])
  assert.equal(refused.body.includes('COPY_TASK_LOST'), false, 'no round of the stopped task leaks')
  for (const table of [notas, parceiros]) {
    const own = (await runsOf(on, table)).map((run) => run.id)
    assert.equal(own.includes(other), false, 'a round of another connection')
    assert.equal(own.includes(before), false, 'a round from before the copy existed')
  }
})

test('a lista de Dados: quem não lê a ligação não vê a tabela', async (t) => {
  const on = await lakeCopyOn(t)
  const url = `/api/companies/${on.companyId}/lake-tables`
  const connection = await on.linked()
  assert.equal((await on.put(connection, { tables: [NOTAS], ...DAILY })).statusCode, 200)
  await finished(on, connection, ['sankhya_notas'])
  const [row] = await on.rows(`select id from copies.lake_table`)
  assert.ok(row !== undefined)

  const stranger = await personOn(on.hub, { name: 'Fora', email: 'fora@example.test' })
  for (const path of [url, `${url}/${row.id}/runs`]) {
    const refused = await read(on, path, stranger)
    assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'NOT_FOUND'], path)
    assert.equal(refused.body.includes('sankhya_notas'), false, 'nothing of the table leaks')
  }
  const member = await on.member('Bia', 'member')
  assert.equal((await read(on, url, member)).statusCode, 200, 'every member reads')
  const unknown = await read(on, `${url}/00000000-0000-4000-8000-000000000001/runs`)
  assert.deepEqual([unknown.statusCode, codeOf(unknown)], [404, 'NOT_FOUND'])
})

test('a lista de Dados: a tabela desmarcada some na próxima leitura, com as rodadas dela', async (t) => {
  const on = await lakeCopyOn(t)
  const url = `/api/companies/${on.companyId}/lake-tables`
  const connection = await on.linked()
  assert.equal((await on.put(connection, { tables: [NOTAS, PARCEIROS], ...DAILY })).statusCode, 200)
  on.aws.seedTables(
    'raw/sankhya_notas',
    'current/sankhya_notas',
    'raw/sankhya_parceiros',
    'current/sankhya_parceiros',
  )
  await finished(on, connection, ['sankhya_notas', 'sankhya_parceiros'])
  const before = Summaries.parse((await read(on, url)).json())
  assert.equal(before.length, 2)
  const gone = before.find((table) => table.name === 'sankhya_notas')
  assert.ok(gone !== undefined)

  assert.equal((await on.put(connection, { tables: [PARCEIROS], ...DAILY })).statusCode, 200)
  const after = Summaries.parse((await read(on, url)).json())
  assert.deepEqual(
    after.map((table) => table.name),
    ['sankhya_parceiros'],
  )
  const runs = await read(on, `${url}/${gone.id}/runs`)
  assert.deepEqual([runs.statusCode, codeOf(runs)], [404, 'NOT_FOUND'])
})

test('a lista de Dados: a tabela cuja origem o kit deixou de declarar sai da lista com uma linha de falha, e a lista responde', async (t) => {
  const on = await lakeCopyOn(t)
  const connection = await on.linked('Matriz')
  assert.equal((await on.put(connection, { tables: [NOTAS, PARCEIROS], ...DAILY })).statusCode, 200)
  const [row] = await on.rows(
    `update copies.lake_table set source_table = 'TGFZZZ' where name = 'sankhya_parceiros' returning id`,
  )
  const tables = await listed(on)
  assert.deepEqual(
    tables.map((table) => table.name),
    ['sankhya_notas'],
  )
  const said = on.hub.errors.filter(({ message }) => message === 'COPY_TABLE_UNDECLARED')
  assert.deepEqual(
    said.map(({ fields }) => fields),
    [{ companyId: on.companyId, connectionId: connection, tableId: row?.id }],
  )
})
