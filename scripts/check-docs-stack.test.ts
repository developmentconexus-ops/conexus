import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { check, HEADER, OTHER, removeChecked, row, STACK_TREE, stack } from './test-check-docs.ts'

after(removeChecked)

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

const PYPROJECT = [
  '[project]',
  'name = "extraction"',
  'dependencies = [',
  '  "meltano[s3]==4.4.1",  # the runner',
  '  "Singer_SDK>=0.54.9",',
  ']',
  '',
  '[project.optional-dependencies]',
  'lake = ["pyiceberg==0.12.0"]',
  '',
  '[dependency-groups]',
  'dev = ["pytest"]',
  '',
].join('\n')
const PYTHON_ROWS = ['meltano', 'singer-sdk', 'pyiceberg', 'pytest']

test('lê as dependências de Python de apps/extraction: cada uma pede uma linha, pelo nome normalizado', () => {
  const tree = { ...STACK_TREE, 'apps/extraction/pyproject.toml': PYPROJECT }
  const missing = check({ ...tree, 'docs/reference/stack.md': stack('fastify', 'yaml', ...OTHER) })
  assert.equal(missing.status, 1)
  assert.deepEqual(
    [...missing.stderr.matchAll(/^stack-row-missing: docs\/reference\/stack\.md: (.+)$/gm)]
      .map((match) => match[1])
      .sort(),
    [...PYTHON_ROWS].sort(),
  )
  const full = check({
    ...tree,
    'docs/reference/stack.md': stack('fastify', 'yaml', ...OTHER, ...PYTHON_ROWS),
  })
  assert.equal(full.status, 0, full.stderr)
})

test('recusa stack-row-unknown: uma linha de Python que o pyproject não declara', () => {
  const run = check({
    ...STACK_TREE,
    'apps/extraction/pyproject.toml': PYPROJECT,
    'docs/reference/stack.md': stack('fastify', 'yaml', ...OTHER, ...PYTHON_ROWS, 'boto3'),
  })
  assert.equal(run.status, 1)
  assert.match(run.stderr, /^stack-row-unknown: docs\/reference\/stack\.md: boto3$/m)
})

const TOML_FORMS: Record<string, string> = {
  'uma linha indentada': '[project]\n  dependencies = ["requests-toolbelt"]\n',
  'uma chave entre aspas': '[dependency-groups]\n"dev" = ["requests-toolbelt"]\n',
  'uma chave com ponto': '[project]\noptional-dependencies.s3 = ["requests-toolbelt"]\n',
  'uma tabela em linha': '[project]\noptional-dependencies = { s3 = ["requests-toolbelt"] }\n',
  'uma chave com ponto na raiz': 'project.dependencies = ["requests-toolbelt"]\n',
  'um cabeçalho entre aspas': '[ "project" ]\ndependencies = ["requests-toolbelt"]\n',
  'o backend de build': '[build-system]\nrequires = ["requests-toolbelt"]\n',
  'um grupo que inclui outro': [
    '[dependency-groups]',
    'all = [{include-group = "dev"}, "requests-toolbelt"]',
    'dev = ["pytest"]',
    '',
  ].join('\n'),
}

for (const [form, toml] of Object.entries(TOML_FORMS)) {
  test(`lê o TOML como ele diz: ${form} pede a linha`, () => {
    const run = check({
      ...STACK_TREE,
      'apps/extraction/pyproject.toml': toml,
      'docs/reference/stack.md': stack('fastify', 'yaml', ...OTHER),
    })
    assert.equal(run.status, 1)
    assert.match(run.stderr, /^stack-row-missing: docs\/reference\/stack\.md: requests-toolbelt$/m)
    assert.doesNotMatch(run.stderr, /stack-python-unread/)
  })
}

const UNREAD: [string, string, string][] = [
  ['um valor que não é lista', '[project]\ndependencies = "x"\n', 'project.dependencies'],
  ['uma lista com um número', '[project]\ndependencies = [1]\n', 'project.dependencies.0'],
  ['o dev-dependencies do uv', '[tool.uv]\ndev-dependencies = ["x"]\n', 'tool.uv.dev-dependencies'],
  ['um texto que não é TOML', '[project]\ndependencies = some_function()\n', 'not valid TOML'],
  ['uma exigência sem nome', '[project]\ndependencies = ["==1"]\n', 'requirement "==1"'],
]

for (const [form, toml, where] of UNREAD) {
  test(`recusa stack-python-unread: ${form}`, () => {
    const run = check({
      ...STACK_TREE,
      'apps/extraction/pyproject.toml': toml,
      'docs/reference/stack.md': stack('fastify', 'yaml', ...OTHER),
    })
    assert.equal(run.status, 1)
    assert.ok(
      run.stderr.includes(`stack-python-unread: apps/extraction/pyproject.toml: ${where}\n`),
      run.stderr,
    )
  })
}

const THE_CARD = `# Etapa\n\n${HEADER}${row('Git', 'nativo', '—')}`
const AHEAD_ROW = '| `meltano` | `apps/extraction` ahead of the-card |\n'
const AHEAD_STACK = `${stack('fastify', 'yaml', ...OTHER)}${AHEAD_ROW}`

test('uma linha adiantada de um cartão vale enquanto o cartão existe e se recusa depois', () => {
  const held = check({
    ...STACK_TREE,
    'docs/steps/the-card.md': THE_CARD,
    'docs/reference/stack.md': AHEAD_STACK,
  })
  assert.equal(held.status, 0, held.stderr)
  const gone = check({ ...STACK_TREE, 'docs/reference/stack.md': AHEAD_STACK })
  assert.equal(gone.status, 1)
  assert.match(
    gone.stderr,
    /^stack-row-ahead-stale: docs\/reference\/stack\.md: meltano: docs\/steps\/the-card\.md is gone$/m,
  )
})

test('recusa stack-row-unknown: uma linha sem o adiantado de um cartão', () => {
  const run = check({
    ...STACK_TREE,
    'docs/steps/the-card.md': THE_CARD,
    'docs/reference/stack.md': `${stack('fastify', 'yaml', ...OTHER)}| \`meltano\` | \`apps/extraction\` |\n`,
  })
  assert.equal(run.status, 1)
  assert.match(run.stderr, /^stack-row-unknown: docs\/reference\/stack\.md: meltano$/m)
})

test('recusa stack-row-ahead-stale: a marca de um cartão que saiu, mesmo com a peça já declarada', () => {
  const run = check({
    ...STACK_TREE,
    'apps/extraction/pyproject.toml': '[project]\ndependencies = ["meltano"]\n',
    'docs/reference/stack.md': AHEAD_STACK,
  })
  assert.equal(run.status, 1)
  assert.match(
    run.stderr,
    /^stack-row-ahead-stale: docs\/reference\/stack\.md: meltano: docs\/steps\/the-card\.md is gone$/m,
  )
  assert.doesNotMatch(run.stderr, /stack-row-unknown/)
})
