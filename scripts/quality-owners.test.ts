import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { runCommand, spawnCommand } from './command.ts'
import { owners } from './quality-mutation.ts'

const dirs: string[] = []
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

function tree(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'conexus-owners-'))
  dirs.push(root)
  for (const [name, text] of Object.entries(files)) {
    mkdirSync(join(root, name, '..'), { recursive: true })
    writeFileSync(join(root, name), text)
  }
  return root
}

const PKG = 'apps/server'
const DIR = `${PKG}/src/a`

test('os donos de um arquivo incluem o teste ao lado e todo teste da pasta que o alcança por imports da pasta, sem sair da pasta', () => {
  const root = tree({
    [`${DIR}/machine.ts`]: 'export const x = 1\n',
    [`${DIR}/machine.test.ts`]: "import { x } from './machine.ts'\n",
    [`${DIR}/public.ts`]: "export { x } from './machine.ts'\n",
    [`${DIR}/lane.test.ts`]: "import { x } from './public.ts'\n",
    [`${DIR}/helper.test.ts`]: "import { z } from './test-helper.ts'\n",
    [`${DIR}/test-helper.ts`]: "export { x as z } from './machine.ts'\n",
    [`${DIR}/far.test.ts`]: "import { w } from '../b/far.ts'\n",
    [`${PKG}/src/b/far.ts`]: "export { x as w } from '../a/machine.ts'\n",
    [`${DIR}/other.test.ts`]: "import { y } from './elsewhere.ts'\n",
    [`${DIR}/elsewhere.ts`]: 'export const y = 2\n',
  })
  const sources = new Map<string, [number, number][]>([[`${DIR}/machine.ts`, [[1, 1]]]])
  const found = owners({ root, changed: sources, sources, pkg: PKG })
  assert.deepEqual(found.sort(), [
    `${DIR}/helper.test.ts`,
    `${DIR}/lane.test.ts`,
    `${DIR}/machine.test.ts`,
  ])
})

test('um arquivo sem teste ao lado tem como donos os testes da pasta que o importam', () => {
  const root = tree({
    [`${DIR}/chosen.ts`]: 'export const c = 1\n',
    [`${DIR}/routes.test.ts`]: "import { c } from './chosen.ts'\n",
  })
  const sources = new Map<string, [number, number][]>([[`${DIR}/chosen.ts`, [[1, 1]]]])
  assert.deepEqual(owners({ root, changed: sources, sources, pkg: PKG }), [`${DIR}/routes.test.ts`])
})

test('um comando com saída maior que 1 MiB devolve a saída inteira', () => {
  const script = "process.stdout.write('x'.repeat(2 * 1024 * 1024))"
  assert.equal(runCommand('node', ['-e', script], { cwd: tmpdir() }).length, 2 * 1024 * 1024)
  const run = spawnCommand('node', ['-e', script], { cwd: tmpdir(), deadline: 20_000 })
  assert.equal(run.status, 0)
  assert.equal(run.output.length, 2 * 1024 * 1024)
})
