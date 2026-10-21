import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { biomeLint, removePlanted } from './test-rules.ts'

after(removePlanted)

test('P0: o Biome recusa setTimeout e setInterval em builder/, aceita nos três donos e nos testes', () => {
  const clock =
    'export function wait() {\n  setTimeout(() => {}, 1)\n  setInterval(() => {}, 1)\n}\n'
  const runs = 'apps/server/src/builder/runs'
  const run = biomeLint({
    [`${runs}/other.ts`]: clock,
    'apps/server/src/builder/machine/wait.ts': clock,
    [`${runs}/deadline.ts`]: clock,
    [`${runs}/lease.ts`]: clock,
    [`${runs}/copy-retry.ts`]: clock,
    [`${runs}/runs.test.ts`]: clock,
    'apps/server/src/hub/a/timer.ts': clock,
  })
  const flagged = new Set(
    [...run.output.matchAll(/^(apps\/\S+\.ts):\d+:\d+ lint\/style\/noRestrictedGlobals/gm)].map(
      ([, file]) => file,
    ),
  )
  assert.deepEqual(
    [...flagged].sort(),
    ['apps/server/src/builder/machine/wait.ts', `${runs}/other.ts`],
    run.output,
  )
})
