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

const SERVER = 'apps/server/src/hub/copies/public.ts'
const CLEAN: Record<string, string> = {
  'AGENTS.md': 'Instructions.\n',
  'docs/index.md':
    '- [code](guides/code.md): rules.\n- [steps](steps/): the card.\n- [decisions](decisions/): records.\n',
  'docs/guides/code.md': '- **C1.** A rule.\n',
  'docs/steps/.keep': '',
  'docs/decisions/.keep': '',
  [SERVER]: '',
}

function check(changes: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-docs-paths-'))
  dirs.push(dir)
  for (const [path, content] of Object.entries({ ...CLEAN, ...changes })) {
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), content)
  }
  return spawnSync('node', [SCRIPT, dir], { encoding: 'utf8', timeout: 120_000 })
}

function refused(changes: Record<string, string>, path: string, file: string) {
  const run = check(changes)
  assert.equal(run.status, 1, run.stdout)
  assert.ok(run.stderr.split('\n').includes(`path-missing: ${file}: ${path}`), run.stderr)
}

test('recusa path-missing: um caminho entre crases que nenhum arquivo tem', () => {
  refused(
    { 'AGENTS.md': 'See `conversation/turn-log.ts`.\n' },
    'conversation/turn-log.ts',
    'AGENTS.md',
  )
})

test('recusa path-missing: um caminho relativo ao documento que não existe', () => {
  refused(
    { 'docs/guides/code.md': '- **C1.** A rule, see `../gone/x.ts`.\n' },
    '../gone/x.ts',
    'docs/guides/code.md',
  )
})

test('recusa path-missing: o caminho com linhas, depois de tiradas as linhas', () => {
  refused({ 'AGENTS.md': 'See `gone/x.ts:12-20,30`.\n' }, 'gone/x.ts', 'AGENTS.md')
})

test('recusa path-missing: um sufixo que não começa numa pasta', () => {
  refused({ 'AGENTS.md': 'See `ies/public.ts`.\n' }, 'ies/public.ts', 'AGENTS.md')
})

test('aceita o caminho que termina num arquivo, com ou sem pasta de cima e com linhas', () => {
  const run = check({
    'AGENTS.md':
      'See `copies/public.ts:12-20,30`, `hub/copies/public.ts` and `docs/guides/code.md`.\n',
  })
  assert.equal(run.status, 0, run.stderr)
})

test('aceita o caminho relativo ao documento que chega a um arquivo', () => {
  const run = check({
    'docs/guides/code.md': '- **C1.** A rule, see `../../apps/server/src/hub/copies/public.ts`.\n',
  })
  assert.equal(run.status, 0, run.stderr)
})

test('aceita o que não é do repositório: biblioteca, referência e app gerado', () => {
  const run = check({
    'AGENTS.md':
      'See `better-auth/dist/api/routes/session.mjs`, `@tanstack/query-core/src/mutation.ts`, `fastify/lib/request.js`, `mastracode/sdk/src/index.ts`, `apps/hub/src/builder/turn.ts` and `shared/operations.ts`.\n',
  })
  assert.equal(run.status, 0, run.stderr)
})

test('aceita o que um registro datado e um cartão dizem: eles nomeiam o que foi ou será', () => {
  const header =
    '| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n'
  const planned =
    '| Leitor | U1 | `a.ts:f` | `mastra@1.79.0`, `x.ts:1` | uma linha | nativo | — | não precisa | `hub/ontology/reader.ts` |\n'
  const run = check({
    'docs/decisions/0001-x.md': 'It cites `conversation/turn-log.ts`.\n',
    'docs/steps/e01-a.md': `## A tabela de referência\n\n${header}${planned}`,
  })
  assert.equal(run.status, 0, run.stderr)
})

test('não lê caminho dentro de um bloco de código, de um glob nem de um marcador', () => {
  const run = check({
    'AGENTS.md':
      '```text\n`src/gone/in-a-fence.ts`\n```\n\nSee `src/<x>/gone.ts`, `src/*/gone.ts` and `src/{a,b}.ts`.\n',
  })
  assert.equal(run.status, 0, run.stderr)
})
