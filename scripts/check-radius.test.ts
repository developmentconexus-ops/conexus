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

function committed(files: string[], card = CARD): string {
  const repo = mkdtempSync(join(tmpdir(), 'conexus-radius-'))
  repos.push(repo)
  git(repo, 'init', '--quiet')
  mkdirSync(join(repo, 'docs/steps'), { recursive: true })
  writeFileSync(join(repo, 'docs/steps/e09-teste.md'), card)
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

function cardOf(...cells: string[]): string {
  return [
    '# Etapa 9: Teste',
    '',
    '## U1 Primeira',
    '',
    '### O raio da mudança',
    '',
    '| Arquivo | Cria, muda ou apaga | Quem importa ou chama |',
    '| --- | --- | --- |',
    ...cells.map((cell) => `| ${cell} | Muda | CI |`),
    '',
  ].join('\n')
}

function outside(card: string, files: string[]): string[] {
  const result = radius(committed(files, card), 'U1')
  return result.stdout
    .split('\n')
    .filter((line) => line.startsWith('out-of-radius'))
    .map((line) => line.replace('out-of-radius U1 ', ''))
}

test('raio: o curinga e o marcador casam nomes com ponto, como o regex antigo', () => {
  const card = cardOf('`.github/workflows/*.yml`, `docs/*`, `<tipo>.md`, `src/a*`')
  assert.deepEqual(
    outside(card, [
      '.github/workflows/ci.yml',
      '.github/workflows/.hidden.yml',
      'docs/.gitkeep',
      'docs/x',
      '.dot.md',
      'x.md',
      'src/a.hidden',
    ]),
    [],
  )
})

test('raio: o curinga fica num segmento e ** vale o mesmo que *', () => {
  const card = cardOf('`apps/*/x.ts`, `lib/**/y.ts`, `<n>.md`')
  assert.deepEqual(
    outside(card, ['apps/a/x.ts', 'apps/a/b/x.ts', 'lib/a/y.ts', 'lib/a/b/y.ts', 'a/b.md', '.md']),
    ['.md', 'a/b.md', 'apps/a/b/x.ts', 'lib/a/b/y.ts'],
  )
})

test('raio: metacaracteres do glob do Node são letras na tabela', () => {
  const card = cardOf(
    '`routes/[id]/(grupo)/a?.tsx`, `routes/+page.tsx`, `routes/!(x).ts`, `routes/b[xy].ts`',
  )
  assert.deepEqual(
    outside(card, [
      'routes/[id]/(grupo)/a?.tsx',
      'routes/+page.tsx',
      'routes/!(x).ts',
      'routes/b[xy].ts',
      'routes/i/(grupo)/a?.tsx',
      'routes/[id]/(grupo)/aZ.tsx',
      'routes/page.tsx',
      'routes/y.ts',
      'routes/bx.ts',
    ]),
    [
      'routes/bx.ts',
      'routes/i/(grupo)/a?.tsx',
      'routes/[id]/(grupo)/aZ.tsx',
      'routes/page.tsx',
      'routes/y.ts',
    ].sort(),
  )
})

test('raio: pasta com chaves e dois níveis só cobre o que está abaixo dela', () => {
  const card = cardOf('`apps/{web,server}/src/`, `docs/`')
  assert.deepEqual(
    outside(card, [
      'apps/web/src/a/b.ts',
      'apps/server/src/c.ts',
      'docs/d.md',
      'apps/web/e.ts',
      'docs.md',
    ]),
    ['apps/web/e.ts', 'docs.md'],
  )
})

for (const [name, cell, refusal] of [
  ['chave aberta', '`a/{b,c.ts`', 'unbalanced-braces'],
  ['chave com uma só alternativa', '`a/{b}.ts`', 'lonely-braces'],
  ['barra invertida', '`a\\b.ts`', 'backslash'],
] as const) {
  test(`raio: ${name} é recusada`, () => {
    const result = radius(committed(['a/b.ts'], cardOf(cell)), 'U1')
    assert.equal(result.status, 1)
    assert.match(result.stderr, new RegExp(`^${refusal}: `, 'm'))
  })
}

test('raio: uma pasta cobre nomes com ponto, em qualquer nível', () => {
  const card = cardOf('`docs/`')
  assert.deepEqual(
    outside(card, ['docs/.gitkeep', 'docs/a/.x', 'docs/.d/f', 'docs/a/.d/f/.g', 'docs/b']),
    [],
  )
})

test('raio: nome com acento é lido sem aspas', () => {
  assert.deepEqual(outside(cardOf('`src/ação.ts`'), ['src/ação.ts', 'src/outro-ç.ts']), [
    'src/outro-ç.ts',
  ])
})

test('raio: o commit de merge lista os arquivos contra o primeiro pai', () => {
  const repo = committed(['apps/server/src/c.ts'])
  git(repo, 'checkout', '--quiet', '-b', 'side', 'HEAD~1')
  mkdirSync(join(repo, 'outside'), { recursive: true })
  writeFileSync(join(repo, 'outside/side.ts'), 'x\n')
  git(repo, 'add', '.')
  git(repo, 'commit', '--quiet', '-m', 'side')
  git(repo, 'checkout', '--quiet', '-')
  const merged = git(repo, 'merge', '--quiet', '--no-ff', '-m', 'merge', 'side')
  assert.equal(merged.status, 0, merged.stderr)
  const result = radius(repo, 'U1')
  assert.equal(result.status, 1, result.stdout + result.stderr)
  assert.match(result.stdout, /^out-of-radius U1 outside\/side\.ts$/m)
})
