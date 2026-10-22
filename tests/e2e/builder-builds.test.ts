import assert from 'node:assert/strict'
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import type { CheckReport } from '@conexus/app/check'
import { STEP_NAMES } from '@conexus/app/check'
import type { Page } from 'playwright-core'
import type { Reply } from '../../apps/server/src/platform/test-anthropic.ts'
import { plantAnthropic } from '../../apps/server/src/platform/test-anthropic.ts'
import { TEST_ORIGIN } from '../../apps/server/src/platform/test-database.ts'
import {
  ask,
  outputWith,
  plantTwoCompanies,
  readyToBuild,
  transcriptOf,
  transcriptShowed,
} from './conversation-journey.ts'
import { hubWindow, openConversation } from './hub-window.ts'
import { createProject, liveHub, openHome, openProject } from './live-hub.ts'

// Step 14's use script (card "O roteiro de uso", steps 1 to 6) in Chromium, on a real Hub, a test
// machine that is a folder and Anthropic's double, which plays the Builder's tool calls in order:
// Ana answers its questions, asks the plan for a change and approves it, sees the tasks, the
// command and version 1 that builds over the starter; allows a library and version 2 builds; a
// new Projeto gets a screen-only version. The machine's check program is the one thing faked
// beyond the providers: it prints a passing report and keeps the grants it was given.
const WORKING = 'Builder trabalhando'
const PLAN = '.conexus/plan.md'

type Block = Extract<Reply, { kind: 'blocks' }>['blocks'][number]

function tool(name: string, input: object): Block {
  return { type: 'tool_use', name, input }
}
function write(path: string, content: string) {
  return tool('mastra_workspace_write_file', { path, content })
}
function read(path: string) {
  return tool('mastra_workspace_read_file', { path })
}
function questions(...asked: object[]) {
  return tool('ask_user', { questions: asked })
}
function tasks(first: string, second: string) {
  return tool('task_write', {
    tasks: [
      {
        id: 'dados',
        content: 'Operações e tabela',
        activeForm: 'Montando a tabela',
        status: first,
      },
      { id: 'telas', content: 'Tela de encomendas', activeForm: 'Montando a tela', status: second },
    ],
  })
}

const WHO = {
  question: 'Quem cadastra as encomendas?',
  options: [{ label: 'Todos (recomendado)' }, { label: 'Só eu' }],
}
const STATUS = {
  question: 'Uma encomenda tem situação?',
  options: [{ label: 'Sim: recebida, pronta, entregue (recomendado)' }, { label: 'Não' }],
}
const LIBRARY = {
  question: 'Preciso da biblioteca react-big-calendar (≈ 300 KB). Permitir?',
  library: { name: 'react-big-calendar', version: '1.19.4' },
}
const PRICES = {
  question: 'Quais produtos e preços entram na tabela?',
  options: [{ label: 'Os pães do dia (recomendado)' }, { label: 'Pães e bolos' }],
}
const PRICES_GIVEN = 'Pão francês R$ 1,00; Sonho R$ 6,50; Bolo de fubá R$ 28,00'
const ADJUSTMENT = 'Mostre também o telefone do cliente.'

const FIRST_PLAN = `# App de encomendas

## Para a pessoa

Uma lista de encomendas com cliente, produto, data de entrega e situação; todos cadastram.
`
const ADJUSTED_PLAN = FIRST_PLAN.replace('cliente,', 'cliente, telefone,')

const OPERATIONS = `import { defineOperations } from '@conexus/app'
import { z } from 'zod'

export const SITUACOES = ['recebida', 'pronta', 'entregue'] as const
export const Encomenda = z.object({
  id: z.int(),
  cliente: z.string(),
  telefone: z.string(),
  produto: z.string(),
  entrega: z.iso.date(),
  situacao: z.enum(SITUACOES),
})
export const operations = defineOperations({
  listarEncomendas: { input: z.object({}), output: z.array(Encomenda) },
})
`
const HANDLERS = `import { defineHandlers, query } from '@conexus/app'
import { Encomenda, operations } from '../shared/operations'

export const migrations = [
  {
    id: '001_encomenda',
    statements: [
      \`CREATE TABLE encomenda (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        cliente text NOT NULL, telefone text NOT NULL, produto text NOT NULL,
        entrega date NOT NULL, situacao text NOT NULL DEFAULT 'recebida'
      )\`,
    ],
  },
]
export const handlers = defineHandlers(operations, {
  listarEncomendas(_input, { db }) {
    return query(db, Encomenda, 'SELECT * FROM encomenda ORDER BY entrega')
  },
})
`
const ORDERS_SCREEN = `export function Home() {
  return <h1>Encomendas da Padaria Sol</h1>
}
`
const CALENDAR_SCREEN = `import { Calendar } from 'react-big-calendar'

export function Entregas() {
  return <Calendar events={[]} />
}
`
const PRICES_SCREEN = `export function Home() {
  return <h1>Tabela de preços</h1>
}
`

