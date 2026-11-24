import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

const SCRIPT = resolve(import.meta.dirname, 'check-docs.ts')
const dirs: string[] = []
export function removeChecked() {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
}

export const CLEAN: Record<string, string> = {
  'AGENTS.md': 'Instructions.\n',
  'docs/index.md': '- [code](guides/code.md): rules.\n- [steps](steps/): the card.\n',
  'docs/guides/code.md': '- **C1.** A rule.\n',
  'docs/steps/.keep': '',
}

/** Runs check-docs.ts over a temporary tree: the clean one, changed by the files given. */
export function check(changes: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-docs-'))
  dirs.push(dir)
  for (const [path, content] of Object.entries({ ...CLEAN, ...changes })) {
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), content)
  }
  return spawnSync('node', [SCRIPT, dir], { encoding: 'utf8', timeout: 120_000 })
}

export const HEADER =
  '## A tabela de referência\n\n| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n'
export function row(piece: string, verdict: string, proof: string) {
  return `| ${piece} | U1 | \`a.ts:f\` | \`mastra@1.79.0\`, \`x.ts:1\` | uma linha | ${verdict} | ${proof} | não precisa | \`b.ts\` |\n`
}

export const STACK_TREE: Record<string, string> = {
  'package.json': JSON.stringify({
    workspaces: ['apps/*'],
    devDependencies: { yaml: '1' },
  }),
  'apps/a/package.json': JSON.stringify({
    name: '@x/a',
    dependencies: { fastify: '1', '@x/b': '1' },
  }),
  'apps/b/package.json': JSON.stringify({ name: '@x/b', devDependencies: { yaml: '1' } }),
  'docs/index.md':
    '- [code](guides/code.md): rules.\n- [steps](steps/): the card.\n- [stack](reference/stack.md): pieces.\n',
}

export function stack(...pieces: string[]): string {
  const rows = pieces.map((piece) => `| \`${piece}\` | x |`)
  return ['| Piece | Used in |', '| --- | --- |', ...rows, ''].join('\n')
}

export const OTHER = ['PostgreSQL', 'Node', 'Docker', 'cloudflared', 'CLIProxyAPI', 'uv']
