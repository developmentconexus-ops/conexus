import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sql } from 'drizzle-orm'
import { openDatabase } from './database.ts'
import { createTestDatabase, unreachableDatabaseUrl } from './test-database.ts'

const silent = { info: () => undefined, error: () => undefined }

function failsWith(code: string, sqlstate?: string) {
  return (error: unknown) => {
    assert.ok(error instanceof Error && 'code' in error, 'not a Failure')
    assert.equal(error.code, code)
    if (sqlstate !== undefined) {
      assert.ok(error.cause instanceof Error && 'code' in error.cause)
      assert.equal(error.cause.code, sqlstate)
    }
    return true
  }
}

test('depois de uma leitura o pool chega a zero conexões', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  const countRuntime = `select count(*)::int as open from pg_stat_activity
    where datname = current_database() and usename = 'hub_runtime'`
  const read = await database.read((tx) => tx.execute(sql`select 1 as one`))
  assert.deepEqual(read.rows, [{ one: 1 }])
  assert.deepEqual(await asOwner(countRuntime), [{ open: 1 }])
  await database.whenIdle()
  assert.deepEqual(await asOwner(countRuntime), [{ open: 0 }])
})

test('uma leitura não escreve', async (t) => {
  const { database } = await createTestDatabase(t)
  await assert.rejects(
    database.read((tx) => tx.execute(sql`create temp table scratch (id int)`)),
    failsWith('INTERNAL_UNEXPECTED', '25006'),
  )
})

test('o tempo do comando acaba como banco fora, pelo código do erro', async (t) => {
  const { database } = await createTestDatabase(t)
  await assert.rejects(
    database.read(async (tx) => {
      await tx.execute(sql`set local statement_timeout = '50ms'`)
      return tx.execute(sql`select pg_sleep(5)`)
    }),
    failsWith('DATABASE_UNAVAILABLE', '57014'),
  )
})

test('um erro de SQL que não é queda vira erro inesperado', async (t) => {
  const { database } = await createTestDatabase(t)
  await assert.rejects(
    database.command((tx) => tx.execute(sql`select * from nowhere`)),
    failsWith('INTERNAL_UNEXPECTED', '42P01'),
  )
})

test('o banco inalcançável vira DATABASE_UNAVAILABLE', async () => {
  const database = openDatabase({ url: await unreachableDatabaseUrl(), log: silent })
  await assert.rejects(
    database.read((tx) => tx.execute(sql`select 1`)),
    failsWith('DATABASE_UNAVAILABLE'),
  )
  await database.close()
})

test('o objeto é congelado e fechar duas vezes é seguro', async (t) => {
  const { database } = await createTestDatabase(t)
  assert.ok(Object.isFrozen(database))
  await database.close()
  await database.close()
})
