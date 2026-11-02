import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { after, test } from 'node:test'

// One card per track (delivery L5): the frontier's, the pattern's and the design's.
const SCRIPT = resolve(import.meta.dirname, 'check-docs.ts')
const dirs: string[] = []
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

const TABLE =
  '## A tabela de referência\n\n| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n| Git | U1 | `a.ts:f` | `mastra@1.79.0`, `x.ts:1` | uma linha | nativo | — | não precisa | `b.ts` |\n'

function check(cards: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-docs-tracks-'))
  dirs.push(dir)
  const files: Record<string, string> = {
    'AGENTS.md': 'Instructions.\n',
    'docs/index.md': '- [code](guides/code.md): rules.\n- [steps](steps/): the card.\n',
    'docs/guides/code.md': '- **C1.** A rule.\n',
  }
  for (const [name, text] of Object.entries(cards))
    files[`docs/steps/${name}`] = `${text}\n${TABLE}`
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), content)
  }
  return spawnSync('node', [SCRIPT, dir], { encoding: 'utf8', timeout: 120_000 })
}

test('aceita um cartão por trilho: fronteira, padrão e desenho', () => {
  const run = check({
    'e01-a.md': 'a\n',
    'pattern-e02-b.md': 'b\n',
    'e03-c.md': '# c\n\nTrilho: desenho\n',
  })
  assert.equal(run.status, 0, run.stderr)
})

test('recusa dois cartões do trilho de desenho, nomeando o trilho', () => {
  const run = check({
    'e03-a.md': '# a\n\nTrilho: desenho\n',
    'e04-b.md': '# b\n\nTrilho: desenho\n',
  })
  assert.equal(run.status, 1)
  assert.match(run.stderr, /second-card: docs\/steps: design: /)
})

test('o marcador de trilho só vale nas primeiras linhas', () => {
  const run = check({
    'e01-a.md': 'a\n',
    'e03-c.md': `${'x\n'.repeat(6)}Trilho: desenho\n`,
  })
  assert.equal(run.status, 1)
  assert.match(run.stderr, /second-card: docs\/steps: frontier: /)
})