/**
 * What the Builder does, a step per model call: the card's two questions, the plan, the plan again
 * after the person's change, the tasks, the operations, the table and the screen over the
 * starter's, a command, the check, the tasks done; then the library card and the calendar; then, in
 * the new Projeto, the prices question and the screen alone. A file the starter has is read before
 * it is written, as a write over a file not read is refused.
 */
const SCRIPT: (Block[] | string)[] = [
  [questions(WHO, STATUS)],
  [write(PLAN, FIRST_PLAN)],
  [tool('submit_plan', { path: PLAN })],
  [read(PLAN)],
  [write(PLAN, ADJUSTED_PLAN)],
  [tool('submit_plan', { path: PLAN })],
  [tasks('in_progress', 'pending')],
  [write('shared/operations.ts', OPERATIONS)],
  [write('server/handlers.ts', HANDLERS)],
  [read('src/routes/home.tsx')],
  [write('src/routes/home.tsx', ORDERS_SCREEN)],
  [tool('mastra_workspace_execute_command', { command: 'ls shared server' })],
  [tool('conexus_check', {})],
  [tasks('completed', 'completed')],
  'O app de encomendas está pronto.',
  [questions(LIBRARY)],
  [read('package.json')],
  [
    tool('mastra_workspace_edit_file', {
      path: 'package.json',
      old_string: '"react": "19.3.0",',
      new_string: '"react": "19.3.0",\n    "react-big-calendar": "1.19.4",',
    }),
  ],
  [write('src/routes/entregas.tsx', CALENDAR_SCREEN)],
  'As entregas aparecem num calendário.',
  [questions(PRICES)],
  [read('src/routes/home.tsx')],
  [write('src/routes/home.tsx', PRICES_SCREEN)],
  'A tabela de preços está pronta, só de tela.',
]

function builderThatBuilds(t: Parameters<typeof plantAnthropic>[0]) {
  let step = 0
  return plantAnthropic(t, (sent): Reply => {
    if (!sent.stream) return { kind: 'text', text: 'App de encomendas' }
    if (!sent.system.includes('You are the Conexus Builder'))
      return { kind: 'text', text: 'Anotado.' }
    const next = SCRIPT[step++] ?? 'Pronto.'
    return typeof next === 'string'
      ? { kind: 'text', text: next }
      : { kind: 'blocks', blocks: next }
  })
}

const PASSED: CheckReport = {
  ok: true,
  steps: STEP_NAMES.map((name) => ({ name, state: 'passed', problems: [] })),
}

/**
 * The machine's check program, in the test machine's folder as the template puts it in
 * `/opt/conexus`: it prints a passing report, the steps' own proof being `check.test.ts`, and keeps
 * the grants the Hub gave each call (`--grants`, the fourth argument) for the test to read.
 */
function passingCheck(folder: string) {
  mkdirSync(folder, { recursive: true })
  const report = join(folder, 'check-report')
  const grants = join(folder, 'check-grants')
  writeFileSync(report, JSON.stringify(PASSED))
  writeFileSync(grants, '')
  const program = join(folder, 'check')
  writeFileSync(
    program,
    ['#!/bin/sh', `printf '%s\\n' "$4" >> '${grants}'`, `cat '${report}'`].join('\n'),
  )
  chmodSync(program, 0o755)
  return () =>
    readFileSync(grants, 'utf8')
      .split('\n')
      .filter((line) => line !== '')
      .map((line) => JSON.parse(line))
}

/** Waits for the turn's end and its version line. */
async function versionSaid(chat: Page, version: RegExp | string) {
  await chat.getByText(WORKING).waitFor({ state: 'hidden' })
  await transcriptOf(chat).getByText(version).waitFor()
}

/** Steps 1 and 2: the questions answered, the plan changed once, then approved. */
async function questionsAndPlan(chat: Page) {
  const transcript = transcriptOf(chat)
  await ask(chat, 'Crie um app de encomendas com cliente, telefone, produto e data de entrega.')
  await transcript.getByText(WHO.question).waitFor()
  await transcript.getByRole('button', { name: 'Próxima' }).click()
  await transcript.getByText(STATUS.question).waitFor()
  await transcript.getByRole('button', { name: 'Enviar' }).click()
  const first = transcript.getByRole('region', { name: 'Plano: App de encomendas' })
  await first.getByText('Para a pessoa').waitFor()
  assert.equal(await transcript.getByRole('radio').count(), 0, 'the answered card has closed')
  await first.getByRole('button', { name: 'Pedir ajustes' }).click()
  await first.getByLabel('O que mudar no plano').fill(ADJUSTMENT)
  await first.getByRole('button', { name: 'Pedir ajustes' }).click()
  await transcript.getByText('Este plano foi substituído.').waitFor()
  const adjusted = transcript.getByRole('region', { name: 'Plano: App de encomendas' }).last()
  await adjusted.getByText(/cliente, telefone, produto/).waitFor()
  await adjusted.getByRole('button', { name: 'Aprovar e construir' }).click()
}

