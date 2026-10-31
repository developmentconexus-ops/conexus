import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { STARTER_DIR } from '../starter.ts'
import { navegador } from './browser.ts'
import { dependencies } from './dependencies.ts'
import { manifesto } from './manifest.ts'
import type { CheckReport } from './report.ts'
import { runCheck } from './run.ts'
import type { CheckContext, Runner } from './step.ts'
import { workOf } from './step.ts'
import type { Files } from './test-app.ts'
import { ANY_HANDLERS, appWith, contextOf, onTheMachine } from './test-app.ts'

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
  const ctx = onTheMachine(t, {
    'shared/operations.ts': OPERATIONS,
    'server/handlers.ts': HANDLERS,
  })
  const report = await reportOf(ctx)
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

const NOT_JSON = `import { defineOperations } from '@conexus/app'
import { z } from 'zod'

const isoDate = z.codec(z.iso.date(), z.date(), { decode: (t) => new Date(t), encode: (d) => d.toISOString().slice(0, 10) })
const Pagamento = z.discriminatedUnion('tipo', [z.object({ tipo: z.literal('pix') }), z.object({ tipo: z.literal('cartao'), parcelas: z.int() })])

export const operations = defineOperations({
  agendar: { input: z.object({ quando: z.object({ dia: z.date() }) }), output: z.object({}) },
  somar: { input: z.object({}), output: z.object({ itens: z.array(z.object({ total: z.bigint() })) }) },
  agrupar: { input: z.object({ grupos: z.map(z.string(), z.int()) }), output: z.object({}) },
  contar: { input: z.object({}), output: z.object({ n: z.string().transform((text) => text.length) }) },
  criarEncomenda: {
    input: z.object({ email: z.email(), entrega: isoDate, situacao: z.enum(['aberta', 'entregue']).default('aberta'), pagamento: Pagamento }),
    output: z.object({ id: z.uuid(), entrega: isoDate }),
  },
})
`

test('manifesto: z.date() sem codec, bigint, Map ou transform de mão única na saída é OPERATION_NOT_JSON com a operação e o caminho', async (t) => {
  const root = appWith(t, { 'shared/operations.ts': NOT_JSON, 'server/handlers.ts': ANY_HANDLERS })
  const outcome = await manifesto(contextOf(root))
  assert.equal(outcome.state, 'failed')
  const problems = outcome.state === 'failed' ? outcome.problems : []
  assert.deepEqual(
    problems.map(({ code, file, message }) => [code, file, message.split(':')[0]]),
    [
      ['OPERATION_NOT_JSON', 'shared/operations.ts', 'agendar input quando.dia'],
      ['OPERATION_NOT_JSON', 'shared/operations.ts', 'somar output itens[].total'],
      ['OPERATION_NOT_JSON', 'shared/operations.ts', 'agrupar input grupos'],
      ['OPERATION_NOT_JSON', 'shared/operations.ts', 'contar output n'],
    ],
  )
  assert.match(problems[0]?.message ?? '', /Date cannot be represented/)
})

function roledOperations(aprovar: string): string {
  return `import { defineOperations, defineRoles } from '@conexus/app'
import { z } from 'zod'

export const roles = defineRoles({ vendedor: 'Vendedor', gerente: 'Gerente' })

export const operations = defineOperations({
  criar: { input: z.object({}), output: z.object({}), roles: ['vendedor', 'gerente'] },
  aprovar: { input: z.object({}), output: z.object({}), ${aprovar} },
})
`
}
test('o manifesto leva os papéis', async (t) => {
  const files = {
    'shared/operations.ts': roledOperations("roles: ['gerente']"),
    'server/handlers.ts': ANY_HANDLERS,
  }
  const ctx = contextOf(appWith(t, files))
  assert.equal((await manifesto(ctx)).state, 'passed')
  const manifest = JSON.parse(readFileSync(workOf(ctx, 'manifest.json'), 'utf8'))
  assert.deepEqual(manifest.roles, [
    { name: 'vendedor', label: 'Vendedor' },
    { name: 'gerente', label: 'Gerente' },
  ])
  const without = contextOf(
    appWith(t, { 'shared/operations.ts': OPERATIONS, 'server/handlers.ts': ANY_HANDLERS }),
  )
  assert.equal((await manifesto(without)).state, 'passed')
  const bare = JSON.parse(readFileSync(workOf(without, 'manifest.json'), 'utf8'))
  assert.equal('roles' in bare, false)
  assert.equal('connectors' in bare, false)
})

