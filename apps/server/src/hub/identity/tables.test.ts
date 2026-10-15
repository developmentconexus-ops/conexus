import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createTestDatabase } from '../../platform/test-database.ts'

test('catálogo: o esquema auth tem só as cinco tabelas da biblioteca, sem empresa, membro, convite ou equipe', async (t) => {
  const { asOwner } = await createTestDatabase(t)
  const tables = await asOwner(
    `select table_name as name from information_schema.tables
      where table_schema = 'auth' order by table_name`,
  )
  assert.deepEqual(tables, [
    { name: 'account' },
    { name: 'rate_limit' },
    { name: 'session' },
    { name: 'user' },
    { name: 'verification' },
  ])
})

test('catálogo: token, e-mail e chave do limite são únicos, e sessão e conta caem com a pessoa', async (t) => {
  const { asOwner } = await createTestDatabase(t)
  const unique = await asOwner(
    `select tc.table_name as "table", kcu.column_name as "column"
       from information_schema.table_constraints tc
       join information_schema.key_column_usage kcu using (constraint_schema, constraint_name)
      where tc.constraint_schema = 'auth' and tc.constraint_type = 'UNIQUE'
      order by 1, 2`,
  )
  assert.deepEqual(unique, [
    { table: 'rate_limit', column: 'key' },
    { table: 'session', column: 'token' },
    { table: 'user', column: 'email' },
  ])
  const cascades = await asOwner(
    `select tc.table_name as "table", rc.delete_rule as "onDelete"
       from information_schema.referential_constraints rc
       join information_schema.table_constraints tc using (constraint_schema, constraint_name)
      where rc.constraint_schema = 'auth' order by 1`,
  )
  assert.deepEqual(cascades, [
    { table: 'account', onDelete: 'CASCADE' },
    { table: 'session', onDelete: 'CASCADE' },
  ])
})

test('catálogo: toda data do esquema auth é timestamptz', async (t) => {
  const { asOwner } = await createTestDatabase(t)
  const dates = await asOwner(
    `select data_type as type, count(*)::int as columns
       from information_schema.columns
      where table_schema = 'auth' and data_type like 'timestamp%' group by data_type`,
  )
  assert.deepEqual(dates, [{ type: 'timestamp with time zone', columns: 12 }])
})
