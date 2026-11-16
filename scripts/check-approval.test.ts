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

function commit(dir: string, message: string) {
  git(dir, 'add', '.')
  git(dir, 'commit', '-qm', message)
}

function approval(sha: string): string {
  return `Cartão da etapa 1 aprovado em 2026-10-13 (commit ${sha}): "Aprovo"\n`
}

function repository(): { dir: string; card: string } {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-approval-'))
  dirs.push(dir)
  git(dir, 'init', '-q', '-b', 'main')
  write(dir, 'docs/steps/e01-x.md', 'card\n')
  write(dir, 'docs/approvals/README.md', 'ledger\n')
  git(dir, 'add', '.')
  git(dir, 'commit', '-q', '-m', 'card')
  return { dir, card: git(dir, 'rev-parse', 'HEAD') }
}

function run(dir: string, ...args: string[]) {
  return spawnSync('node', [SCRIPT, dir, ...args], { encoding: 'utf8', timeout: 120_000 })
}

test('aceita o cartão aprovado e inalterado', () => {
  const { dir, card } = repository()
  write(dir, 'docs/approvals/e01-x.md', approval(card))
  commit(dir, 'approval')
  assert.equal(run(dir).status, 0)
})

test('lê a aprovação mais nova de um cartão emendado', () => {
  const { dir, card } = repository()
  write(dir, 'docs/steps/e01-x.md', 'card amended\n')
  commit(dir, 'amendment')
  const amended = git(dir, 'rev-parse', 'HEAD')
  write(dir, 'docs/approvals/e01-x.md', approval(card) + approval(amended))
  commit(dir, 'approvals')
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
  write(dir, 'docs/approvals/e01-x.md', approval(stray))
  commit(dir, 'approval')
  const result = run(dir)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /^approval-commit-not-in-tip: /)
})

test('recusa cartão mudado depois da aprovação', () => {
  const { dir, card } = repository()
  write(dir, 'docs/approvals/e01-x.md', approval(card))
  write(dir, 'docs/steps/e01-x.md', 'card changed\n')
  commit(dir, 'approval and change')
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
  commit(dir, 'decimal card')
  const decimalCard = git(dir, 'rev-parse', 'HEAD')
  write(
    dir,
    'docs/approvals/e041-convite.md',
    `Cartão da etapa 4.1 aprovado em 2026-10-16 (commit ${decimalCard}): "Aprovo"\n`,
  )
  commit(dir, 'decimal card approval')
  assert.equal(run(dir).status, 0)
})

function decimalCardRepository(name: string): { dir: string; sha: string; ledger: string } {
  const { dir } = repository()
  git(dir, 'rm', '-q', 'docs/steps/e01-x.md')
  write(dir, `docs/steps/${name}`, 'card\n')
  git(dir, 'add', '.')
  commit(dir, 'card')
  return { dir, sha: git(dir, 'rev-parse', 'HEAD'), ledger: `docs/approvals/${name}` }
}

test('reconhece o cartão e121 como etapa 12.1 sem confundir com a etapa 12', () => {
  const { dir, sha, ledger } = decimalCardRepository('e121-conversa-no-painel.md')
  write(dir, ledger, `Cartão da etapa 12 aprovado em 2026-10-16 (commit ${sha}): "Aprovo"\n`)
  commit(dir, 'approval of 12')
  assert.equal(run(dir).status, 1)
  write(dir, ledger, `Cartão da etapa 12.1 aprovado em 2026-10-16 (commit ${sha}): "Aprovo"\n`)
  commit(dir, 'approval of 12.1')
  assert.equal(run(dir).status, 0)
})

test('reconhece o cartão e131 como etapa 13.1', () => {
  const { dir, sha, ledger } = decimalCardRepository('e131-x.md')
  write(dir, ledger, `Cartão da etapa 13.1 aprovado em 2026-10-16 (commit ${sha}): "Aprovo"\n`)
  commit(dir, 'approval')
  assert.equal(run(dir).status, 0)
})

test('reconhece o cartão e2432 como etapa 24.3.2, sem confundir com a 24.32 nem com a 24.3', () => {
  const { dir, sha, ledger } = decimalCardRepository('e2432-x.md')
  for (const wrong of ['24.32', '24.3']) {
    write(
      dir,
      ledger,
      `Cartão da etapa ${wrong} aprovado em 2026-11-03 (commit ${sha}): "Aprovo"\n`,
    )
    commit(dir, `approval of ${wrong}`)
    assert.equal(run(dir).status, 1, wrong)
  }
  write(dir, ledger, `Cartão da etapa 24.3.2 aprovado em 2026-11-03 (commit ${sha}): "Aprovo"\n`)
  commit(dir, 'approval of 24.3.2')
  assert.equal(run(dir).status, 0)
})

test('o cartão e12 continua sendo a etapa 12', () => {
  const { dir, sha, ledger } = decimalCardRepository('e12-x.md')
  write(dir, ledger, `Cartão da etapa 12 aprovado em 2026-10-16 (commit ${sha}): "Aprovo"\n`)
  commit(dir, 'approval')
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
  commit(dir, 'two cards')
  return { dir, sha: git(dir, 'rev-parse', 'HEAD') }
}

function approvalOf(step: string, sha: string): string {
  return `Cartão da etapa ${step} aprovado em 2026-10-16 (commit ${sha}): "Aprovo"\n`
}

test('aceita dois cartões aprovados e inalterados', () => {
  const { dir, sha } = twoCardRepository()
  write(dir, 'docs/approvals/e121-a.md', approvalOf('12.1', sha))
  write(dir, 'docs/approvals/e122-b.md', approvalOf('12.2', sha))
  commit(dir, 'approvals')
  assert.equal(run(dir).status, 0)
})

test('recusa o segundo cartão sem aprovação, nomeando-o', () => {
  const { dir, sha } = twoCardRepository()
  write(dir, 'docs/approvals/e121-a.md', approvalOf('12.1', sha))
  commit(dir, 'approval of the first')
  const result = run(dir)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /^approval-missing: .*e122-b\.md/)
})

