import assert from 'node:assert/strict'
import { test } from 'node:test'
import { APP_DATA_TOOL } from '@conexus/hub-api'
import { builderDataOn } from '../../hub/apps/test-builder-data.ts'
import { forgetReadLogin } from '../../platform/test-company-postgres.ts'
import { unreachableDatabaseUrl } from '../../platform/test-database.ts'
import { builderAppDataTools } from './public.ts'

const CELL = 'valor-que-nunca-sai'
const SEED = {
  id: '002_conferir',
  statements: [
    'CREATE TABLE grande (id int PRIMARY KEY)',
    'INSERT INTO grande SELECT n FROM generate_series(1, 10001) AS n',
    'CREATE TABLE tipos (a integer, b numeric, c bigint, d date, e text, f boolean, g timestamptz)',
    `INSERT INTO tipos VALUES (1, 1.5, 10, '2026-11-10', '${CELL}', true, '2026-11-10 12:00:00+00'), (2, 2.5, 20, '2026-11-11', '${CELL}', false, NULL), (3, NULL, NULL, NULL, NULL, NULL, NULL)`,
    'CREATE TABLE vazia (id int PRIMARY KEY, nota text, valor numeric)',
  ],
}

const TYPES = [
  { name: 'a', type: 'integer' },
  { name: 'b', type: 'numeric' },
  { name: 'c', type: 'bigint' },
  { name: 'd', type: 'date' },
  { name: 'e', type: 'text' },
  { name: 'f', type: 'boolean' },
  { name: 'g', type: 'timestamp with time zone' },
]

/** What `app_data_check` returns to the model, as the tool of a turn admitted to the Projeto. */
async function checking(t: Parameters<typeof builderDataOn>[0]) {
  const on = await builderDataOn(t, SEED)
  const tool = builderAppDataTools({ data: on.data, ids: on.ids(on.ana) })[APP_DATA_TOOL.check]
  assert.ok(tool.execute)
  const { execute } = tool
  async function check(
    sql: string,
    values: (string | number | boolean | null)[] = [],
  ): Promise<Record<string, unknown>> {
    return Object(await execute({ sql, values }, {}))
  }
  return { ...on, check }
}

test('conferir: conta, colunas e tempo', async (t) => {
  const on = await builderDataOn(t, SEED)
  const asked = { text: 'select * from tipos' }
  const counted = await on.data.check(on.ids(on.ana), asked, AbortSignal.timeout(10_000))
  assert.ok(counted.kind === 'COUNTED')
  assert.deepEqual(counted.rows, { kind: 'EXACT', rows: 3 })
  assert.deepEqual(counted.columns, TYPES)
  assert.equal(typeof counted.ms, 'number')
  assert.ok(counted.ms >= 0)
  assert.ok(!JSON.stringify(counted).includes(CELL), 'no cell of the table is in the answer')
  const edge = [
    ['select id from grande limit 10000', { kind: 'EXACT', rows: 10_000 }],
    ['select id from grande limit 10001', { kind: 'OVER' }],
    ['select id from grande', { kind: 'OVER' }],
  ] as const
  for (const [text, rows] of edge) {
    const answer = await on.data.check(on.ids(on.ana), { text }, AbortSignal.timeout(10_000))
    assert.ok(answer.kind === 'COUNTED', text)
    assert.deepEqual(answer.rows, rows, text)
  }
})

test('conferir: valores, comentário, limite e nomes repetidos', async (t) => {
  const on = await checking(t)
  assert.deepEqual((await on.check('select a from tipos where a = $1', [2])).rows, {
    kind: 'EXACT',
    rows: 1,
  })
  assert.deepEqual(
    (await on.check('select a from tipos where e = $1 and a > $2', [CELL, 1])).rows,
    {
      kind: 'EXACT',
      rows: 1,
    },
  )
  assert.deepEqual((await on.check('select a from tipos -- comentário')).rows, {
    kind: 'EXACT',
    rows: 3,
  })
  assert.deepEqual((await on.check('select id from grande order by id limit 5')).rows, {
    kind: 'EXACT',
    rows: 5,
  })
  const twice = await on.check('select a, a from tipos')
  assert.deepEqual(twice.rows, { kind: 'EXACT', rows: 3 })
  assert.deepEqual(twice.columns, [
    { name: 'a', type: 'integer' },
    { name: 'a', type: 'integer' },
  ])
})

