import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { promisify } from 'node:util'
import { sql } from 'drizzle-orm'
import type { TestDatabase } from './test-database.ts'
import { createTestDatabase, withRoleLock } from './test-database.ts'

const run = promisify(execFile)

const APPROVED = readFileSync(join(import.meta.dirname, '..', '..', 'database-grants.sql'), 'utf8')
  .split('\n')
  .filter((line) => line !== '' && !line.startsWith('--'))
  .join('\n')

const OBJECT_LINES =
  /^(ALTER .* OWNER TO |GRANT |REVOKE |ALTER DEFAULT PRIVILEGES |ALTER DATABASE .* SET |ALTER ROLE .* IN DATABASE )/
const ROLE_LINES = /^(CREATE ROLE|ALTER ROLE|GRANT|REVOKE) /

// The harness names are replaced by fixed words, so the approved file holds what production has.
const SUPERUSER = 'postgres'
const OWNER_WORD = 'test_owner'
const SUPERUSER_WORD = 'test_superuser'
const DATABASE_WORD = 'hub_database'

type Dumped = TestDatabase & { container: string }

/** The snapshot needs pg_dump 18, which runs inside the container that serves the tests. */
function dumped(t: TestContext, test: TestDatabase): Dumped | undefined {
  const { container } = test
  if (container !== undefined) return { ...test, container }
  t.skip('opt-in: pg_dump 18 runs inside CONEXUS_TEST_DATABASE_CONTAINER')
  return undefined
}

// The PostgreSQL 18 client that dumps is the one in the container that serves the tests.
async function dump(test: Dumped, program: string, args: string[]): Promise<string[]> {
  const { container } = test
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

function named(text: string, name: string, word: string): string {
  return text.replace(new RegExp(`\\b${name}\\b`, 'g'), word)
}

async function snapshotOf(test: Dumped): Promise<string> {
  const url = new URL(test.ownerUrl.reveal())
  const database = url.pathname.slice(1)
  const owner = decodeURIComponent(url.username)
  const objects = await dump(test, 'pg_dump', ['--create', '--schema-only', database])
  const roles = await dump(test, 'pg_dumpall', ['--roles-only', '--no-role-passwords'])
  function harness(line: string): boolean {
    return new RegExp(`^(CREATE|ALTER) ROLE (${owner}|${SUPERUSER})\\b`).test(line)
  }
  return [
    ...objects.filter((line) => OBJECT_LINES.test(line)),
    ...roles.filter((line) => ROLE_LINES.test(line) && !harness(line)),
  ]
    .map((line) =>
      named(
        named(named(line, database, DATABASE_WORD), owner, OWNER_WORD),
        SUPERUSER,
        SUPERUSER_WORD,
      ),
    )
    .join('\n')
}

test('o instantâneo depois de migrate é o de database-grants.sql', async (t) => {
  const database = dumped(t, await createTestDatabase(t))
  if (database === undefined) return
  assert.equal(await withRoleLock(() => snapshotOf(database)), APPROVED)
})

// Roles belong to the whole server, so a planted role or membership is made and undone inside the
// lock. Giving an object to hub_runtime needs the owner to be its member for a moment.
const MEMBER = 'grant hub_runtime to current_user'
const NOT_MEMBER = 'revoke hub_runtime from current_user'
const PLANTED: [string, string[], string, string[]?][] = [
  [
    'um schema de que hub_runtime é dono',
    [MEMBER, 'create schema planted authorization hub_runtime'],
    'ALTER SCHEMA planted OWNER TO hub_runtime;',
    [NOT_MEMBER],
  ],
  [
    'uma permissão padrão para hub_runtime',
    ['alter default privileges in schema hub grant delete on tables to hub_runtime'],
    `ALTER DEFAULT PRIVILEGES FOR ROLE ${OWNER_WORD} IN SCHEMA hub GRANT DELETE ON TABLES TO hub_runtime;`,
  ],
  [
    'uma concessão a mais',
    ['grant insert on drizzle.__drizzle_migrations to hub_runtime'],
    'GRANT SELECT,INSERT ON TABLE drizzle.__drizzle_migrations TO hub_runtime;',
  ],
  [
    'CREATE no banco',
    ['grant create on database $db to hub_runtime'],
    `GRANT CREATE ON DATABASE ${DATABASE_WORD} TO hub_runtime;`,
  ],
  [
    'um banco de que hub_runtime é dono',
    [MEMBER, 'alter database $db owner to hub_runtime'],
    `ALTER DATABASE ${DATABASE_WORD} OWNER TO hub_runtime;`,
    ['alter database $db owner to current_user', NOT_MEMBER],
  ],
  [
    'uma configuração do papel neste banco',
    ['alter role hub_runtime in database $db set statement_timeout = 0'],
    `ALTER ROLE hub_runtime IN DATABASE ${DATABASE_WORD} SET statement_timeout TO '0';`,
  ],
  [
    'um papel a mais',
    ['create role planted_login login'],
    'CREATE ROLE planted_login;',
    ['drop role planted_login'],
  ],
  [
    'DELETE em auth.user',
    ['grant delete on auth.user to hub_runtime'],
    'GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE auth."user" TO hub_runtime;',
  ],
]
for (const [name, statements, line, undo = []] of PLANTED) {
  test(`o instantâneo recusa ${name}`, async (t) => {
    const database = dumped(t, await createTestDatabase(t))
    if (database === undefined) return
    const databaseName = new URL(database.ownerUrl.reveal()).pathname.slice(1)
    const actual = await withRoleLock(async () => {
      try {
        for (const statement of statements) {
          await database.asOwner(statement.replaceAll('$db', databaseName))
        }
        return await snapshotOf(database)
      } finally {
        for (const statement of undo) {
          await database.asOwner(statement.replaceAll('$db', databaseName))
        }
      }
    })
    assert.notEqual(actual, APPROVED)
    assert.ok(actual.split('\n').includes(line), actual)
  })
}

const REFUSED: [string, ReturnType<typeof sql>][] = [
  ['DELETE de auth.user', sql`delete from auth.user`],
  ['DELETE de auth.account', sql`delete from auth.account`],
  // Step 4, decision 8: the Hub never deletes a company, a member or an invitation.
  ['DELETE de auth.company', sql`delete from auth.company`],
  ['DELETE de auth.member', sql`delete from auth.member`],
  ['DELETE de auth.invitation', sql`delete from auth.invitation`],
  ['DDL em auth', sql`alter table auth.session add column planted text`],
]
for (const [name, statement] of REFUSED) {
  test(`o login do Hub recebe 42501 em ${name}`, async (t) => {
    const { database } = await createTestDatabase(t)
    await assert.rejects(
      database.command((tx) => tx.execute(statement)),
      (error: unknown) => {
        assert.ok(error instanceof Error && error.cause instanceof Error && 'code' in error.cause)
        assert.equal(error.cause.code, '42501')
        return true
      },
    )
  })
}
