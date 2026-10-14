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

test('a conexão derrubada no meio de um comando vira DATABASE_UNAVAILABLE e o processo segue', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  const started = Promise.withResolvers<number>()
  const running = database.command(async (tx) => {
    const backend = await tx.execute(sql`select pg_backend_pid()::int as pid`)
    started.resolve(Number(backend.rows[0]?.pid))
    return tx.execute(sql`select pg_sleep(30)`)
  })
  const refused = assert.rejects(running, failsWith('DATABASE_UNAVAILABLE'))
  await asOwner('select pg_terminate_backend($1)', [await started.promise])
  await refused
  const next = await database.read((tx) => tx.execute(sql`select 1 as one`))
  assert.deepEqual(next.rows, [{ one: 1 }])
})

test('uma leitura parada além do prazo falha e a conexão não volta ao pool', async (t) => {
  const { database } = await createTestDatabase(t)
  const held = Promise.withResolvers<void>()
  const release = Promise.withResolvers<void>()
  const holder = database.command(async (tx) => {
    await tx.execute(sql`set local idle_in_transaction_session_timeout = 0`)
    await tx.execute(sql`select pg_advisory_xact_lock(777)`)
    held.resolve()
    await release.promise
  })
  await held.promise
  await assert.rejects(
    database.read(async (tx) => {
      await tx.execute(sql`set local statement_timeout = 0`)
      return tx.execute(sql`select pg_advisory_xact_lock(777)`)
    }),
    failsWith('DATABASE_UNAVAILABLE'),
  )
  const next = await database.read((tx) => tx.execute(sql`select 1 as one`))
  assert.deepEqual(next.rows, [{ one: 1 }])
  release.resolve()
  await holder
})

test('um erro do próprio programa na consulta não vira banco fora', async (t) => {
  const { database } = await createTestDatabase(t)
  const circular: Record<string, unknown> = {}
  circular.self = circular
  await assert.rejects(
    database.read((tx) => tx.execute(sql`select ${circular}::text`)),
    failsWith('INTERNAL_UNEXPECTED'),
  )
})
