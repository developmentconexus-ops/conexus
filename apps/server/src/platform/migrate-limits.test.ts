import assert from 'node:assert/strict'
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { Failure } from './failure.ts'
import { MIGRATE_RETRY_EXIT, migrate, migrateExitCode } from './migrate.ts'
import type { TestDatabase } from './test-database.ts'
import { createTestDatabase, withOwnerLock, withRoleLock } from './test-database.ts'

/** The failure `outcome` ends in; a migration that succeeds fails the test. */
async function failureOf(outcome: Promise<unknown>): Promise<Failure> {
  const error = await outcome.then(
    () => undefined,
    (reason: unknown) => reason,
  )
  assert.ok(error instanceof Failure, 'the migration should have failed')
  return error
}

async function migratingWith(
  t: Parameters<typeof createTestDatabase>[0],
  sqlText: string,
  limits?: Parameters<typeof migrate>[0]['limits'],
): Promise<{ test: TestDatabase; outcome: Promise<unknown> }> {
  const test = await createTestDatabase(t)
  const folder = mkdtempSync(join(tmpdir(), 'conexus-migrations-'))
  t.after(() => rmSync(folder, { recursive: true, force: true }))
  cpSync(join(import.meta.dirname, '..', '..', 'migrations'), folder, { recursive: true })
  mkdirSync(join(folder, '99991231000000_probe'))
  writeFileSync(join(folder, '99991231000000_probe', 'migration.sql'), sqlText)
  const outcome = withRoleLock(() =>
    migrate({
      ownerUrl: test.ownerUrl,
      mastraUrl: test.mastraUrl,
      runtimeUrl: test.runtimeUrl,
      migrationsFolder: folder,
      ...(limits === undefined ? {} : { limits }),
    }),
  )
  return { test, outcome }
}

test('a conexão do migrate abre com os limites do deploy em options (D25)', async (t) => {
  const { test, outcome } = await migratingWith(
    t,
    `create table public.limits_seen as select
      current_setting('lock_timeout') as lock_timeout,
      current_setting('transaction_timeout') as transaction_timeout,
      current_setting('client_connection_check_interval') as check_interval;`,
  )
  await outcome
  assert.deepEqual(await test.asOwner('select * from public.limits_seen'), [
    { lock_timeout: '5s', transaction_timeout: '1min', check_interval: '1s' },
  ])
})

test('migrate com a trava ocupada desiste em lock_timeout, nada fica aplicado e o código é de repetir', async (t) => {
  const { test, outcome } = await migratingWith(
    t,
    'alter table auth.user add column probe_column int;',
  )
  await withOwnerLock(test, 'lock table auth.user in share mode', [], async (release) => {
    const failure = await failureOf(outcome)
    assert.equal(failure.details.migration, 'LOCK_BUSY')
    assert.equal(migrateExitCode(failure), MIGRATE_RETRY_EXIT)
    await release()
  })
  const applied = await test.asOwner(
    "select count(*)::int as n from information_schema.columns where column_name = 'probe_column'",
  )
  assert.deepEqual(applied, [{ n: 0 }])
})

test('migrate cuja conexão cai antes do limite da transação: repetível, nada aplicado', async (t) => {
  const { test, outcome } = await migratingWith(
    t,
    'create table public.dropped (id int); select pg_terminate_backend(pg_backend_pid());',
  )
  const failure = await failureOf(outcome)
  assert.equal(failure.details.migration, 'CONNECTION_LOST')
  assert.equal(migrateExitCode(failure), MIGRATE_RETRY_EXIT)
  assert.deepEqual(await test.asOwner("select to_regclass('public.dropped') as found"), [
    { found: null },
  ])
})

test('migrate longa demais para o limite da transação: o servidor encerra, sem repetir e sem nada aplicado', async (t) => {
  const { test, outcome } = await migratingWith(
    t,
    'create table public.slow (id int); select pg_sleep(10);',
    { lockTimeoutMs: 5_000, transactionTimeoutMs: 2_000, connectionCheckIntervalMs: 1_000 },
  )
  const failure = await failureOf(outcome)
  assert.equal(failure.details.migration, 'TOO_LONG')
  assert.equal(migrateExitCode(failure), 1)
  assert.deepEqual(await test.asOwner("select to_regclass('public.slow') as found"), [
    { found: null },
  ])
  const sessions = await test.asOwner(
    "select count(*)::int as n from pg_stat_activity where query like '%pg_sleep(10)%' and pid <> pg_backend_pid()",
  )
  assert.deepEqual(sessions, [{ n: 0 }])
})
