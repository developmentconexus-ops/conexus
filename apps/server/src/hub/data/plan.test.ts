import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ReadAnswer } from '@conexus/hub-api'
import { readerAt } from '../access/test-principal.ts'
import type { RolesWorld } from '../copies/test-readers.ts'
import { rolesWorld } from '../copies/test-readers.ts'

function asBruno(w: RolesWorld) {
  const scope = readerAt({
    companyId: w.on.companyId,
    personId: w.brunoId,
    place: { kind: 'COMPANY' },
  })
  return w.on.hub.data(scope, { thread: null })
}

function recordsOf(w: RolesWorld) {
  return w.on.hub.test.asOwner(
    'select verb, query, outcome, rows from data.data_read where company_id = $1 order by at, id',
    [w.on.companyId],
  )
}

async function refusedAll(w: RolesWorld, queries: readonly string[]) {
  const data = asBruno(w)
  for (const sql of queries) {
    const answer: ReadAnswer = await data.read({ kind: 'QUERY', sql })
    assert.deepEqual(answer, { kind: 'NOT_IN_CATALOG' }, sql)
  }
  const records = await recordsOf(w)
  assert.deepEqual(
    records.map(({ verb, query, outcome, rows }) => [verb, query, outcome, rows]),
    queries.map((sql) => ['QUERY', sql, 'NOT_IN_CATALOG', null]),
  )
}

test('o catálogo do sistema é recusado e deixa linha', async (t) => {
  const w = await rolesWorld(t, 'PLANTED')
  await refusedAll(w, [
    'select relname from pg_class',
    'select table_name from information_schema.tables',
    'select * from pg_catalog.pg_roles',
  ])
})

test('a função e o tipo que leem por nome são recusados', async (t) => {
  const w = await rolesWorld(t, 'PLANTED')
  await refusedAll(w, [
    "select query_to_xml('select * from sync.sankhya_vendas', true, false, '')",
    "select to_regclass('sync.sankhya_clientes')",
    "select pg_relation_size('sync.sankhya_vendas')",
    "select 'sync.sankhya_clientes'::regclass",
  ])
})

test('a função que lê uma tabela fora do papel esbarra no banco, antes do plano', async (t) => {
  const w = await rolesWorld(t, 'PLANTED')
  const sql = "select query_to_xml('select * from sync.sankhya_clientes', true, false, '')"
  assert.deepEqual(await asBruno(w).read({ kind: 'QUERY', sql }), { kind: 'NOT_IN_ROLE' })
})

test('a consulta comum passa', async (t) => {
  const w = await rolesWorld(t, 'PLANTED')
  const data = asBruno(w)
  const grouped = await data.read({
    kind: 'QUERY',
    sql: `select date_trunc('day', "DTNEG") as dia, sum("VLRNOTA") as total, coalesce(max("NUNOTA"), 0) as ultimo
      from sync.sankhya_vendas group by 1`,
  })
  assert.equal(grouped.kind, 'QUERY', JSON.stringify(grouped))
  const counted = await data.read({
    kind: 'QUERY',
    sql: 'select count(*) from sync.sankhya_vendas',
  })
  assert.equal(counted.kind, 'QUERY', JSON.stringify(counted))
})

test('o plano fora de sync é recusado', async (t) => {
  const w = await rolesWorld(t, 'PLANTED')
  const plan = [{ Plan: { 'Node Type': 'Seq Scan', Schema: 'public', 'Relation Name': 'visao' } }]
  t.mock.method(w.on.hub.postgres.companyPostgres, 'readCopies', async () => ({
    kind: 'ROWS' as const,
    results: [
      { columns: [{ name: 'QUERY PLAN', typeId: 114 }], rows: [[plan]] },
      { columns: [{ name: 'n', typeId: 23 }], rows: [[1]] },
    ],
  }))
  const scope = readerAt({
    companyId: w.on.companyId,
    personId: w.on.anaId,
    place: { kind: 'COMPANY' },
  })
  const sql = 'select * from public.visao'
  const answer = await w.on.hub.data(scope, { thread: null }).read({ kind: 'QUERY', sql })
  assert.deepEqual(answer, { kind: 'NOT_IN_CATALOG' })
  const [record, ...rest] = await recordsOf(w)
  assert.deepEqual(rest, [])
  assert.deepEqual([record?.query, record?.outcome], [sql, 'NOT_IN_CATALOG'])
})
