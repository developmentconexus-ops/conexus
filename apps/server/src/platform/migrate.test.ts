import assert from 'node:assert/strict'
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { sql } from 'drizzle-orm'
import { migrate } from './migrate.ts'
import { createTestDatabase, databaseWithPassword, withRoleLock } from './test-database.ts'

test('o login do Hub recebe 42501 em DELETE e em DDL', async (t) => {
  const { database } = await createTestDatabase(t)
  for (const statement of [
    sql`delete from drizzle.__drizzle_migrations`,
    sql`create table public.planted (id int)`,
  ]) {
    await assert.rejects(
      database.command((tx) => tx.execute(statement)),
      (error: unknown) => {
        assert.ok(error instanceof Error && error.cause instanceof Error && 'code' in error.cause)
        assert.equal(error.cause.code, '42501')
        return true
      },
    )
  }
})

test('migrate duas vezes: a segunda não aplica nada, e só a senha do arquivo entra', async (t) => {
  const test = await createTestDatabase(t)
  const applied = `select count(*)::int as applied from drizzle.__drizzle_migrations`
  const first = await test.asOwner(applied)
  await withRoleLock(() => migrate({ ownerUrl: test.ownerUrl, runtimeUrl: test.runtimeUrl }))
  assert.deepEqual(await test.asOwner(applied), first)
  const right = await test.database.read((tx) => tx.execute(sql`select current_user as login`))
  assert.deepEqual(right.rows, [{ login: 'hub_runtime' }])
  const other = databaseWithPassword(test, 'not-the-file-password')
  await assert.rejects(
    other.read((tx) => tx.execute(sql`select 1`)),
    (error: unknown) => {
      assert.ok(error instanceof Error && error.cause instanceof Error && 'code' in error.cause)
      assert.equal(error.cause.code, '28P01')
      return true
    },
  )
  await other.close()
})

test('migrate recusa uma URL do Hub que não é a do login hub_runtime', async (t) => {
  const test = await createTestDatabase(t)
  await withRoleLock(async () => {
    await assert.rejects(
      migrate({ ownerUrl: test.ownerUrl, runtimeUrl: test.ownerUrl }),
      (error: unknown) => error instanceof Error && error.message.startsWith('CONFIG_INVALID'),
    )
  })
})

test('migrate não corta uma migração lenta no prazo de 15 s das consultas do Hub', async (t) => {
  const test = await createTestDatabase(t)
  const folder = mkdtempSync(join(tmpdir(), 'conexus-migrations-'))
  t.after(() => rmSync(folder, { recursive: true, force: true }))
  cpSync(join(import.meta.dirname, '..', '..', 'migrations'), folder, { recursive: true })
  mkdirSync(join(folder, '99991231000000_slow'))
  writeFileSync(join(folder, '99991231000000_slow', 'migration.sql'), 'select pg_sleep(17);')
  await withRoleLock(() =>
    migrate({
      ownerUrl: test.ownerUrl,
      runtimeUrl: test.runtimeUrl,
      migrationsFolder: folder,
    }),
  )
  const applied = await test.asOwner(
    "select count(*)::int as slow from drizzle.__drizzle_migrations where name like '%_slow'",
  )
  assert.deepEqual(applied, [{ slow: 1 }])
})

test('migrate aplica os limites do login do Hub também quando o papel já existia', async (t) => {
  const test = await createTestDatabase(t)
  const settings = await withRoleLock(async () => {
    await test.asOwner('alter role hub_runtime reset all')
    await test.asOwner(
      "delete from drizzle.__drizzle_migrations where name like '%hub_runtime_login'",
    )
    await migrate({ ownerUrl: test.ownerUrl, runtimeUrl: test.runtimeUrl })
    return test.asOwner(`select rolconfig from pg_roles where rolname = 'hub_runtime'`)
  })
  assert.deepEqual(settings, [
    { rolconfig: ['statement_timeout=10s', 'idle_in_transaction_session_timeout=10s'] },
  ])
})