test('conferir: o que não é contagem e as recusas do banco', async (t) => {
  const on = await checking(t)
  // Closes both parentheses of the wrapper and appends a row of its own: two rows, not one count.
  const closed = await on.check(
    'select 1) leitura limit 10001) contada union all select 11 from (select 1 from (select 1',
  )
  assert.deepEqual(closed, { kind: 'FAILED', code: 'CHECK_NOT_A_COUNT' })
  const refused = [
    ['insert into vazia (id) values (1)', '42601'],
    ['with novo as (insert into vazia (id) values (1) returning id) select id from novo', '0A000'],
    // The read login holds no `USAGE` on a sequence, which the database says before the read-only transaction does.
    ["select nextval('recado_id_seq')", '42501'],
    ['select * from nao_existe', '42P01'],
    ['select * from conexus_migration', '42501'],
    ['select 1;', '42601'],
  ] as const
  for (const [sql, sqlstate] of refused) {
    const answer = await on.check(sql)
    assert.deepEqual(answer, { kind: 'REFUSED', code: 'APP_DATA_REFUSED', sqlstate }, sql)
  }
  const timed = await on.check('select pg_sleep(6)')
  assert.deepEqual(timed, { kind: 'FAILED', code: 'APP_DATA_TIMEOUT' })
})

test('conferir: zero linhas mantém as colunas', async (t) => {
  const on = await builderDataOn(t, SEED)
  const counted = await on.data.check(
    on.ids(on.ana),
    { text: 'select id, nota, valor from vazia' },
    AbortSignal.timeout(10_000),
  )
  assert.ok(counted.kind === 'COUNTED')
  assert.deepEqual(counted.rows, { kind: 'EXACT', rows: 0 })
  assert.deepEqual(counted.columns, [
    { name: 'id', type: 'integer' },
    { name: 'nota', type: 'text' },
    { name: 'valor', type: 'numeric' },
  ])
})

test('conferir: app sem login de leitura', async (t) => {
  const on = await builderDataOn(t, SEED)
  await forgetReadLogin(on.owner, on.ids(on.ana).projectId)
  const counted = await on.data.check(
    on.ids(on.ana),
    { text: 'select a from tipos' },
    AbortSignal.timeout(10_000),
  )
  assert.ok(counted.kind === 'COUNTED')
  assert.deepEqual(counted.rows, { kind: 'EXACT', rows: 3 })
})

test('o registro não leva dado', async (t) => {
  const on = await builderDataOn(t, SEED)
  const secret = `where e = '${CELL}'`
  await on.data.check(
    on.ids(on.ana),
    { text: `select a from tipos ${secret} and a = $1`, values: [7] },
    AbortSignal.timeout(10_000),
  )
  await on.data.check(
    on.ids(on.ana),
    { text: 'select * from nao_existe' },
    AbortSignal.timeout(10_000),
  )
  const lines = on.hub.lines.filter((line) => line.message === 'APP_DATA_CHECKED')
  assert.equal(lines.length, 2)
  for (const { fields } of lines) {
    assert.deepEqual(Object.keys(fields).sort(), ['answer', 'companyId', 'ms', 'projectId'])
  }
  assert.deepEqual(
    lines.map(({ fields }) => fields.answer),
    ['COUNTED', 'REFUSED'],
  )
  const text = JSON.stringify(on.hub.lines)
  assert.ok(!text.includes(CELL) && !text.includes('nao_existe') && !text.includes('select a'))
})

test('conferir: o banco da empresa fora é APP_DATA_UNAVAILABLE', async (t) => {
  const on = await builderDataOn(t, SEED)
  on.hub.postgres.companyPostgres.readAddress = async () => unreachableDatabaseUrl()
  const answer = await on.data.check(
    on.ids(on.ana),
    { text: 'select 1' },
    AbortSignal.timeout(10_000),
  )
  assert.deepEqual(answer, { kind: 'FAILED', code: 'APP_DATA_UNAVAILABLE' })
})
