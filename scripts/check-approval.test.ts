import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { after, test } from 'node:test'

const SCRIPT = resolve(import.meta.dirname, 'check-approval.ts')
const dirs: string[] = []
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

function git(dir: string, ...args: string[]): string {
  return execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', ...args], {
    cwd: dir,
    encoding: 'utf8',
    timeout: 120_000,
  }).trim()
}

function write(dir: string, path: string, content: string) {
  mkdirSync(dirname(join(dir, path)), { recursive: true })
  writeFileSync(join(dir, path), content)
}

function approval(sha: string): string {
  return `Cartão da etapa 1 aprovado em 2026-10-13 (commit ${sha}): "Aprovo"\n`
}

function repository(): { dir: string; card: string } {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-approval-'))
  dirs.push(dir)
  git(dir, 'init', '-q', '-b', 'main')
  write(dir, 'docs/steps/e01-x.md', 'card\n')
  write(dir, 'docs/approvals.md', 'ledger\n')
  git(dir, 'add', '.')
  git(dir, 'commit', '-q', '-m', 'card')
  return { dir, card: git(dir, 'rev-parse', 'HEAD') }
}

function run(dir: string, ...args: string[]) {
  return spawnSync('node', [SCRIPT, dir, ...args], { encoding: 'utf8', timeout: 120_000 })
}

test('aceita o cartão aprovado e inalterado', () => {
  const { dir, card } = repository()
  write(dir, 'docs/approvals.md', approval(card))
  git(dir, 'commit', '-qam', 'approval')
  assert.equal(run(dir).status, 0)
})

test('recusa commit fora da ponta', () => {
  const { dir } = repository()
  git(dir, 'checkout', '-q', '-b', 'other')
  write(dir, 'docs/other.md', 'x\n')
  git(dir, 'add', '.')
  git(dir, 'commit', '-q', '-m', 'other')
  const stray = git(dir, 'rev-parse', 'HEAD')
  git(dir, 'checkout', '-q', 'main')
  write(dir, 'docs/approvals.md', approval(stray))
  git(dir, 'commit', '-qam', 'approval')
  const result = run(dir)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /^approval-commit-not-in-tip: /)
})

test('recusa cartão mudado depois da aprovação', () => {
  const { dir, card } = repository()
  write(dir, 'docs/approvals.md', approval(card))
  write(dir, 'docs/steps/e01-x.md', 'card changed\n')
  git(dir, 'commit', '-qam', 'approval and change')
  const result = run(dir)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /^card-changed-after-approval: /)
})

test('recusa cartão sem linha de aprovação', () => {
  const { dir } = repository()
  const result = run(dir)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /^approval-missing: /)
})

test('aceita cartão sem linha quando a mudança só tem documentos', () => {
  const { dir } = repository()
  git(dir, 'checkout', '-q', '-b', 'topic')
  write(dir, 'docs/more.md', 'x\n')
  git(dir, 'add', '.')
  git(dir, 'commit', '-q', '-m', 'docs')
  assert.equal(run(dir, '--base', 'main').status, 0)
})

test('recusa cartão sem linha quando a mudança tem código', () => {
  const { dir } = repository()
  git(dir, 'checkout', '-q', '-b', 'topic')
  write(dir, 'apps/server/src/main.ts', 'export {}\n')
  git(dir, 'add', '.')
  git(dir, 'commit', '-q', '-m', 'code')
  assert.equal(run(dir, '--base', 'main').status, 1)
})

test('reconhece o cartão e041 como etapa 4.1 sem confundir com a etapa 4', () => {
  const { dir } = repository()
  git(dir, 'rm', '-q', 'docs/steps/e01-x.md')
  write(dir, 'docs/steps/e041-convite.md', 'card 4.1\n')
  git(dir, 'add', '.')
  git(dir, 'commit', '-qam', 'decimal card')
  const decimalCard = git(dir, 'rev-parse', 'HEAD')
  write(
    dir,
    'docs/approvals.md',
    `Cartão da etapa 4.1 aprovado em 2026-10-16 (commit ${decimalCard}): "Aprovo"\n`,
  )
  git(dir, 'commit', '-qam', 'decimal card approval')
  assert.equal(run(dir).status, 0)
})

