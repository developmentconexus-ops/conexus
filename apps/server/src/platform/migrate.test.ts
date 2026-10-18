import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { promisify } from 'node:util'
import { sql } from 'drizzle-orm'
import { migrate } from './migrate.ts'
import type { TestDatabase } from './test-database.ts'
import {
  createTestDatabase,
  databaseWithPassword,
  freePort,
  runtimeUrlWithPassword,
  serveEnvironment,
  unreachableDatabaseUrl,
  urlFile,
  withRoleLock,
} from './test-database.ts'
import { startHub } from './test-hub-process.ts'

const run = promisify(execFile)

// The owner is no superuser, so the stored verifier is read by the superuser inside the container.
async function storedVerifier(container: string): Promise<string> {
  const { stdout } = await run(
    'docker',
    [
      'exec',
      container,
      'psql',
      '--username=postgres',
      '--no-psqlrc',
      '--tuples-only',
      '--no-align',
      '--command',
      "select rolpassword from pg_authid where rolname = 'hub_runtime'",
    ],
    { timeout: 30_000, killSignal: 'SIGKILL' },
  )
  return stdout.trim()
}

async function loginFails(test: TestDatabase, password: string): Promise<void> {
  const other = databaseWithPassword(test, password)
  try {
    await assert.rejects(
      other.installation((tx) => tx.execute(sql`select 1`)),
      (error: unknown) => {
        assert.ok(error instanceof Error && error.cause instanceof Error && 'code' in error.cause)
        assert.equal(error.cause.code, '28P01')
        return true
      },
    )
  } finally {
    await other.close()
  }
}

async function loginWorks(test: TestDatabase, password: string): Promise<void> {
  const other = databaseWithPassword(test, password)
  try {
    const result = await other.installation((tx) => tx.execute(sql`select current_user as login`))
    assert.deepEqual(result.rows, [{ login: 'hub_runtime' }])
  } finally {
    await other.close()
  }
}

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
  await withRoleLock(() => migrate({ ownerUrl: test.ownerUrl, runtimeUrl: test.runtimeUrl }))
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

test('migrate com a mesma senha não reescreve o verificador do login do Hub', async (t) => {
  const test = await createTestDatabase(t)
  const { container } = test
  if (container === undefined) {
    t.skip('opt-in: reading pg_authid needs the superuser inside CONEXUS_TEST_DATABASE_CONTAINER')
    return
  }
  const before = await storedVerifier(container)
  assert.match(before, /^SCRAM-SHA-256\$/)
  await withRoleLock(() => migrate({ ownerUrl: test.ownerUrl, runtimeUrl: test.runtimeUrl }))
  await withRoleLock(() => migrate({ ownerUrl: test.ownerUrl, runtimeUrl: test.runtimeUrl }))
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
        runtimeUrl: runtimeUrlWithPassword(test, rotated),
      })
      await loginWorks(test, rotated)
      await loginFails(test, original)
    } finally {
      await migrate({ ownerUrl: test.ownerUrl, runtimeUrl: test.runtimeUrl })
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
      await migrate({ ownerUrl: test.ownerUrl, runtimeUrl: test.runtimeUrl })
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
  await withRoleLock(() => migrate({ ownerUrl: test.ownerUrl, runtimeUrl: test.runtimeUrl }))
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
