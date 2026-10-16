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
  ['second-card', { 'docs/steps/e01-a.md': 'a\n', 'docs/steps/e02-b.md': 'b\n' }],
  [
    'founder-page-too-long',
    { 'docs/steps/e01-a.md': `## A página do fundador\n${words(601)}\n## As unidades\nx\n` },
  ],
]

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
