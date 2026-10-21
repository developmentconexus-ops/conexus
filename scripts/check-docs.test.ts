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
  return spawnSync('node', [SCRIPT, dir], { encoding: 'utf8', timeout: 120_000 })
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
  ['broken-link', { 'AGENTS.md': 'See [gone][target].\n\n[target]: docs/gone.md\n' }],
  ['broken-fragment', { 'AGENTS.md': '# Title\n\nSee [up](#nowhere).\n' }],
  ['broken-fragment', { 'AGENTS.md': 'See [code](docs/guides/code.md#nowhere).\n' }],
  ['broken-fragment', { 'AGENTS.md': 'See [code][c].\n\n[c]: docs/guides/code.md#nowhere\n' }],
  [
    'broken-fragment',
    {
      'docs/guides/code.md': '- **C1.** A rule.\n\nHeading\n=======\n',
      'AGENTS.md': '[x](docs/guides/code.md#heading-1)\n',
    },
  ],
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
  [
    'rule-sentence-twice',
    {
      'docs/guides/code.md': '- **C1.** A rule says the same thing twice. Founder, 2026-10-16.\n',
      'docs/guides/web.md':
        '- **W1.** Another rule.\n  A rule says the same thing\n  twice. [review]\n',
      'docs/index.md':
        '- [code](guides/code.md): rules.\n- [web](guides/web.md): rules.\n- [steps](steps/): the card.\n',
    },
  ],
  ['second-card', { 'docs/steps/e01-a.md': 'a\n', 'docs/steps/e02-b.md': 'b\n' }],
  [
    'founder-page-too-long',
    { 'docs/steps/e01-a.md': `## A página do fundador\n${words(601)}\n## As unidades\nx\n` },
  ],
]

const MECHANISMS =
  '| Mecanismo | Nativo, nosso ou trazido | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base | Como Mastra, vibesdk e Conexus OS fazem, `file:line` |\n| --- | --- | --- | --- | --- | --- |\n| Git | trazido | `builder/git/` | — | nenhuma | nenhuma faz |\n'

/** The table of step 13's card, deleted at its closing (a583393^:docs/steps/e13-o-builder-escreve.md). */
const STEP_13_TABLE =
  '| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |\n| --- | --- | --- | --- | --- |\n| Git (613 linhas) | trazida | `builder/git/` | prazo e sinal | pacote e avanço |\n| O resto | novo | `builder/` | — | candidata antes do `main` |\n'

test('aceita o card com a tabela de mecanismos e a coluna de referência', () => {
  const run = check({ 'docs/steps/e01-a.md': MECHANISMS })
  assert.equal(run.status, 0, run.stderr)
})

test('recusa a tabela do card da etapa 13: sem a coluna de referência e com "O resto"', () => {
  const run = check({ 'docs/steps/e13-o-builder-escreve.md': STEP_13_TABLE })
  assert.equal(run.status, 1)
  assert.match(run.stderr, /^card-without-references: /m)
  assert.match(run.stderr, /^card-rest-row: .*\| O resto \|/m)
})

test('recusa card-rest-row também com a coluna de referência', () => {
  const run = check({ 'docs/steps/e01-a.md': `${MECHANISMS}| o resto | nosso | x | — | — | — |\n` })
  assert.equal(run.status, 1)
  assert.match(run.stderr, /^card-rest-row: /m)
  assert.doesNotMatch(run.stderr, /card-without-references/)
})

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

test('um fragmento que nomeia um título passa, também com repetição, acento e link no título', () => {
  const run = check({
    'docs/guides/code.md':
      '- **C1.** A rule.\n\n## Os `contratos` do fundador\n\n## Ação\n\n## Ação\n\n## Ver [o guia](code.md)\n',
    'AGENTS.md': [
      '# Title',
      '',
      '[a](#title) [b](docs/guides/code.md#os-contratos-do-fundador) [c](docs/guides/code.md#ação)',
      '[d](docs/guides/code.md#ação-1) [e](docs/guides/code.md#ver-o-guia) [f](docs/index.md)',
      '',
      '[ref]: docs/guides/code.md#ação',
      '',
    ].join('\n'),
  })
  assert.equal(run.status, 0, run.stderr)
})

