import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { after, test } from 'node:test'

const SCRIPT = resolve(import.meta.dirname, 'check-migrations.ts')
const NIL = '00000000-0000-0000-0000-000000000000'
const FIRST = '11111111-1111-4111-8111-111111111111'
const SECOND = '22222222-2222-4222-8222-222222222222'
const THIRD = '33333333-3333-4333-8333-333333333333'
const dirs: string[] = []
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

function git(dir: string, ...args: string[]) {
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', ...args], {
    cwd: dir,
    stdio: 'ignore',
    timeout: 120_000,
  })
}

function write(dir: string, path: string, content: string) {
  mkdirSync(dirname(join(dir, path)), { recursive: true })
  writeFileSync(join(dir, path), content)
}

function migration(
  dir: string,
  name: string,
  sql: string,
  id: string,
  prev: string,
  ddl: object[] = [],
) {
  write(dir, `apps/server/migrations/${name}/migration.sql`, sql)
  const snapshot = { id, prevIds: [prev], version: '8', dialect: 'postgres', ddl, renames: [] }
  write(dir, `apps/server/migrations/${name}/snapshot.json`, JSON.stringify(snapshot))
}

function commit(dir: string, message: string) {
  git(dir, 'add', '.')
  git(dir, 'commit', '-q', '-m', message)
}

/** A repository whose base already holds the first migration; `change` is what the branch does. */
function check(change: (dir: string) => void): { status: number | null; stderr: string } {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-migrations-'))
  dirs.push(dir)
  git(dir, 'init', '-q', '-b', 'main')
  write(
    dir,
    'apps/server/drizzle.config.ts',
    "export default { dialect: 'postgresql', out: './migrations', schema: './src/**/tables.ts' }\n",
  )
  write(dir, 'apps/server/src/main.ts', 'export const x = 1\n')
  migration(dir, '20260101000000_first', 'CREATE TABLE a (id int);\n', FIRST, NIL)
  commit(dir, 'base')
  git(dir, 'checkout', '-q', '-b', 'topic')
  change(dir)
  commit(dir, 'change')
  const run = spawnSync('node', [SCRIPT, '--base', 'main', '--root', dir], {
    encoding: 'utf8',
    timeout: 120_000,
  })
  return { status: run.status, stderr: run.stderr }
}

function second(dir: string, sql: string) {
  migration(dir, '20260102000000_second', sql, SECOND, FIRST)
}

test('aceita uma migração nova que só acrescenta', () => {
  const run = check((dir) => second(dir, 'ALTER TABLE a ADD COLUMN b int;\n'))
  assert.deepEqual(run, { status: 0, stderr: '' })
})

test('recusa uma migração da base alterada', () => {
  const run = check((dir) =>
    migration(dir, '20260101000000_first', 'CREATE TABLE a (id bigint);\n', FIRST, NIL),
  )
  assert.equal(run.status, 1)
  assert.match(run.stderr, /20260101000000_first\/migration\.sql: an applied migration was changed/)
})

test('recusa uma migração da base apagada', () => {
  const run = check((dir) => {
    rmSync(join(dir, 'apps/server/migrations/20260101000000_first'), { recursive: true })
  })
  assert.equal(run.status, 1)
  assert.match(run.stderr, /an applied migration was deleted/)
})

for (const [name, sql] of [
  ['DROP', 'ALTER TABLE a DROP COLUMN id;\n'],
  ['RENAME', 'ALTER TABLE a RENAME COLUMN id TO key;\n'],
] as const) {
  test(`recusa ${name} sem a linha de contrato`, () => {
    const run = check((dir) => second(dir, sql))
    assert.equal(run.status, 1)
    assert.match(run.stderr, /_second\/migration\.sql: DROP or RENAME needs a line "-- contract/)
  })
}

test('recusa a linha de contrato sem motivo', () => {
  const run = check((dir) => second(dir, '-- contract:\nALTER TABLE a DROP COLUMN id;\n'))
  assert.equal(run.status, 1)
})

test('aceita DROP com a linha de contrato e o motivo', () => {
  const run = check((dir) =>
    second(dir, '-- contract: no code reads id since v0.2.0\nALTER TABLE a DROP COLUMN id;\n'),
  )
  assert.deepEqual(run, { status: 0, stderr: '' })
})

test('recusa duas migrações que partem da mesma', () => {
  const run = check((dir) => {
    const table = [{ entityType: 'tables', name: 't', schema: 'public', isRlsEnabled: false }]
    migration(dir, '20260102000000_second', 'CREATE TABLE t (b int);\n', SECOND, FIRST, table)
    migration(dir, '20260103000000_third', 'CREATE TABLE t (c int);\n', THIRD, FIRST, table)
  })
  assert.equal(run.status, 1)
  assert.match(run.stderr, /drizzle-kit check refused the migration history/)
})

for (const [what, code] of [
  ['pg_advisory_lock', 'await tx.execute(sql`select pg_advisory_lock(1)`)'],
  ['pg_try_advisory_lock', 'await tx.execute(sql`select pg_try_advisory_lock(1)`)'],
  ['SET SESSION', 'await tx.execute(sql`SET SESSION statement_timeout = 0`)'],
  ['SET sem LOCAL', 'await tx.execute(sql`SET statement_timeout = 0`)'],
  ['SET TO', 'await tx.execute(sql`set search_path to other`)'],
  ['set_config falso', "await tx.execute(sql`select set_config('a.b', 'c', false)`)"],
] as const) {
  test(`recusa ${what} no servidor`, () => {
    const run = check((dir) => write(dir, 'apps/server/src/hub/a/store.ts', `${code}\n`))
    assert.equal(run.status, 1)
    assert.match(run.stderr, /apps\/server\/src\/hub\/a\/store\.ts: .* \(data D25\)/)
  })
}

test('aceita SET LOCAL e UPDATE ... SET', () => {
  const run = check((dir) =>
    write(
      dir,
      'apps/server/src/hub/a/store.ts',
      "sql`set local statement_timeout = '5s'`\nsql`update hub.starts\n  set at = now()`\ntx.set(x)\n",
    ),
  )
  assert.deepEqual(run, { status: 0, stderr: '' })
})

test('aceita set_config dentro da transação e a trava de transação', () => {
  const run = check((dir) =>
    write(
      dir,
      'apps/server/src/hub/a/store.ts',
      "sql`select set_config('a.b', 'c', true), pg_advisory_xact_lock(1)`\n",
    ),
  )
  assert.deepEqual(run, { status: 0, stderr: '' })
})