test('recusa o segundo cartão mudado depois da aprovação, nomeando-o', () => {
  const { dir, sha } = twoCardRepository()
  write(dir, 'docs/approvals/e121-a.md', approvalOf('12.1', sha))
  write(dir, 'docs/approvals/e122-b.md', approvalOf('12.2', sha))
  write(dir, 'docs/steps/e122-b.md', 'card 12.2 changed\n')
  commit(dir, 'approvals and change')
  const result = run(dir)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /^card-changed-after-approval: .*e122-b\.md/)
})

test('recusa o cartão do trilho de desenho sem aprovação, ao lado de um da fronteira aprovado', () => {
  const { dir, card } = repository()
  write(dir, 'docs/approvals/e01-x.md', approval(card))
  write(dir, 'docs/steps/e133-pauta.md', '# Pauta\n\nTrilho: desenho\n')
  git(dir, 'add', '.')
  commit(dir, 'design card')
  const result = run(dir)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /^approval-missing: .*e133-pauta\.md/)
})

function shortCardRepository(): { dir: string; sha: string } {
  const { dir } = repository()
  git(dir, 'rm', '-q', 'docs/steps/e01-x.md')
  write(dir, 'docs/steps/saude-do-ci.md', 'short card\n')
  git(dir, 'add', '.')
  commit(dir, 'short card')
  return { dir, sha: git(dir, 'rev-parse', 'HEAD') }
}

function shortApproval(sha: string, amendment = false): string {
  const opening = amendment ? 'Emenda do cartão curto' : 'Cartão curto'
  const verb = amendment ? 'aprovada' : 'aprovado'
  return `${opening} "Saúde do CI" (\`docs/steps/saude-do-ci.md\`) ${verb} em 2026-11-04 (commit ${sha}), na página do fundador: "Aprovo".\n`
}

test('aceita o cartão curto aprovado e inalterado', () => {
  const { dir, sha } = shortCardRepository()
  write(dir, 'docs/approvals/saude-do-ci.md', shortApproval(sha))
  commit(dir, 'approval')
  const result = run(dir)
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /saude-do-ci\.md approved at/)
})

test('recusa o cartão curto sem linha de aprovação, nomeando o arquivo', () => {
  const { dir } = shortCardRepository()
  const result = run(dir)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /^approval-missing: .*saude-do-ci\.md/)
})

test('recusa o cartão curto mudado depois da aprovação', () => {
  const { dir, sha } = shortCardRepository()
  write(dir, 'docs/approvals/saude-do-ci.md', shortApproval(sha))
  write(dir, 'docs/steps/saude-do-ci.md', 'short card changed\n')
  commit(dir, 'approval and change')
  const result = run(dir)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /^card-changed-after-approval: .*saude-do-ci\.md/)
})

test('lê a linha mais nova entre o Cartão curto e a Emenda', () => {
  const { dir, sha } = shortCardRepository()
  write(dir, 'docs/steps/saude-do-ci.md', 'short card amended\n')
  commit(dir, 'amendment')
  const amended = git(dir, 'rev-parse', 'HEAD')
  write(dir, 'docs/approvals/saude-do-ci.md', shortApproval(sha) + shortApproval(amended, true))
  commit(dir, 'approvals')
  const result = run(dir)
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, new RegExp(`approved at ${amended}`))
})

test('a linha de outro cartão curto não aprova este', () => {
  const { dir, sha } = shortCardRepository()
  write(
    dir,
    'docs/approvals/saude-do-ci.md',
    shortApproval(sha).replace('saude-do-ci', 'outro-cartao'),
  )
  commit(dir, 'approval of another card')
  const result = run(dir)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /^approval-missing: .*saude-do-ci\.md/)
})

test('a linha certa no arquivo de outro cartão não aprova este', () => {
  const { dir, sha } = shortCardRepository()
  write(dir, 'docs/approvals/outro-cartao.md', shortApproval(sha))
  commit(dir, 'approval in the wrong file')
  const result = run(dir)
  assert.equal(result.status, 1)
  assert.match(
    result.stderr,
    /^approval-missing: docs\/approvals\/saude-do-ci\.md .*saude-do-ci\.md/,
  )
})

test('o cartão curto exige as palavras do fundador e cada abertura o seu gênero', () => {
  for (const line of [
    shortApproval('abc1234').replace(/, na página.*\n/, '\n'),
    shortApproval('abc1234').replace('aprovado', 'aprovada'),
    shortApproval('abc1234', true).replace('aprovada', 'aprovado'),
  ]) {
    const { dir, sha } = shortCardRepository()
    write(dir, 'docs/approvals/saude-do-ci.md', line.replace('abc1234', sha))
    commit(dir, 'approval')
    const result = run(dir)
    assert.equal(result.status, 1, line)
    assert.match(result.stderr, /^approval-missing: .*saude-do-ci\.md/)
  }
})
