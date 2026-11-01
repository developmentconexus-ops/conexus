import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { after, test } from 'node:test'

const SCRIPT = resolve(import.meta.dirname, 'check-method-freeze.ts')
const dirs: string[] = []
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

function git(dir: string, ...args: string[]) {
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', ...args], {
    cwd: dir,
    timeout: 120_000,
  })
}

function write(dir: string, path: string, content: string) {
  mkdirSync(dirname(join(dir, path)), { recursive: true })
  writeFileSync(join(dir, path), content)
}

function branch(changed: string, card: boolean | string): string {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-freeze-'))
  dirs.push(dir)
  git(dir, 'init', '-q', '-b', 'main')
  write(dir, 'README.md', 'x\n')
  if (card) write(dir, `docs/steps/${card === true ? 'e01-x.md' : card}`, 'card\n')
  git(dir, 'add', '.')
  git(dir, 'commit', '-q', '-m', 'base')
  git(dir, 'checkout', '-q', '-b', 'topic')
  write(dir, changed, 'changed\n')
  git(dir, 'add', '.')
  git(dir, 'commit', '-q', '-m', 'change')
  return dir
}

function run(dir: string, labels = '') {
  return spawnSync('node', [SCRIPT, '--base', 'main', '--root', dir, '--labels', labels], {
    encoding: 'utf8',
    timeout: 120_000,
  })
}

test('recusa mudança em guia com cartão em docs/steps', () => {
  const result = run(branch('docs/guides/code.md', true))
  assert.equal(result.status, 1)
  assert.match(result.stderr, /^method-frozen-during-step: docs\/guides\/code\.md/)
})

test('recusa mudança em skill com cartão em docs/steps', () => {
  const result = run(branch('.agents/skills/conexus-build/SKILL.md', true))
  assert.equal(result.status, 1)
})

test('aceita com o rótulo emergência', () => {
  assert.equal(run(branch('docs/guides/code.md', true), 'bug,emergência').status, 0)
})

test('recusa guia com cartão da trilha padrão', () => {
  assert.equal(run(branch('docs/guides/code.md', 'pattern-e01-x.md')).status, 1)
})

test('aceita o modelo do cartão padrão com só um cartão da fronteira', () => {
  const path = '.agents/skills/conexus-scope/references/pattern-card.md'
  assert.equal(run(branch(path, 'e01-x.md')).status, 0)
})

test('recusa o modelo do cartão padrão com cartão da trilha padrão', () => {
  const path = '.agents/skills/conexus-scope/references/pattern-card.md'
  assert.equal(run(branch(path, 'pattern-e01-x.md')).status, 1)
})

test('aceita sem cartão em docs/steps', () => {
  assert.equal(run(branch('docs/guides/code.md', false)).status, 0)
})

test('aceita mudança fora de skills e guias', () => {
  assert.equal(run(branch('docs/architecture.md', true)).status, 0)
})

test('recusa guia que sai de docs/guides por renomeação', () => {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-freeze-'))
  dirs.push(dir)
  git(dir, 'init', '-q', '-b', 'main')
  write(dir, 'docs/steps/e01-x.md', 'card\n')
  write(
    dir,
    'docs/guides/security.md',
    'a guide with enough lines\nto be recognised\nas the same file\n',
  )
  git(dir, 'add', '.')
  git(dir, 'commit', '-q', '-m', 'base')
  git(dir, 'checkout', '-q', '-b', 'topic')
  git(dir, 'mv', 'docs/guides/security.md', 'docs/security.md')
  git(dir, 'commit', '-q', '-m', 'move')
  const result = run(dir)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /^method-frozen-during-step: docs\/guides\/security\.md/)
})
