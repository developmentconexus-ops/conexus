import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { after, test } from 'node:test'

const SCRIPT = resolve(import.meta.dirname, 'check-docs.ts')
const dirs: string[] = []
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

const CLEAN: Record<string, string> = {
  'AGENTS.md': 'Instructions.\n',
  'docs/index.md': '- [code](guides/code.md): rules.\n- [steps](steps/): the card.\n',
  'docs/guides/code.md': '- **C1.** A rule.\n',
  'docs/steps/.keep': '',
}

function check(changes: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-docs-'))
  dirs.push(dir)
  for (const [path, content] of Object.entries({ ...CLEAN, ...changes })) {
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), content)
  }
  return spawnSync('node', [SCRIPT, dir], { encoding: 'utf8' })
}

function words(count: number): string {
  return 'word '.repeat(count)
}

test('aceita uma árvore limpa', () => {
  const run = check({})
  assert.equal(run.status, 0, run.stderr)
})

const REFUSALS: [string, Record<string, string>][] = [
  ['document-too-long', { 'docs/decisions/0001-x.md': words(351) }],
  ['broken-link', { 'AGENTS.md': 'See [gone](docs/gone.md).\n' }],
  ['not-in-index', { 'docs/guides/web.md': '- **W1.** A rule.\n' }],
  ['rule-defined-twice', { 'docs/guides/web.md': '- **C1.** Again.\n' }],
  ['rule-missing', { 'AGENTS.md': 'Obey C9.\n' }],
  ['retired-name', { 'AGENTS.md': 'Run the wave.\n' }],
  [
    'skill-name-differs-from-folder',
    {
      '.agents/skills/a/SKILL.md': '---\nname: b\ndescription: x\n---\nBody.\n',
      'docs/index.md':
        '- [code](guides/code.md): rules.\n- [steps](steps/): the card.\n- [a](../.agents/skills/a/SKILL.md): a.\n',
    },
  ],
  ['second-card', { 'docs/steps/e01-a.md': 'a\n', 'docs/steps/e02-b.md': 'b\n' }],
  [
    'founder-page-too-long',
    { 'docs/steps/e01-a.md': `## A página do fundador\n${words(601)}\n## As unidades\nx\n` },
  ],
]

for (const [name, changes] of REFUSALS) {
  test(`recusa ${name}`, () => {
    const run = check(changes)
    assert.equal(run.status, 1)
    assert.match(run.stderr, new RegExp(`^${name}: `, 'm'))
  })
}

test('um link para fora do repositório não é conferido', () => {
  const run = check({ 'AGENTS.md': 'See [site](https://example.com/x).\n' })
  assert.equal(run.status, 0, run.stderr)
})

test('um link dentro de código não é conferido', () => {
  const run = check({ 'AGENTS.md': 'Write `[a](gone.md)` like this.\n' })
  assert.equal(run.status, 0, run.stderr)
})
