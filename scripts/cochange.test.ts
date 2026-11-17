import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { after, test } from 'node:test'

const SCRIPT = resolve(import.meta.dirname, 'cochange.ts')
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

function commit(dir: string, files: string[], round: number) {
  for (const file of files) {
    mkdirSync(dirname(join(dir, file)), { recursive: true })
    writeFileSync(join(dir, file), `${round}\n`)
  }
  git(dir, 'add', '.')
  git(dir, 'commit', '-q', '-m', `change ${round}`)
}

function repository(): string {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-cochange-'))
  dirs.push(dir)
  git(dir, 'init', '-q', '-b', 'main')
  for (let round = 0; round < 6; round++) {
    commit(dir, ['agents/a.ts', 'tools/t.ts', 'agents/a.test.ts'], round)
  }
  for (let round = 6; round < 12; round++) commit(dir, ['agents/a.ts'], round)
  for (let round = 12; round < 18; round++) commit(dir, ['other/o.ts'], round)
  return dir
}

function run(dir: string, ...args: string[]) {
  const result = spawnSync('node', [SCRIPT, '--root', dir, ...args], {
    encoding: 'utf8',
    timeout: 120_000,
  })
  return { status: result.status, out: result.stdout, err: result.stderr }
}

test('lista a pasta e o arquivo que mudam juntos e ignora o teste', () => {
  const { status, out } = run(repository(), '--folders', 'agents,tools,other')
  assert.equal(status, 0)
  assert.match(out, /100%\s+6 commits\s+agents\s+\+\s+tools/)
  assert.match(out, /100%\s+6 commits\s+agents\/a\.ts\s+\+\s+tools\/t\.ts/)
  assert.doesNotMatch(out, /a\.test\.ts/)
  assert.doesNotMatch(out, /\+\s+other|other\s+\+/)
})

test('o limiar de porcentagem corta o par fraco', () => {
  const dir = repository()
  assert.match(run(dir, '--folders', 'agents,tools').out, /agents\s+\+\s+tools/)
  const weak = run(dir, '--folders', 'agents,tools', '--min-percent', '101')
  assert.doesNotMatch(weak.out, /agents\s+\+\s+tools/)
})

test('o mínimo de commits corta o par raro', () => {
  const { out } = run(repository(), '--folders', 'agents,tools', '--min-commits', '7')
  assert.doesNotMatch(out, /agents\s+\+\s+tools/)
})

test('o commit com arquivos demais fica fora dos pares de arquivos', () => {
  const { out } = run(repository(), '--folders', 'agents,tools', '--max-files', '1')
  assert.match(out, /agents\s+\+\s+tools/)
  assert.doesNotMatch(out, /agents\/a\.ts\s+\+\s+tools\/t\.ts/)
})

test('o diff mostra só os pares que tocam um arquivo mudado', () => {
  const dir = repository()
  git(dir, 'checkout', '-q', '-b', 'topic')
  commit(dir, ['tools/t.ts'], 99)
  const { status, out } = run(dir, '--base', 'main')
  assert.equal(status, 0)
  assert.match(out, /agents\s+\+\s+tools/)
  assert.doesNotMatch(out, /other/)
})

test('sem pastas nem base, recusa', () => {
  const { status, err } = run(repository())
  assert.equal(status, 2)
  assert.match(err, /usage/)
})
