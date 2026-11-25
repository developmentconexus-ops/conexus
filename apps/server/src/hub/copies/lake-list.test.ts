import assert from 'node:assert/strict'
import { test } from 'node:test'
import { codeOf, personOn } from '../identity/test-hub.ts'
import { DAILY, finished, lakeCopyOn, NOTAS, PARCEIROS } from './test-lake-copy.ts'
import { listed, named, read, runsOf, SINCE, Summaries, twoConnections } from './test-lake-list.ts'

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
