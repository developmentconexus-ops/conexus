import assert from 'node:assert/strict'
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { STARTER_DIR } from '../starter.ts'
import { browseInChromium, navegador } from './browser.ts'
import { spawnRunner } from './command.ts'
import { dependencies } from './dependencies.ts'
import type { CheckReport } from './report.ts'
import { runCheck } from './run.ts'
import type { CheckContext, Runner } from './step.ts'

// The repository's node_modules holds every package of the starter at its exact version, so a
// copy of the starter that links to it is an app after `npm ci`. The install itself reaches the
// registry, which no test may (testing T14): it is the one command faked here, and recorded.
const MODULES = join(resolve(import.meta.dirname, '../../../..'), 'node_modules')

type Files = Readonly<Record<string, string | null>>

function appWith(t: TestContext, files: Files): string {
  const root = mkdtempSync(join(tmpdir(), 'conexus-check-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  cpSync(STARTER_DIR, root, { recursive: true, filter: (path) => !path.includes('node_modules') })
  mkdirSync(join(root, 'node_modules'))
  for (const name of readdirSync(MODULES)) {
    if (name !== '.conexus') symlinkSync(join(MODULES, name), join(root, 'node_modules', name))
  }
  for (const [path, text] of Object.entries(files)) {
    rmSync(join(root, path), { force: true })
    if (text === null) continue
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), text)
  }
  return root
}

function contextOf(root: string, installs: string[][] = []): CheckContext {
  const run: Runner = async (command, args, options) => {
    if (command !== 'npm') return spawnRunner(command, args, options)
    installs.push([command, ...args])
    return { code: 0, output: '', timedOut: false }
  }
  return {
    root,
    tools: MODULES,
    platform: undefined,
    grants: [],
    run,
    browse: browseInChromium,
  }
}

async function reportOf(ctx: CheckContext): Promise<CheckReport> {
  const result = await runCheck(ctx)
  assert.ok(result.ok, result.ok ? '' : result.error)
  return result.value
}

function states(report: CheckReport) {
  return Object.fromEntries(report.steps.map(({ name, state }) => [name, state]))
}

function edit(path: string, change: (text: string) => string): Files {
  return { [path]: change(readFileSync(join(STARTER_DIR, path), 'utf8')) }
}

const OPERATIONS = `import { defineOperations } from '@conexus/app'
import { z } from 'zod'

export const operations = defineOperations({
  criar: { input: z.object({ cliente: z.string() }), output: z.object({ id: z.int() }) },
})
`

const HANDLERS = `import { defineHandlers } from '@conexus/app'
import { operations } from '../shared/operations'

// Uma encomenda nova recebe o próximo número.
let proximo = 1

function numero() {
  proximo += 1
  return proximo
}

export const handlers = defineHandlers(operations, {
  criar: () => ({ codigo: numero() }),
})
`

test('o handler que devolve { codigo } falha em tipos na linha 13 e pula os passos seguintes', async (t) => {
  const root = appWith(t, { 'shared/operations.ts': OPERATIONS, 'server/handlers.ts': HANDLERS })
  const report = await reportOf(contextOf(root))
  assert.equal(report.ok, false)
  assert.deepEqual(states(report), {
    dependências: 'passed',
    manifesto: 'passed',
    tipos: 'failed',
    telas: 'skipped',
    worker: 'skipped',
    navegador: 'skipped',
  })
  const [first] = report.steps[2]?.problems ?? []
  assert.deepEqual([first?.file, first?.line, first?.code], ['server/handlers.ts', 13, 'TS2322'])
})

async function refusalsOf(t: TestContext, files: Files, grants: CheckContext['grants'] = []) {
  const installs: string[][] = []
  const outcome = await dependencies({ ...contextOf(appWith(t, files), installs), grants })
  const problems = outcome.state === 'failed' ? outcome.problems : []
  return {
    state: outcome.state,
    installs,
    problems: problems.map(({ file, line, code }) => ({ file, line, code })),
  }
}

const STARTER_PACKAGE = readFileSync(join(STARTER_DIR, 'package.json'), 'utf8')

/** The line of the starter's `package.json` that names `name`, counted from 1. */
function lineOf(name: string): number {
  return STARTER_PACKAGE.split('\n').findIndex((line) => line.includes(`"${name}"`)) + 1
}

test('dependências: fora da lista, versão sem ser exata ou import sem declarar não é aprovado', async (t) => {
  const outside = await refusalsOf(
    t,
    edit('package.json', (text) => text.replace('"clsx"', '"left-pad": "1.3.0",\n    "clsx"')),
  )
  assert.deepEqual(outside, {
    state: 'failed',
    installs: [],
    problems: [{ file: 'package.json', line: lineOf('clsx'), code: 'DEPENDENCY_NOT_APPROVED' }],
  })
  const range = await refusalsOf(
    t,
    edit('package.json', (text) => text.replace('"recharts": "3.10.1"', '"recharts": "^3.10.1"')),
  )
  assert.deepEqual(range.problems, [
    { file: 'package.json', line: lineOf('recharts'), code: 'DEPENDENCY_NOT_APPROVED' },
  ])
  const undeclared = await refusalsOf(
    t,
    edit('src/routes/home.tsx', (text) => `import dayjs from 'dayjs'\n${text}`),
  )
  assert.deepEqual(undeclared.problems, [
    { file: 'src/routes/home.tsx', line: 1, code: 'DEPENDENCY_NOT_APPROVED' },
  ])
})