const HEADING_FORMS: [string, string, string][] = [
  ['ATX', '## Heading', 'heading'],
  ['Setext com =', 'Heading\n=======', 'heading'],
  ['Setext com -', 'Heading\n-------', 'heading'],
  ['Setext com ênfase e código', 'A `x_y` _Dois_\n---', 'a-x_y-dois'],
  ['ênfase com _', '## _Heading_', 'heading'],
  ['ênfase forte com __', '## __Heading__', 'heading'],
  ['sublinhado no meio da palavra', '## snake_case', 'snake_case'],
  ['sublinhado em código', '## `a_b_`', 'a_b_'],
]

for (const [form, heading, id] of HEADING_FORMS) {
  test(`um fragmento acha o título ${form}`, () => {
    const run = check({
      'docs/guides/code.md': `- **C1.** A rule.\n\n${heading}\n`,
      'AGENTS.md': `[x](docs/guides/code.md#${id})\n`,
    })
    assert.equal(run.status, 0, run.stderr)
  })
}

test('um --- que separa ou abre o arquivo não é título Setext', () => {
  const run = check({
    'docs/guides/code.md':
      '---\nname: x\n---\n- **C1.** A rule.\n\nText\n\n---\n\n```\ncode\n```\n---\n',
    'AGENTS.md':
      '[a](docs/guides/code.md#name-x) [b](docs/guides/code.md#text) [c](docs/guides/code.md#code)\n',
  })
  assert.equal(run.status, 1)
  assert.equal(run.stderr.match(/^broken-fragment: /gm)?.length, 3)
})

test('um fragmento em arquivo que não é Markdown ou em pasta não é conferido', () => {
  const run = check({
    'AGENTS.md': 'See [steps](docs/steps/#x) and [s](scripts/x.ts#anchor).\n',
    'scripts/x.ts': 'x\n',
  })
  assert.equal(run.status, 0, run.stderr)
})