function decimalCardRepository(name: string): { dir: string; sha: string } {
  const { dir } = repository()
  git(dir, 'rm', '-q', 'docs/steps/e01-x.md')
  write(dir, `docs/steps/${name}`, 'card\n')
  git(dir, 'add', '.')
  git(dir, 'commit', '-qam', 'card')
  return { dir, sha: git(dir, 'rev-parse', 'HEAD') }
}

test('reconhece o cartão e121 como etapa 12.1 sem confundir com a etapa 12', () => {
  const { dir, sha } = decimalCardRepository('e121-conversa-no-painel.md')
  write(
    dir,
    'docs/approvals.md',
    `Cartão da etapa 12 aprovado em 2026-10-16 (commit ${sha}): "Aprovo"\n`,
  )
  git(dir, 'commit', '-qam', 'approval of 12')
  assert.equal(run(dir).status, 1)
  write(
    dir,
    'docs/approvals.md',
    `Cartão da etapa 12.1 aprovado em 2026-10-16 (commit ${sha}): "Aprovo"\n`,
  )
  git(dir, 'commit', '-qam', 'approval of 12.1')
  assert.equal(run(dir).status, 0)
})

test('reconhece o cartão e131 como etapa 13.1', () => {
  const { dir, sha } = decimalCardRepository('e131-x.md')
  write(
    dir,
    'docs/approvals.md',
    `Cartão da etapa 13.1 aprovado em 2026-10-16 (commit ${sha}): "Aprovo"\n`,
  )
  git(dir, 'commit', '-qam', 'approval')
  assert.equal(run(dir).status, 0)
})

test('o cartão e12 continua sendo a etapa 12', () => {
  const { dir, sha } = decimalCardRepository('e12-x.md')
  write(
    dir,
    'docs/approvals.md',
    `Cartão da etapa 12 aprovado em 2026-10-16 (commit ${sha}): "Aprovo"\n`,
  )
  git(dir, 'commit', '-qam', 'approval')
  assert.equal(run(dir).status, 0)
})

test('sem cartão não há o que conferir', () => {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-approval-'))
  dirs.push(dir)
  git(dir, 'init', '-q', '-b', 'main')
  assert.equal(run(dir).status, 0)
})

function twoCardRepository(): { dir: string; sha: string } {
  const { dir } = repository()
  git(dir, 'rm', '-q', 'docs/steps/e01-x.md')
  write(dir, 'docs/steps/e121-a.md', 'card 12.1\n')
  write(dir, 'docs/steps/e122-b.md', 'card 12.2\n')
  git(dir, 'add', '.')
  git(dir, 'commit', '-qam', 'two cards')
  return { dir, sha: git(dir, 'rev-parse', 'HEAD') }
}

function approvalOf(step: string, sha: string): string {
  return `Cartão da etapa ${step} aprovado em 2026-10-16 (commit ${sha}): "Aprovo"\n`
}

test('aceita dois cartões aprovados e inalterados', () => {
  const { dir, sha } = twoCardRepository()
  write(dir, 'docs/approvals.md', approvalOf('12.1', sha) + approvalOf('12.2', sha))
  git(dir, 'commit', '-qam', 'approvals')
  assert.equal(run(dir).status, 0)
})

test('recusa o segundo cartão sem aprovação, nomeando-o', () => {
  const { dir, sha } = twoCardRepository()
  write(dir, 'docs/approvals.md', approvalOf('12.1', sha))
  git(dir, 'commit', '-qam', 'approval of the first')
  const result = run(dir)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /^approval-missing: .*e122-b\.md/)
})

test('recusa o segundo cartão mudado depois da aprovação, nomeando-o', () => {
  const { dir, sha } = twoCardRepository()
  write(dir, 'docs/approvals.md', approvalOf('12.1', sha) + approvalOf('12.2', sha))
  write(dir, 'docs/steps/e122-b.md', 'card 12.2 changed\n')
  git(dir, 'commit', '-qam', 'approvals and change')
  const result = run(dir)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /^card-changed-after-approval: .*e122-b\.md/)
})
