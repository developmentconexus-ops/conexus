import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { biomeLint, ROOT, removePlanted } from './test-rules.ts'

after(removePlanted)

const WAIT = /\bwaitForTimeout\(|setTimeout\(.*,\s*(?:[1-9][0-9_]{3,}|[1-9][0-9]*e[0-9]+)\s*\)/

const FILE = 'apps/server/src/platform/wait.test.ts'
function flaggedLines(body: string) {
  const run = biomeLint({ [FILE]: body })
  return [...run.output.matchAll(/^apps\/\S+\.ts:(\d+):\d+ plugin/gm)].map(([, line]) => line)
}

test('T20: o Biome recusa waitForTimeout e setTimeout de 1 s ou mais em arquivo de teste', () => {
  const body = [
    'await page.waitForTimeout(50)',
    'setTimeout(() => {}, 1000)',
    'setTimeout(() => {}, 2_500)',
    'setTimeout(() => {}, 1e3)',
    'setTimeout(() => {}, 999)',
    'setTimeout(() => {}, 5)',
    '',
  ].join('\n')
  assert.deepEqual(flaggedLines(body), ['1', '2', '3', '4'])
})

test('T20: a espera de 1 s ou mais com o porquê no biome-ignore passa, sem o porquê não', () => {
  const body = [
    '// biome-ignore lint/plugin: the production clock is the subject of this test',
    'setTimeout(() => {}, 1000)',
    '',
  ].join('\n')
  assert.deepEqual(flaggedLines(body), [])
  const run = biomeLint({
    [FILE]: body.replace(': the production clock is the subject of this test', ''),
  })
  assert.notEqual(run.status, 0, run.output)
})

test('T20: o que não é arquivo de teste fica fora da regra', () => {
  const run = biomeLint({ 'apps/server/src/platform/wait.ts': 'setTimeout(() => {}, 5000)\n' })
  assert.doesNotMatch(run.output, /plugin/)
})

test('a lista das esperas de hoje só diminui: todo arquivo nela ainda tem uma espera e existe', () => {
  const config = JSON.parse(readFileSync(join(ROOT, 'biome.json'), 'utf8'))
  const override = config.overrides.find((entry: { plugins?: string[] }) =>
    entry.plugins?.includes('./scripts/test-waits.grit'),
  )
  assert.ok(override)
  const listed: string[] = override.includes
    .filter((glob: string) => glob.startsWith('!'))
    .map((glob: string) => glob.slice(1))
  assert.ok(listed.length > 0)
  for (const file of listed) {
    assert.match(
      readFileSync(join(ROOT, file), 'utf8'),
      WAIT,
      `${file} saiu das esperas: tire-o da lista`,
    )
  }
})
