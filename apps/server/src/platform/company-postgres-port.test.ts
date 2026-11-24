import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import { testAppsConfig } from './test-cloudflare.ts'
import { testCompanyPostgres } from './test-company-postgres.ts'

/** Which of the logins the Hub's own source, without its tests, still names. */
function namedByTheHub(logins: readonly string[]): string[] {
  const root = new URL('..', import.meta.url)
  const sources = readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter((path) => path.endsWith('.ts') && !/(^|\/)test-|\.test\.ts$/.test(path))
    .map((path) => readFileSync(new URL(path, root), 'utf8'))
  return logins.filter((login) => sources.some((source) => source.includes(login)))
}

test('a porta sem o sync', () => {
  const port = testCompanyPostgres(testAppsConfig().appLoginKey)
  for (const gone of ['ensureSync', 'syncAddress', 'readerAddress', 'grantCopy', 'revokeCopy'])
    assert.equal(Object.hasOwn(port, gone), false, gone)
  for (const file of ['copy-sql.ts', 'copy-reader.ts'])
    assert.equal(existsSync(new URL(file, import.meta.url)), false, file)
  assert.deepEqual(namedByTheHub(['conexus_sync', 'conexus_read', 'conexus_role_']), [])
})