/** Steps 3 and 4: the tasks, the command's row, version 1 that builds, its files over the starter. */
async function firstVersion(chat: Page) {
  const transcript = transcriptOf(chat)
  await versionSaid(chat, /^Versão 1 guardada, montou: \d+ arquivos\.$/)
  await transcriptShowed(chat, 'em andamento')
  assert.equal(await transcript.getByText('concluída', { exact: true }).count(), 2)
  // The turn's tools in a row are one closed line that says what they did; it opens on each one.
  await transcript.getByRole('button', { name: /rodou 1 comando/ }).click()
  await transcript.getByRole('button', { name: /Rodou um comando/ }).click()
  await transcript.locator('pre', { hasText: '$ ls shared server' }).waitFor()
  await outputWith(chat, 'operations.ts').waitFor()
  await chat.getByText(/Versão 1, guardada em/).waitFor()
  for (const path of ['shared/operations.ts', 'server/handlers.ts', 'src/main.tsx'])
    await chat.getByRole('button', { name: path, exact: true }).waitFor()
  await chat.getByRole('button', { name: 'src/routes/home.tsx', exact: true }).click()
  await chat
    .getByRole('region', { name: 'Conteúdo de src/routes/home.tsx' })
    .getByText('Encomendas da Padaria Sol')
    .waitFor()
}

/** Step 5: the library card, allowed as it recommends; version 2 builds. */
async function libraryAllowed(chat: Page) {
  const transcript = transcriptOf(chat)
  await ask(chat, 'Agora mostre as entregas num calendário.')
  await transcript.getByText(LIBRARY.question).waitFor()
  await transcript.getByText('react-big-calendar@1.19.4').waitFor()
  await transcript.getByRole('button', { name: 'Enviar' }).click()
  await versionSaid(chat, 'Versão 2 guardada, montou: 2 arquivos mudados.')
  await chat.getByRole('button', { name: 'src/routes/entregas.tsx', exact: true }).waitFor()
}

/** Step 6: a new Projeto; the prices asked and typed; a version of screens alone that builds. */
async function screenOnly(chat: Page) {
  await openHome(chat)
  await createProject(chat, 'Preços')
  await chat.getByRole('heading', { name: 'Preços', exact: true }).waitFor()
  await chat.getByRole('tab', { name: 'Código', exact: true }).click()
  await openConversation(chat, () => chat.getByRole('button', { name: 'Nova conversa' }).click())
  const transcript = transcriptOf(chat)
  await ask(chat, 'Uma página com a tabela de preços')
  await transcript.getByText(PRICES.question).waitFor()
  await transcript.getByLabel('Outra resposta').fill(PRICES_GIVEN)
  await transcript.getByRole('button', { name: 'Enviar' }).click()
  await versionSaid(chat, /^Versão 1 guardada, montou: \d+ arquivos\.$/)
  await chat.getByText(/Versão 1, guardada em/).waitFor()
  await chat.getByRole('button', { name: 'src/routes/home.tsx', exact: true }).waitFor()
  const files = chat.getByRole('list', { name: 'Arquivos do app' })
  assert.equal(await files.getByRole('button', { name: /^(shared|server)\// }).count(), 0)
}

test('o roteiro do Builder que constrói: perguntas, plano ajustado e aprovado, tarefas, a versão que monta, a biblioteca permitida e um Projeto só de tela', async (t) => {
  const anthropic = builderThatBuilds(t)
  const { port, database, machineFolder } = await liveHub(t, 'http://127.0.0.1:9/unused')
  const grantsChecked = passingCheck(machineFolder)
  const ids = await plantTwoCompanies(database)
  const problems: string[] = []
  const closers: (() => Promise<void>)[] = []
  try {
    const chat = await hubWindow(closers, port, '198.51.100.10', problems)
    await readyToBuild(chat, ids.companyA, 'Encomendas')
    await chat.goto(`${TEST_ORIGIN}/companies/${ids.companyA}`)
    await openProject(chat, 'Encomendas')
    await chat.getByRole('tab', { name: 'Código', exact: true }).click()
    await openConversation(chat, () => chat.getByRole('button', { name: 'Nova conversa' }).click())
    await questionsAndPlan(chat)
    await firstVersion(chat)
    await libraryAllowed(chat)
    await screenOnly(chat)
  } finally {
    for (const close of closers) await close()
  }
  assert.deepEqual(problems, [])
  const modelRead = anthropic.sent.flatMap((call) => call.texts)
  assert.ok(modelRead.some((text) => text.includes(`User feedback: ${ADJUSTMENT}`)))
  assert.ok(modelRead.some((text) => text.includes(PRICES_GIVEN)))
  const allowed = [{ name: 'react-big-calendar', version: '1.19.4' }]
  // The tool and the end of turn 1, the end of turn 2, the end of the new Projeto's turn.
  assert.deepEqual(grantsChecked(), [[], [], allowed, []])
})
