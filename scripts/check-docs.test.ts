import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { check, HEADER, removeChecked, row } from './test-check-docs.ts'

after(removeChecked)

function words(count: number): string {
  return 'word '.repeat(count)
}

test('aceita uma árvore limpa', () => {
  const run = check({})
  assert.equal(run.status, 0, run.stderr)
})

const REFUSALS: [string, Record<string, string>][] = [
  ['document-too-long', { 'docs/decisions/0001-x.md': words(351) }],
  ['document-too-long', { 'VISION.md': words(1601) }],
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
]

test('aceita o card com a tabela de referência', () => {
  const table = `${HEADER}${row('Git', 'nativo', '—')}${row('Fila', 'embrulhado, soma o prazo', '—')}${row('Contas', 'remendo', 'medição, boundaries: pg 8.16.3')}\n## As unidades\n`
  const run = check({ 'docs/steps/e01-a.md': `# Etapa\n\n${table}` })
  assert.equal(run.status, 0, run.stderr)
})

test('recusa o card sem a tabela de referência', () => {
  const run = check({ 'docs/steps/e01-a.md': '# Etapa\n\n## As unidades\n' })
  assert.equal(run.status, 1)
  assert.match(run.stderr, /^card-without-references: /m)
})

test('recusa a tabela com o cabeçalho antigo de mecanismos', () => {
  const old =
    '| Mecanismo | Nativo, nosso ou trazido | Arquivo | Como Mastra, vibesdk e Conexus OS fazem, `file:line` |\n| --- | --- | --- | --- |\n| Git | trazido | `git/` | nenhuma faz |\n'
  const run = check({ 'docs/steps/e01-a.md': `## A tabela de referência\n\n${old}` })
  assert.equal(run.status, 1)
  assert.match(run.stderr, /^card-without-references: /m)
})

test('recusa a linha remendo sem a versão da biblioteca na prova', () => {
  const run = check({ 'docs/steps/e01-a.md': `${HEADER}${row('Contas', 'remendo', 'medição')}` })
  assert.equal(run.status, 1)
  assert.match(run.stderr, /^card-remendo-version: .*Contas/m)
})

test('a linha remendo que nenhuma biblioteca faz cita o registro de decisão, e não uma versão', () => {
  function git(proof: string) {
    return `| Git | U1 | \`a.ts:f\` | nenhuma faz | uma linha | remendo | ${proof} | não precisa | \`b.ts\` |\n`
  }
  const cited = check({ 'docs/steps/e01-a.md': `${HEADER}${git('docs/decisions/0001-git.md')}` })
  assert.equal(cited.status, 0, cited.stderr)
  const bare = check({ 'docs/steps/e01-a.md': `${HEADER}${git('medição')}` })
  assert.equal(bare.status, 1)
  assert.match(bare.stderr, /^card-remendo-decision: .*Git/m)
})

test('recusa a linha sem veredito', () => {
  const run = check({ 'docs/steps/e01-a.md': `${HEADER}${row('Git', 'talvez', '—')}` })
  assert.equal(run.status, 1)
  assert.match(run.stderr, /^card-row-verdict: .*Git/m)
})

test('recusa card-rest-row', () => {
  const run = check({ 'docs/steps/e01-a.md': `${HEADER}${row('O resto', 'nativo', '—')}` })
  assert.equal(run.status, 1)
  assert.match(run.stderr, /^card-rest-row: /m)
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
