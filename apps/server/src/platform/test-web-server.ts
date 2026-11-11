import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import type { TestContext } from 'node:test'
import { createServer } from './http.ts'
import { testConfig, unreachableDatabaseUrl } from './test-database.ts'

/** The Hub's server over a folder of built web files (each file's content is its own path), signed out. */
export async function servingWeb(t: TestContext, files: string[]) {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-web-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  for (const file of files) {
    mkdirSync(dirname(join(dir, file)), { recursive: true })
    writeFileSync(join(dir, file), file)
  }
  const app = await createServer(testConfig(await unreachableDatabaseUrl()), {
    webRoot: dir,
    readSession: async () => ({ kind: 'SIGNED_OUT' }),
  })
  t.after(() => app.close())
  return app
}
