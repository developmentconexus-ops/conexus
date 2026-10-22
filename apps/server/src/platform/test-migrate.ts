import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { sql } from 'drizzle-orm'
import { Failure } from './failure.ts'
import type { TestDatabase } from './test-database.ts'
import { databaseWithPassword } from './test-database.ts'

const run = promisify(execFile)

// The owner is no superuser, so the stored verifier is read by the superuser inside the container.
export async function storedVerifier(container: string): Promise<string> {
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

export async function loginFails(test: TestDatabase, password: string): Promise<void> {
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

export async function loginWorks(test: TestDatabase, password: string): Promise<void> {
  const other = databaseWithPassword(test, password)
  try {
    const result = await other.installation((tx) => tx.execute(sql`select current_user as login`))
    assert.deepEqual(result.rows, [{ login: 'hub_runtime' }])
  } finally {
    await other.close()
  }
}

/** The failure `outcome` ends in; a migration that succeeds fails the test. */
export async function failureOf(outcome: Promise<unknown>): Promise<Failure> {
  const error = await outcome.then(
    () => undefined,
    (reason: unknown) => reason,
  )
  assert.ok(error instanceof Failure, 'the migration should have failed')
  return error
}
