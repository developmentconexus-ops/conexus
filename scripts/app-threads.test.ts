import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'

const dir = mkdtempSync(join(tmpdir(), 'conexus-threads-'))
after(() => rmSync(dir, { recursive: true, force: true }))

// A request still waiting on its app when the test ends must not keep the file's process alive: the
// teardown ends each app through `stop()`, which rejects what waits on it. The child runs the real
// `threads()` against a `db` that never answers and then runs its teardown, as `node --test` does.
const child = `
import { threads } from ${JSON.stringify(new URL('../tests/e2e/app-threads.ts', import.meta.url).href)}
const main = Buffer.from(\`export default { async fetch(request, env, ctx) {
  return new Response(JSON.stringify(await ctx.props.db.query('select 1')))
} }\`)
const hooks = []
const serve = threads({ after: (hook) => hooks.push(hook) })
const db = { query: () => new Promise(() => {}) }
const ended = serve('app', { main, cpuMs: 50 }, new Request('https://x/'), { caller: null, db }).then(
  () => 2,
  () => 0,
)
await new Promise((resolve) => setTimeout(resolve, 300))
for (const hook of hooks) await hook()
process.exitCode = await ended
`

test('a request still waiting at teardown does not keep the process alive', () => {
  const file = join(dir, 'child.mjs')
  writeFileSync(file, child)
  const run = spawnSync(process.execPath, [file], { encoding: 'utf8', timeout: 20_000 })
  assert.equal(run.error, undefined, 'the process did not exit')
  assert.equal(run.status, 0, run.stderr)
})
