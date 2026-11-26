import assert from 'node:assert/strict'
import { test } from 'node:test'
import { codeOf } from '../identity/test-hub.ts'
import {
  counts,
  DAILY,
  finished,
  lakeCopyOn,
  NOTAS,
  PARCEIROS,
  runsOf,
  wholeOf,
} from './test-lake-copy.ts'

test('gravar a cópia: a linha, o relógio e a primeira rodada, inteira; o mesmo conjunto não muda nada', async (t) => {
  const on = await lakeCopyOn(t)
  const connection = await on.linked()
  const put = await on.put(connection, { tables: [NOTAS], interval: '24h', startDate: null })
  const view = on.viewOf(put)
  const marked = view.tables.find((table) => table.source === 'TGFCAB')
  assert.equal(marked?.copy.kind, 'MARKED')
  assert.equal(marked?.copy.kind === 'MARKED' ? marked.copy.name : '', 'sankhya_notas')
  assert.equal(view.interval, '24h')

  const [copy] = await on.rows(
    `select connector_id, interval, start_date, created_at from copies.lake_copy where connection_id = $1`,
    [connection],
  )
  assert.equal(copy?.connector_id, 'sankhya')
  assert.equal(copy?.start_date, null)
  const [table] = await on.rows(
    `select name, source_table, label, jsonb_array_length(columns)::int as columns from copies.lake_table where connection_id = $1`,
    [connection],
  )
  assert.equal(table?.name, 'sankhya_notas')
  assert.equal(table?.source_table, 'TGFCAB')
  assert.equal(table?.columns, 450, 'the dictionary gave the columns')

  assert.ok((await on.hub.lakeClock.next(connection)) instanceof Date, 'the clock exists')
  await on.hub.lakeRuns.idle()
  const [run, ...more] = await runsOf(on, connection)
  assert.deepEqual(more, [], 'the first round started')
  assert.deepEqual(wholeOf(on, run?.id), { sankhya_notas: true }, 'the first load is whole')

  const before = await counts(on)
  const again = await on.put(connection, { tables: [NOTAS], interval: '24h', startDate: null })
  assert.equal(again.statusCode, 200, again.body)
  await on.hub.lakeRuns.idle()
  assert.deepEqual(await counts(on), before, 'the same set changes nothing')
  const [same] = await on.rows(`select name from copies.lake_table where connection_id = $1`, [
    connection,
  ])
  assert.equal(same?.name, 'sankhya_notas')

  const manual = await on.linked('Filial')
  const filial = { source: 'TGFCAB', name: 'sankhya_filial_notas' }
  assert.equal(
    (await on.put(manual, { tables: [filial], interval: 'MANUAL', startDate: null })).statusCode,
    200,
  )
  assert.equal(await on.hub.lakeClock.next(manual), null, 'MANUAL has no clock')
  await on.hub.lakeRuns.idle()
  assert.equal((await runsOf(on, manual)).length, 1, 'but the first round starts')

  const empty = await on.linked('Vazia')
  assert.equal(on.viewOf(await on.put(empty, { tables: [], ...DAILY })).interval, null)
  assert.deepEqual(
    (await on.rows(`select 1 from copies.lake_copy where connection_id = $1`, [empty])).length,
    0,
  )
})

test('gravar a cópia: as recusas não gravam nada', async (t) => {
  const on = await lakeCopyOn(t)
  const connection = await on.linked()
  const before = await counts(on)
  const refused: [object, number, string][] = [
    [
      { tables: [{ source: 'NAO_EXISTE', name: 'sankhya_x' }], ...DAILY },
      422,
      'COPY_TABLE_NOT_DECLARED',
    ],
    [{ tables: [{ ...NOTAS, name: 'Sankhya Notas' }], ...DAILY }, 422, 'COPY_NAME_INVALID'],
    [{ tables: [NOTAS], interval: '24h', startDate: '2999-01-01' }, 422, 'COPY_START_DATE_INVALID'],
    [{ tables: [NOTAS], interval: '5m', startDate: null }, 400, 'REQUEST_MALFORMED'],
  ]
  for (const [body, status, code] of refused) {
    const answered = await on.put(connection, body)
    assert.deepEqual([answered.statusCode, codeOf(answered)], [status, code], JSON.stringify(body))
  }
  const bia = await on.member('Bia', 'member')
  const forbidden = await on.put(connection, { tables: [NOTAS], ...DAILY }, bia)
  assert.deepEqual([forbidden.statusCode, codeOf(forbidden)], [404, 'NOT_FOUND'])
  const noRun = await on.run(connection, {}, bia)
  assert.deepEqual([noRun.statusCode, codeOf(noRun)], [404, 'NOT_FOUND'])
  assert.deepEqual(await counts(on), before)
})

test('gravar a cópia: sem lago pronto, 409 e nada grava', async (t) => {
  const on = await lakeCopyOn(t, { noLake: true })
  const connection = await on.linked()
  const before = await counts(on)
  const refused = await on.put(connection, { tables: [NOTAS], ...DAILY })
  assert.deepEqual([refused.statusCode, codeOf(refused)], [409, 'COPY_LAKE_NOT_READY'])
  assert.deepEqual(await counts(on), before)
  assert.deepEqual(on.viewOf(await on.get(connection)).lake, { kind: 'NOT_READY' })
})

