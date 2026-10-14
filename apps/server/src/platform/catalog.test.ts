import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { promisify } from 'node:util'
import type { TestDatabase } from './test-database.ts'
import { createTestDatabase, withRoleLock } from './test-database.ts'

const run = promisify(execFile)

const APPROVED = readFileSync(join(import.meta.dirname, '..', '..', 'database-grants.sql'), 'utf8')

const OBJECT_LINES = /^(ALTER .* OWNER TO |GRANT |REVOKE |ALTER DEFAULT PRIVILEGES )/
const ROLE_LINES = /^(CREATE ROLE|ALTER ROLE|GRANT|REVOKE) .*\bhub_runtime\b/

// The PostgreSQL 18 client that dumps is the one in the container that serves the tests.
async function dump(test: TestDatabase, program: string, args: string[]): Promise<string[]> {
  const { container } = test
  assert.ok(container, 'CONEXUS_TEST_DATABASE_CONTAINER names the container that serves the tests')
  const owner = new URL(test.ownerUrl.reveal())
  const { stdout } = await run(
    'docker',
    [
      'exec',
      `--env=PGPASSWORD=${decodeURIComponent(owner.password)}`,
      container,
      program,
      '--host=localhost',
      `--username=${decodeURIComponent(owner.username)}`,
      ...args,
    ],
    {
      timeout: 30_000,
      killSignal: 'SIGKILL',
    },
  )
  return stdout.split('\n')
}

async function snapshotOf(test: TestDatabase): Promise<string> {
  const database = new URL(test.ownerUrl.reveal()).pathname.slice(1)
  const objects = await dump(test, 'pg_dump', ['--schema-only', database])
  const roles = await dump(test, 'pg_dumpall', ['--roles-only', '--no-role-passwords'])
  return [
    '-- Owners, grants and default privileges of the Hub database (pg_dump --schema-only)',
    ...objects.filter((line) => OBJECT_LINES.test(line)),
    '',
    '-- Roles of the Hub (pg_dumpall --roles-only --no-role-passwords)',
    ...roles.filter((line) => ROLE_LINES.test(line)),
    '',
  ].join('\n')
}

test('o instantâneo depois de migrate é o de database-grants.sql', async (t) => {
  const database = await createTestDatabase(t)
  assert.equal(await withRoleLock(() => snapshotOf(database)), APPROVED)
})

const PLANTED: [string, string, string][] = [
  [
    'um schema de que hub_runtime é dono',
    'create schema planted authorization hub_runtime',
    'ALTER SCHEMA planted OWNER TO hub_runtime;',
  ],
  [
    'uma permissão padrão para hub_runtime',
    'alter default privileges in schema hub grant delete on tables to hub_runtime',
    'ALTER DEFAULT PRIVILEGES FOR ROLE conexus_owner IN SCHEMA hub GRANT DELETE ON TABLES TO hub_runtime;',
  ],
  [
    'uma concessão a mais',
    'grant insert on drizzle.__drizzle_migrations to hub_runtime',
    'GRANT SELECT,INSERT ON TABLE drizzle.__drizzle_migrations TO hub_runtime;',
  ],
]
for (const [name, statement, line] of PLANTED) {
  test(`o instantâneo recusa ${name}`, async (t) => {
    const database = await createTestDatabase(t)
    await database.asOwner(statement)
    const actual = await withRoleLock(() => snapshotOf(database))
    assert.notEqual(actual, APPROVED)
    assert.ok(actual.split('\n').includes(line), actual)
  })
}
