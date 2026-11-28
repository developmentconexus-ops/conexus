import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { biomeLint, removePlanted } from './test-rules.ts'

after(removePlanted)

test('P0: o Biome recusa setTimeout e setInterval em harness/, aceita nos donos, nos testes e fora dele', () => {
  const clock =
    'export function wait() {\n  setTimeout(() => {}, 1)\n  setInterval(() => {}, 1)\n}\n'
  const run = biomeLint({
    'apps/server/src/harness/a/other.ts': clock,
    'apps/server/src/harness/b/wait.ts': clock,
    'apps/server/src/harness/model-accounts/google/calls.ts': clock,
    'apps/server/src/harness/a/other.test.ts': clock,
    'apps/server/src/hub/a/timer.ts': clock,
  })
  const flagged = new Set(
    [...run.output.matchAll(/^(apps\/\S+\.ts):\d+:\d+ lint\/style\/noRestrictedGlobals/gm)].map(
      ([, file]) => file,
    ),
  )
  assert.deepEqual(
    [...flagged].sort(),
    ['apps/server/src/harness/a/other.ts', 'apps/server/src/harness/b/wait.ts'],
    run.output,
  )
})

test('P0: o Biome recusa o relógio importado de node:timers em harness/, aceita nos testes e fora dele', () => {
  const clock =
    "import { setTimeout } from 'node:timers/promises'\nimport { setInterval } from 'node:timers'\nexport async function wait() {\n  await setTimeout(1)\n  return setInterval\n}\n"
  const run = biomeLint({
    'apps/server/src/harness/a/wait.ts': clock,
    'apps/server/src/harness/a/wait.test.ts': clock,
    'apps/server/src/hub/a/timer.ts': clock,
  })
  const flagged = [
    ...run.output.matchAll(/^(apps\/\S+\.ts):(\d+):\d+ lint\/style\/noRestrictedImports/gm),
  ].map(([, file, line]) => `${file}:${line}`)
  assert.deepEqual(
    flagged.sort(),
    ['apps/server/src/harness/a/wait.ts:1', 'apps/server/src/harness/a/wait.ts:2'],
    run.output,
  )
})