test('o lago em ready é lido de novo na AWS: a pilha que sumiu recusa a marca (T.19)', async (t) => {
  const on = await lakeCopyOn(t)
  const connection = await on.linked()
  assert.ok(on.stack !== undefined && on.stacks !== undefined)
  assert.equal((await on.stacks.remove(on.where, on.stack)).kind, 'DONE')
  for (let read = 0; read < 2; read += 1) await on.stacks.status(on.where, on.stack)
  const [row] = await on.rows(`select state from lake.company_lake`)
  assert.equal(row?.state, 'ready', 'the row still says ready')
  const before = await counts(on)
  const refused = await on.put(connection, { tables: [NOTAS], ...DAILY })
  assert.deepEqual([refused.statusCode, codeOf(refused)], [409, 'COPY_LAKE_NOT_READY'])
  assert.deepEqual(await counts(on), before)
})

test('o nome: fora do padrão, fixo depois de marcado, repetido e a corrida pelo índice', async (t) => {
  const on = await lakeCopyOn(t)
  const connection = await on.linked('Matriz')
  const invalid = [
    'notas',
    'sankhya_',
    'Sankhya_notas',
    'sankhya notas',
    `sankhya_${'a'.repeat(60)}`,
  ]
  for (const name of invalid) {
    const answered = await on.put(connection, { tables: [{ source: 'TGFCAB', name }], ...DAILY })
    assert.deepEqual([answered.statusCode, codeOf(answered)], [422, 'COPY_NAME_INVALID'], name)
  }
  assert.equal((await on.put(connection, { tables: [NOTAS], ...DAILY })).statusCode, 200)
  const fixed = await on.put(connection, {
    tables: [{ source: 'TGFCAB', name: 'sankhya_outra' }],
    ...DAILY,
  })
  assert.deepEqual([fixed.statusCode, codeOf(fixed)], [409, 'COPY_NAME_FIXED'])
  const twice = await on.put(connection, {
    tables: [NOTAS, { source: 'TGFPAR', name: 'sankhya_notas' }],
    ...DAILY,
  })
  assert.deepEqual([twice.statusCode, codeOf(twice)], [409, 'COPY_NAME_TAKEN'])

  const [one, two] = [await on.linked('Norte'), await on.linked('Sul')]
  const race = { tables: [{ source: 'TGFPAR', name: 'sankhya_clientes' }], ...DAILY }
  const answers = await Promise.all([on.put(one, race), on.put(two, race)])
  assert.deepEqual(answers.map((each) => each.statusCode).sort(), [200, 409])
  const loser = answers.find((each) => each.statusCode === 409)
  assert.ok(loser !== undefined)
  assert.equal(codeOf(loser), 'COPY_NAME_TAKEN')
  const [named] = await on.rows(
    `select count(*)::int as n from copies.lake_table where name = 'sankhya_clientes'`,
  )
  assert.equal(named?.n, 1)
  const [copies] = await on.rows(`select count(*)::int as n from copies.lake_copy`)
  assert.equal(copies?.n, 2, 'the loser left no copy')
})

test('desmarcar: as tabelas da AWS saem primeiro e a linha depois; com rodada aberta, 409; a última leva a cópia e o relógio', async (t) => {
  const on = await lakeCopyOn(t)
  const connection = await on.linked()
  assert.equal((await on.put(connection, { tables: [NOTAS, PARCEIROS], ...DAILY })).statusCode, 200)
  await on.hub.lakeRuns.idle()
  on.aws.seedTables(
    'raw/sankhya_notas',
    'current/sankhya_notas',
    'raw/sankhya_parceiros',
    'current/sankhya_parceiros',
  )

  const open = await on.put(connection, { tables: [PARCEIROS], ...DAILY })
  assert.deepEqual([open.statusCode, codeOf(open)], [409, 'COPY_RUN_OPEN'])
  assert.equal(on.aws.tables().length, 4, 'nothing dropped under an open round')

  await finished(on, connection, ['sankhya_notas', 'sankhya_parceiros'])
  assert.equal((await on.put(connection, { tables: [PARCEIROS], ...DAILY })).statusCode, 200)
  assert.deepEqual(on.aws.tables().sort(), ['current/sankhya_parceiros', 'raw/sankhya_parceiros'])
  const [left] = await on.rows(`select name from copies.lake_table where connection_id = $1`, [
    connection,
  ])
  assert.equal(left?.name, 'sankhya_parceiros')

  assert.equal((await on.put(connection, { tables: [], ...DAILY })).statusCode, 200)
  assert.deepEqual(on.aws.tables(), [])
  assert.equal((await on.rows(`select 1 from copies.lake_copy`)).length, 0)
  assert.equal(await on.hub.lakeClock.next(connection), null)
})

test('a AWS fora ao marcar: 503 e nada muda', async (t) => {
  const on = await lakeCopyOn(t, {
    stacks: (real) => ({ ...real, status: async () => ({ kind: 'NO_ANSWER' }) }),
  })
  const connection = await on.linked()
  const before = await counts(on)
  const answered = await on.put(connection, { tables: [NOTAS], ...DAILY })
  assert.deepEqual([answered.statusCode, codeOf(answered)], [503, 'COPY_AWS_UNAVAILABLE'])
  assert.deepEqual(await counts(on), before)
})