test('um fragmento com % mal formado é broken-fragment, sem travar, e o título com % se acha sem ele', () => {
  const heading = { 'docs/guides/code.md': '- **C1.** A rule.\n\n## 50% off\n' }
  const bad = check({ ...heading, 'AGENTS.md': '[x](docs/guides/code.md#50%)\n' })
  assert.equal(bad.status, 1)
  assert.match(bad.stderr, /^broken-fragment: AGENTS\.md: docs\/guides\/code\.md#50%$/m)
  assert.doesNotMatch(bad.stderr, /URIError/)
  const good = check({ ...heading, 'AGENTS.md': '[x](docs/guides/code.md#50-off)\n' })
  assert.equal(good.status, 0, good.stderr)
})

for (const title of ['"t"', "'t'", '(t)']) {
  test(`um link com título ${title} é conferido`, () => {
    const broken = check({ 'AGENTS.md': `[a](gone.md ${title})\n` })
    assert.equal(broken.status, 1)
    assert.match(broken.stderr, /^broken-link: AGENTS\.md: gone\.md$/m)
    const fragment = check({ 'AGENTS.md': `[a](docs/guides/code.md#nope ${title})\n` })
    assert.match(fragment.stderr, /^broken-fragment: /m)
    const fine = check({ 'AGENTS.md': `[a](docs/index.md ${title})\n` })
    assert.equal(fine.status, 0, fine.stderr)
  })
}

const STACK_TREE: Record<string, string> = {
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

function stack(...pieces: string[]): string {
  const rows = pieces.map((piece) => `| \`${piece}\` | x |`)
  return ['| Piece | Used in |', '| --- | --- |', ...rows, ''].join('\n')
}

const OTHER = ['PostgreSQL', 'Node', 'Docker', 'cloudflared', 'CLIProxyAPI']

test('o mapa com uma linha por dependência e por peça fora do npm passa; um pacote do próprio repositório não pede linha', () => {
  const run = check({
    ...STACK_TREE,
    'docs/reference/stack.md': stack('fastify', 'yaml', ...OTHER),
  })
  assert.equal(run.status, 0, run.stderr)
})

test('recusa stack-row-missing: uma dependência de um workspace sem linha', () => {
  const run = check({ ...STACK_TREE, 'docs/reference/stack.md': stack('yaml', ...OTHER) })
  assert.equal(run.status, 1)
  assert.match(run.stderr, /^stack-row-missing: docs\/reference\/stack\.md: fastify$/m)
  assert.equal(run.stderr.match(/^stack-row-missing: /gm)?.length, 1)
})

test('recusa stack-row-missing: uma peça fora do npm sem linha', () => {
  const run = check({
    ...STACK_TREE,
    'docs/reference/stack.md': stack('fastify', 'yaml', ...OTHER.slice(1)),
  })
  assert.match(run.stderr, /^stack-row-missing: docs\/reference\/stack\.md: PostgreSQL$/m)
})

test('recusa stack-row-missing para cada dependência quando o mapa falta', () => {
  const run = check(STACK_TREE)
  assert.equal(run.status, 1)
  assert.equal(run.stderr.match(/^stack-row-missing: /gm)?.length, 2 + OTHER.length)
})

test('recusa stack-row-unknown: uma linha que nenhum package.json declara', () => {
  const run = check({
    ...STACK_TREE,
    'docs/reference/stack.md': stack('fastify', 'yaml', 'left-pad', ...OTHER),
  })
  assert.equal(run.status, 1)
  assert.match(run.stderr, /^stack-row-unknown: docs\/reference\/stack\.md: left-pad$/m)
})

test('uma tabela dentro de um bloco de código não conta como linha do mapa', () => {
  const run = check({
    ...STACK_TREE,
    'docs/reference/stack.md': `${stack('fastify', 'yaml', ...OTHER)}\n\`\`\`\n| Piece |\n| --- |\n| left-pad |\n\`\`\`\n`,
  })
  assert.equal(run.status, 0, run.stderr)
})

test('lê packages/*, uma pasta nomeada e cada seção de dependências', () => {
  const tree = {
    ...STACK_TREE,
    'package.json': JSON.stringify({ workspaces: ['apps/*', 'packages/*', 'tools/c'] }),
    'packages/d/package.json': JSON.stringify({ name: '@x/d', devDependencies: { vite: '1' } }),
    'tools/c/package.json': JSON.stringify({
      name: '@x/c',
      peerDependencies: { react: '1' },
      optionalDependencies: { esbuild: '1' },
    }),
    'packages/sem-manifesto/.keep': '',
  }
  const run = check({ ...tree, 'docs/reference/stack.md': stack('fastify', 'yaml', ...OTHER) })
  assert.equal(run.status, 1)
  const missing = [
    ...run.stderr.matchAll(/^stack-row-missing: docs\/reference\/stack\.md: (.+)$/gm),
  ]
  assert.deepEqual(missing.map((match) => match[1]).sort(), ['esbuild', 'react', 'vite'])
})

test('recusa stack-row-twice: uma peça com duas linhas', () => {
  const run = check({
    ...STACK_TREE,
    'docs/reference/stack.md': stack('fastify', 'yaml', 'yaml', ...OTHER),
  })
  assert.equal(run.status, 1)
  assert.match(run.stderr, /^stack-row-twice: docs\/reference\/stack\.md: yaml$/m)
})

test('recusa stack-workspace-unread: um padrão de workspace que o check não sabe ler', () => {
  const run = check({
    ...STACK_TREE,
    'package.json': JSON.stringify({ workspaces: ['apps/**'], devDependencies: { yaml: '1' } }),
    'docs/reference/stack.md': stack('yaml', ...OTHER),
  })
  assert.equal(run.status, 1)
  assert.match(run.stderr, /^stack-workspace-unread: package\.json: apps\/\*\*$/m)
})
