import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { after, test } from 'node:test'

const RADIUS = resolve(import.meta.dirname, 'check-radius.ts')
const CARD = [
  '# Etapa 9: Teste',
  '',
  '## U1 Primeira',
  '',
  '### O raio da mudança',
  '',
  '| Arquivo | Cria, muda ou apaga | Quem importa ou chama |',
  '| --- | --- | --- |',
  '| `apps/server/src/{boot,hub/a/b}.test.ts`, `apps/server/src/c.ts` | Muda | CI |',
  '| `apps/server/migrations/<data>_tables/` | Cria | `migrate` |',
  '| `apps/web/src/*.test.tsx`, `scripts/x.grit`, `biome.json` | Cria | Biome |',
  '',
  '### Os contratos que a unidade cria',
  '',
  '- `outside/contract.ts` is not in the radius.',
  '',
  '## U2 Segunda',
  '',
  '### O raio da mudança',
  '',
  '| Arquivo | Cria, muda ou apaga | Quem importa ou chama |',
  '| --- | --- | --- |',
  '| `apps/server/src/d.ts` | Muda | — |',
  '',
].join('\n')

const repos: string[] = []
after(() => {
  for (const repo of repos) rmSync(repo, { recursive: true, force: true })
})

function git(repo: string, ...args: string[]) {
  return spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.test', ...args], {
    cwd: repo,
    encoding: 'utf8',
  })
}

function committed(files: string[]): string {
  const repo = mkdtempSync(join(tmpdir(), 'conexus-radius-'))
  repos.push(repo)
  git(repo, 'init', '--quiet')
  mkdirSync(join(repo, 'docs/steps'), { recursive: true })
  writeFileSync(join(repo, 'docs/steps/e09-teste.md'), CARD)
  git(repo, 'add', '.')
  git(repo, 'commit', '--quiet', '-m', 'card')
  for (const file of files) {
    mkdirSync(dirname(join(repo, file)), { recursive: true })
    writeFileSync(join(repo, file), 'x\n')
  }
  git(repo, 'add', '.')
  git(repo, 'commit', '--quiet', '-m', 'unit')
  return repo
}

function radius(repo: string, ...args: string[]) {
  return spawnSync('node', [RADIUS, ...args], { cwd: repo, encoding: 'utf8', timeout: 120_000 })
}

test('raio: os arquivos da tabela da unidade passam, com chaves, marcador, curinga e pasta', () => {
  const repo = committed([
    'apps/server/src/boot.test.ts',
    'apps/server/src/hub/a/b.test.ts',
    'apps/server/src/c.ts',
    'apps/server/migrations/20261015_tables/migration.sql',
    'apps/web/src/x.test.tsx',
    'scripts/x.grit',
    'biome.json',
  ])
  const result = radius(repo, 'U1')
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.match(result.stdout, /^radius: U1 HEAD inside$/m)
})

test('raio: arquivo fora da tabela, out-of-radius e saída 1', () => {
  const repo = committed(['apps/server/src/c.ts', 'apps/server/src/d.ts', 'outside/contract.ts'])
  const result = radius(repo, 'U1')
  assert.equal(result.status, 1)
  assert.deepEqual(
    result.stdout.split('\n').filter((line) => line.startsWith('out-of-radius')),
    ['out-of-radius U1 apps/server/src/d.ts', 'out-of-radius U1 outside/contract.ts'],
  )
})

test('raio: o mesmo arquivo dentro do raio de outra unidade', () => {
  const repo = committed(['apps/server/src/d.ts'])
  assert.equal(radius(repo, 'U2', 'HEAD').status, 0)
})

test('raio: commit desconhecido, saída 1', () => {
  const repo = committed(['apps/server/src/c.ts'])
  const result = radius(repo, 'U1', 'nao-existe')
  assert.equal(result.status, 1)
  assert.match(result.stderr, /^unknown-commit: nao-existe$/m)
})

test('raio: nome solto depois de um caminho avisa ambiguous-row', () => {
  const repo = committed(['scripts/biome.json'])
  const result = radius(repo, 'U1')
  assert.equal(result.status, 0)
  assert.match(result.stdout, /^ambiguous-row U1 biome\.json: the root or scripts\/$/m)
})