test('a checagem recusa a operação sem papel', async (t) => {
  for (const [aprovar, phrase] of [
    ['', /Operation without roles: aprovar/],
    ["roles: ['chefe']", /Operation aprovar names undeclared roles: chefe/],
  ] as const) {
    const files = {
      'shared/operations.ts': roledOperations(aprovar),
      'server/handlers.ts': ANY_HANDLERS,
    }
    const outcome = await manifesto(contextOf(appWith(t, files)))
    assert.equal(outcome.state, 'failed')
    const [first] = outcome.state === 'failed' ? outcome.problems : []
    assert.equal(first?.code, 'MANIFEST_INVALID')
    assert.match(first?.message ?? '', phrase)
  }
})

/** The install's one command faked as npm itself prints it: what `npm ci --json` writes on stdout. */
async function installing(t: TestContext, ran: Awaited<ReturnType<Runner>>) {
  const installs: string[][] = []
  const run: Runner = async (command, args) => {
    installs.push([command, ...args])
    return ran
  }
  const outcome = await dependencies({ ...contextOf(appWith(t, {}), installs), run })
  return { outcome, installs }
}

function npmError(code: string, summary: string) {
  return { code: 1, output: JSON.stringify({ error: { code, summary } }), timedOut: false }
}

test('dependências: a instalação é npm ci --json --ignore-scripts, e qualquer pacote que o lockfile traga passa', async (t) => {
  const { outcome, installs } = await installing(t, { code: 0, output: '', timedOut: false })
  assert.equal(outcome.state, 'passed')
  assert.deepEqual(installs[0]?.slice(0, 3), ['npm', 'ci', '--json'])
  assert.ok(installs[0]?.includes('--ignore-scripts'))
})

test('dependências: o npm que recusa é do app pelo código do erro, e o registro fora do alcance é da máquina', async (t) => {
  const refused = await installing(t, npmError('EUSAGE', 'package.json and lock are out of sync'))
  assert.deepEqual(refused.outcome, {
    state: 'failed',
    problems: [
      {
        file: null,
        line: null,
        column: null,
        code: 'INSTALL_FAILED',
        message: 'EUSAGE: package.json and lock are out of sync',
      },
    ],
  })
  for (const code of ['ENOTFOUND', 'ETIMEDOUT', 'E503']) {
    const unreachable = await installing(t, npmError(code, 'registry out'))
    assert.deepEqual(unreachable.outcome, {
      state: 'platform',
      reason: 'npm could not reach the registry',
    })
  }
  // A line of the app's own output that looks like npm's is no verdict: only the error's code is.
  const noise = await installing(t, {
    code: 1,
    output: 'npm error code ENOTFOUND (printed by the app)',
    timedOut: false,
  })
  assert.equal(noise.outcome.state, 'failed')
})

test('um import sem pacote no app falha em tipos, na linha do import', async (t) => {
  const root = appWith(
    t,
    edit('src/routes/home.tsx', (text) => `import dayjs from 'dayjs'\nvoid dayjs\n${text}`),
  )
  const report = await reportOf(contextOf(root))
  assert.equal(states(report).tipos, 'failed')
  const [first] = report.steps[2]?.problems ?? []
  assert.deepEqual([first?.file, first?.line, first?.code], ['src/routes/home.tsx', 1, 'TS2307'])
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
