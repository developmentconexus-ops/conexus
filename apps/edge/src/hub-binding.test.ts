import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

const EDGE = join(import.meta.dirname, '..')
const BIOME = join(EDGE, '../../node_modules/.bin/biome')
const READS_HUB = [
  'export function a(env: Env) {',
  '  const { HUB } = env',
  "  return [env.HUB, env['HUB'], HUB]",
  '}',
  '',
].join('\n')

test('C56: o Biome recusa env.HUB fora de src/hub.ts, e o aceita nele', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-edge-lint-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  writeFileSync(join(dir, 'biome.json'), '{}\n')
  mkdirSync(join(dir, 'edge/src'), { recursive: true })
  for (const file of ['biome.json', 'hub-binding.grit']) {
    cpSync(join(EDGE, file), join(dir, 'edge', file))
  }
  writeFileSync(join(dir, 'edge/src/dispatcher.ts'), READS_HUB)
  writeFileSync(join(dir, 'edge/src/hub.ts'), READS_HUB)
  const run = spawnSync(BIOME, ['lint', '--colors=off', '--only=plugin', '.'], {
    cwd: dir,
    encoding: 'utf8',
    timeout: 60_000,
  })
  const output = run.stdout + run.stderr
  const flagged = [...output.matchAll(/^(edge\/src\/\S+):(\d+):\d+ plugin/gm)]
  assert.deepEqual(
    flagged.map(([, file, line]) => `${file}:${line}`),
    ['edge/src/dispatcher.ts:2', 'edge/src/dispatcher.ts:3', 'edge/src/dispatcher.ts:3'],
    output,
  )
})
