import assert from 'node:assert/strict'
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { sql } from 'drizzle-orm'
import { MIGRATE_RETRY_EXIT, migrate, migrateExitCode } from './migrate.ts'
import {
  createTestDatabase,
  databaseWithPassword,
  freePort,
  runtimeUrlWithPassword,
  serveEnvironment,
  unreachableDatabaseUrl,
  urlFile,
  withOwnerLock,
  withRoleLock,
} from './test-database.ts'
import { startHub } from './test-hub-process.ts'
import { inDatabase, loginAnswer } from './test-mastra-database.ts'
import {
  failureOf,
  loginFails,
  loginWorks,
  migratingWith,
  storedVerifier,
  withOptionsInUrl,
} from './test-migrate.ts'

test('o login do Hub recebe 42501 em DELETE e em DDL', async (t) => {
  const { database } = await createTestDatabase(t)
  for (const statement of [
    sql`delete from drizzle.__drizzle_migrations`,
    sql`create table public.planted (id int)`,
  ]) {
    await assert.rejects(
      database.installation((tx) => tx.execute(statement)),
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
  await withRoleLock(() =>
    migrate({ ownerUrl: test.ownerUrl, mastraUrl: test.mastraUrl, runtimeUrl: test.runtimeUrl }),
  )
  assert.deepEqual(await test.asOwner(applied), first)
  const right = await test.database.installation((tx) =>
    tx.execute(sql`select current_user as login`),
  )
  assert.deepEqual(right.rows, [{ login: 'hub_runtime' }])
  const other = databaseWithPassword(test, 'not-the-file-password')
  await assert.rejects(
    other.installation((tx) => tx.execute(sql`select 1`)),
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
      migrate({ ownerUrl: test.ownerUrl, mastraUrl: test.mastraUrl, runtimeUrl: test.ownerUrl }),
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
      mastraUrl: test.mastraUrl,
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
    await migrate({
      ownerUrl: test.ownerUrl,
      mastraUrl: test.mastraUrl,
      runtimeUrl: test.runtimeUrl,
    })
    return test.asOwner(`select rolconfig from pg_roles where rolname = 'hub_runtime'`)
  })
  assert.deepEqual(settings, [
    { rolconfig: ['statement_timeout=10s', 'idle_in_transaction_session_timeout=10s'] },
  ])
})

test('migrate com a mesma senha não reescreve o verificador do login do Hub', async (t) => {
  const test = await createTestDatabase(t)
  const { container } = test
  if (container === undefined) {
    t.skip('opt-in: reading pg_authid needs the superuser inside CONEXUS_TEST_DATABASE_CONTAINER')
    return
  }
  const before = await storedVerifier(container)
  assert.match(before, /^SCRAM-SHA-256\$/)
  await withRoleLock(() =>
    migrate({ ownerUrl: test.ownerUrl, mastraUrl: test.mastraUrl, runtimeUrl: test.runtimeUrl }),
  )
  await withRoleLock(() =>
    migrate({ ownerUrl: test.ownerUrl, mastraUrl: test.mastraUrl, runtimeUrl: test.runtimeUrl }),
  )
  assert.equal(await storedVerifier(container), before)
  await loginWorks(test, decodeURIComponent(new URL(test.runtimeUrl.reveal()).password))
})

test('migrate com a senha trocada no arquivo: a nova entra e a antiga é recusada', async (t) => {
  const test = await createTestDatabase(t)
  const original = decodeURIComponent(new URL(test.runtimeUrl.reveal()).password)
  const rotated = `${original}-rotated`
  await withRoleLock(async () => {
    try {
      await migrate({
        ownerUrl: test.ownerUrl,
        mastraUrl: test.mastraUrl,
        runtimeUrl: runtimeUrlWithPassword(test, rotated),
      })
      await loginWorks(test, rotated)
      await loginFails(test, original)
    } finally {
      await migrate({
        ownerUrl: test.ownerUrl,
        mastraUrl: test.mastraUrl,
        runtimeUrl: test.runtimeUrl,
      })
    }
  })
  await loginWorks(test, original)
})

test('migrate dá senha ao login do Hub que voltou de uma restauração sem ela', async (t) => {
  const test = await createTestDatabase(t)
  const original = decodeURIComponent(new URL(test.runtimeUrl.reveal()).password)
  await withRoleLock(async () => {
    try {
      await test.asOwner('alter role hub_runtime password null')
      await loginFails(test, original)
    } finally {
      await migrate({
        ownerUrl: test.ownerUrl,
        mastraUrl: test.mastraUrl,
        runtimeUrl: test.runtimeUrl,
      })
    }
  })
  await loginWorks(test, original)
})

test('migrate com o banco recusando a conexão: sai 1 com DATABASE_UNAVAILABLE, não erro inesperado', async (t) => {
  const env = {
    ...serveEnvironment(t, await unreachableDatabaseUrl('hub_runtime'), {
      port: await freePort(),
      edgePort: await freePort(),
    }),
    HUB_MIGRATION_DATABASE_URL_FILE: urlFile(t, await unreachableDatabaseUrl()),
  }
  const { lines, exited } = startHub(t, env, ['migrate'])
  assert.equal(await exited, 1)
  const failures = lines.filter((line) => line.level !== 30).map((line) => [line.msg, line.code])
  assert.deepEqual(failures, [['DATABASE_UNAVAILABLE', 'ECONNREFUSED']])
})

test('a exceção de P6: a migração apaga cada empresa sem cliente, com membros e convites, e mais nada (A15)', async (t) => {
  const test = await createTestDatabase(t)
  // The database is born migrated: P6 runs again on the rows planted after it. The migrator runs
  // every migration whose name it has not recorded, in any position, so later ones change nothing.
  await test.asOwner(
    "delete from drizzle.__drizzle_migrations where name like '%_p6b_test_companies'",
  )
  await test.asOwner(`insert into auth.user (id, name, email) values ('p1', 'Ana', 'ana@example.test');
    insert into auth.company (id, name, slug, created_at, attempt_key) values
      ('test', 'Empresa de teste', 'test', now(), 'test'),
      ('client', 'Cliente', 'client', now(), 'client');
    insert into operations.client (company_id, cnpj, legal_name, attempt_key, registered_at)
      values ('client', '12ABC34501DE35', 'Cliente Ltda', 'client', now());
    insert into auth.member (id, company_id, user_id, role, created_at) values
      ('m1', 'test', 'p1', 'owner', now()), ('m2', 'client', 'p1', 'owner', now());
    insert into auth.invitation
        (id, company_id, email, role, status, expires_at, created_at, inviter_id, attempt_key) values
      ('i1', 'test', 'bruno@example.test', 'member', 'pending', now(), now(), 'p1', 'i1'),
      ('i2', 'client', 'bruno@example.test', 'member', 'pending', now(), now(), 'p1', 'i2');
    insert into auth.session (id, expires_at, token, updated_at, user_id, active_organization_id)
      values ('s1', now(), 't1', now(), 'p1', 'test'), ('s2', now(), 't2', now(), 'p1', 'client')`)
  await withRoleLock(() =>
    migrate({ ownerUrl: test.ownerUrl, mastraUrl: test.mastraUrl, runtimeUrl: test.runtimeUrl }),
  )
  const kept = await test.asOwner(`select
      (select array_agg(id order by id) from auth.company) as companies,
      (select array_agg(id order by id) from auth.member) as members,
      (select array_agg(id order by id) from auth.invitation) as invitations,
      (select array_agg(id || ':' || coalesce(active_organization_id, '-') order by id)
         from auth.session) as sessions,
      (select count(*)::int from auth.user) as people`)
  assert.deepEqual(kept, [
    {
      companies: ['client'],
      members: ['m2'],
      invitations: ['i2'],
      sessions: ['s1:-', 's2:client'],
      people: 1,
    },
  ])
})

test('migrate recusa Mastra no banco do Hub (opção B) e dá senha ao login do Mastra sem ela', async (t) => {
  const test = await createTestDatabase(t)
  const { ownerUrl, runtimeUrl, mastraUrl } = test
  await withRoleLock(async () => {
    await assert.rejects(
      migrate({ ownerUrl, runtimeUrl, mastraUrl: inDatabase(mastraUrl, runtimeUrl) }),
      (error: unknown) => error instanceof Error && error.message.startsWith('CONFIG_INVALID'),
    )
    try {
      await test.asOwner('alter role mastra_runtime password null')
      assert.equal(await loginAnswer(mastraUrl), '28P01')
    } finally {
      await migrate({ ownerUrl, runtimeUrl, mastraUrl })
    }
  })
  assert.equal(await loginAnswer(mastraUrl), 'ok')
})

// Reads the settings of the migrate's own session. A local Postgres also takes pg's loose parameters,
// so this cannot tell `options` from them; only Neon's proxy does (data D25).
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
    assert.equal(failure.details.reason, 'LOCK_BUSY')
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
  assert.equal(failure.details.reason, 'CONNECTION_LOST')
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
  assert.equal(failure.details.reason, 'TOO_LONG')
  assert.equal(migrateExitCode(failure), 1)
  assert.deepEqual(await test.asOwner("select to_regclass('public.slow') as found"), [
    { found: null },
  ])
  const sessions = await test.asOwner(
    "select count(*)::int as n from pg_stat_activity where query like '%pg_sleep(10)%' and pid <> pg_backend_pid()",
  )
  assert.deepEqual(sessions, [{ n: 0 }])
})

test('migrate com a trava ocupada na última espera do limite da transação: longa demais, sem repetir', async (t) => {
  const { test, outcome } = await migratingWith(
    t,
    `create table public.early (id int); select pg_sleep(6.3);
      alter table auth.user add column probe_column int;`,
    { lockTimeoutMs: 1_000, transactionTimeoutMs: 8_000, connectionCheckIntervalMs: 1_000 },
  )
  await withOwnerLock(test, 'lock table auth.user in share mode', [], async (release) => {
    const failure = await failureOf(outcome)
    assert.equal(failure.details.reason, 'TOO_LONG')
    assert.equal(migrateExitCode(failure), 1)
    await release()
  })
})

test('migrate recusa a URL do dono com options, que apagaria os limites', async (t) => {
  const test = await createTestDatabase(t)
  const ownerUrl = withOptionsInUrl(test.ownerUrl)
  await assert.rejects(
    migrate({ ownerUrl, runtimeUrl: test.runtimeUrl, mastraUrl: test.mastraUrl }),
    (error: unknown) => error instanceof Error && error.message.startsWith('CONFIG_INVALID'),
  )
})