test('dependências: o pacote concedido ao Projeto passa e a instalação é npm ci --ignore-scripts', async (t) => {
  const granted = [{ name: 'left-pad', version: '1.3.0' }]
  const files = edit('package.json', (text) =>
    text.replace('"clsx"', '"left-pad": "1.3.0",\n    "clsx"'),
  )
  const { state, installs } = await refusalsOf(t, files, granted)
  assert.equal(state, 'passed')
  assert.deepEqual(installs[0]?.slice(0, 3), ['npm', 'ci', '--ignore-scripts'])
})

const MAIN = 'src/main.tsx'

test('o modelo muda main.tsx, styles.css e um componente: monta, e um erro de console só informa', async (t) => {
  const root = appWith(t, {
    ...edit(MAIN, (text) =>
      text.replace("'./styles.css'", "'./styles.css'\n\nconsole.error('aviso do app')"),
    ),
    ...edit('src/styles.css', (text) => text.replace('--brand: #b07a0c;', '--brand: #1a5fb4;')),
    ...edit('src/routes/home.tsx', (text) =>
      text.replace('Este app ainda está vazio', 'Encomendas'),
    ),
  })
  const report = await reportOf(contextOf(root))
  assert.equal(report.ok, true)
  assert.equal(states(report).navegador, 'informed')
  assert.match(report.steps[5]?.problems[0]?.message ?? '', /aviso do app/)
  const version = join(root, 'node_modules/.conexus/version')
  assert.ok(readdirSync(version).includes('manifest.json'))
})

test('sem o CSPProvider e com a tela injetando <style>, navegador falha', async (t) => {
  const root = appWith(t, {
    ...edit(MAIN, (text) =>
      text.replace('<CSPProvider disableStyleElements>', '<>').replace('</CSPProvider>', '</>'),
    ),
    ...edit('src/routes/home.tsx', (text) =>
      text.replace('<Empty>', "<Empty>\n      <style>{'.aviso { color: red }'}</style>"),
    ),
  })
  const report = await reportOf(contextOf(root))
  assert.equal(report.ok, false)
  assert.equal(states(report).navegador, 'failed')
  assert.equal(report.steps[5]?.problems[0]?.code, 'CSP_VIOLATION')
})

/** A built page by hand, for the browser step alone. */
function builtPage(t: TestContext, script: string) {
  const root = mkdtempSync(join(tmpdir(), 'conexus-page-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const dist = join(root, 'node_modules/.conexus/dist')
  mkdirSync(join(dist, 'assets'), { recursive: true })
  const page = `<!doctype html><div id="root"></div><script type="module" src="/assets/app.js"></script>${script}`
  writeFileSync(join(dist, 'index.html'), page)
  return { dist, root }
}

test('navegador: violação da política ou #root vazio falham; erro de console só informa', async (t) => {
  const inline = builtPage(t, '<script>window.x = 1</script>')
  writeFileSync(
    join(inline.dist, 'assets/app.js'),
    "document.getElementById('root').append(document.createElement('p'))",
  )
  const violated = await navegador(contextOf(inline.root))
  assert.equal(violated.state, 'failed')
  assert.equal(violated.state === 'failed' && violated.problems[0]?.code, 'CSP_VIOLATION')
  const empty = builtPage(t, '')
  writeFileSync(join(empty.dist, 'assets/app.js'), "console.log('nada')")
  const blank = await navegador(contextOf(empty.root))
  assert.deepEqual(blank.state === 'failed' && blank.problems.map(({ code }) => code), [
    'ROOT_EMPTY',
  ])
  const noisy = builtPage(t, '')
  const draws =
    "document.getElementById('root').append(document.createElement('p')); console.error('falhou um detalhe')"
  writeFileSync(join(noisy.dist, 'assets/app.js'), draws)
  const informed = await navegador(contextOf(noisy.root))
  assert.equal(informed.state, 'informed')
  assert.equal(informed.state === 'informed' && informed.problems[0]?.message, 'falhou um detalhe')
})

test('sem Chromium ou com o passo acima de 60 s, a conferência não dá veredito: a máquina falhou', async (t) => {
  const root = appWith(t, {})
  const late: Runner = async () => ({ code: null, output: '', timedOut: true })
  const overran = await runCheck({ ...contextOf(root), run: late })
  assert.deepEqual(overran, { ok: false, error: 'dependências: dependências passed its time' })
  const page = builtPage(t, '')
  const unavailable = await navegador({
    ...contextOf(page.root),
    browse: async () => ({ unavailable: 'Chromium did not start' }),
  })
  assert.deepEqual(unavailable, { state: 'platform', reason: 'Chromium did not start' })
})
