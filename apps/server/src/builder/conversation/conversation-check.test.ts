import assert from 'node:assert/strict'
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import type { CheckReport } from '@conexus/app/check'
import { CHECK_LIMITS, STEP_NAMES } from '@conexus/app/check'
import { CompanyId, ProjectId, VersionCheck } from '@conexus/hub-api'
import type { MastraMessagePart } from '@mastra/core/agent-controller'
import { z } from 'zod'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { asked, conversing, endOf, messagesOf, title } from './test-conversation.ts'
import { partsOf } from './test-parts.ts'
import { ask, conversingWith, tool, untilCard, WHO } from './test-questions.ts'

const WRITE = {
  type: 'tool_use',
  name: 'mastra_workspace_write_file',
  input: { path: 'a.ts', content: 'x\n' },
} as const
const CHECK = { type: 'tool_use', name: 'conexus_check', input: {} } as const
const FIX = {
  type: 'tool_use',
  name: 'mastra_workspace_execute_command',
  input: { command: 'echo y >> a.ts' },
} as const

const PASSED: CheckReport = {
  ok: true,
  steps: STEP_NAMES.map((name) => ({ name, state: 'passed', problems: [] })),
}
/** `tipos` refuses a handler's answer (criterion 8); the steps after it are skipped. */
const FAILED: CheckReport = {
  ok: false,
  steps: STEP_NAMES.map((name, at) => {
    if (at < 2) return { name, state: 'passed', problems: [] }
    if (at > 2) return { name, state: 'skipped', problems: [] }
    const problem = { file: 'server/handlers.ts', line: 13, column: 5, code: 'TS2322' }
    return { name, state: 'failed', problems: [{ ...problem, message: 'Type mismatch.' }] }
  }),
}

/** What the machine's check does on each call, in order; past the plan, it passes. */
type Plan = (CheckReport | 'platform')[]

/**
 * The machine's check program, a script of the test's: the n-th call prints the n-th report of
 * the plan, or exits 2 as the program does when the machine fails it (Chromium absent, a step past
 * its minute). `calls` counts how many times it ran.
 */
function checking(folder: string, plan: Plan) {
  mkdirSync(folder, { recursive: true })
  for (const [at, step] of plan.entries()) {
    const file = join(folder, `check-${at + 1}`)
    writeFileSync(file, step === 'platform' ? '' : JSON.stringify(step))
  }
  writeFileSync(join(folder, 'check-passed'), JSON.stringify(PASSED))
  const program = join(folder, 'check')
  writeFileSync(
    program,
    [
      '#!/bin/sh',
      `n=$(( $(cat '${folder}/check-count' 2>/dev/null || echo 0) + 1 ))`,
      `echo $n > '${folder}/check-count'`,
      `report='${folder}/check-'$n; [ -f "$report" ] || report='${folder}/check-passed'`,
      '[ -s "$report" ] || exit 2',
      'cat "$report"',
    ].join('\n'),
  )
  chmodSync(program, 0o755)
  function calls(): number {
    const count = join(folder, 'check-count')
    return existsSync(count) ? Number(readFileSync(count, 'utf8')) : 0
  }
  return { calls }
}

type Blocks = Extract<Reply, { kind: 'blocks' }>['blocks']

/**
 * The model's turn: the first step's blocks, then text each time it is asked again; given a `fix`,
 * it answers each failed end of the turn with those blocks before it ends again.
 */
function turnOf(blocks: Blocks, fix?: Blocks) {
  const asked: Sent[] = []
  function answer(call: Sent): Reply {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    asked.push(call)
    if (asked.length === 1 && blocks.length > 0) return { kind: 'blocks', blocks }
    const told = reportsIn(call).length > 0 && asked.length % 2 === 1
    if (fix !== undefined && told) return { kind: 'blocks', blocks: fix }
    return { kind: 'text', text: 'Pronto.' }
  }
  return { asked, answer }
}

const Version = z.object({
  number: z.number(),
  changedFiles: z.number(),
  check: VersionCheck.optional(),
})

/** The versions the parts say, by number, files changed and what the check said; the starter's files vary. */
function versionsOf(parts: MastraMessagePart[]) {
  return parts.flatMap((part) => {
    const read = part.type === 'data-conexus-version' ? Version.safeParse(part.data) : undefined
    return read?.success
      ? [
          {
            number: read.data.number,
            changedFiles: read.data.changedFiles,
            check: read.data.check ?? 'none',
          },
        ]
      : []
  })
}

/** The reports the model read in one call: a tool's result, or the words of a failed end of the turn. */
function reportsIn(call: Sent | undefined): unknown[] {
  return (call?.texts ?? []).flatMap((text) => {
    const at = text.indexOf('{"ok":')
    if (at < 0) return []
    return [JSON.parse(text.slice(at, text.lastIndexOf('}') + 1))]
  })
}

test('conexus_check e o fim do turno dão o mesmo relatório; o fim que passa guarda a versão que montou (12, 13)', async (t) => {
  const model = turnOf([WRITE, CHECK])
  const { hub, ana, conversations } = await conversing(t, model.answer)
  const check = checking(hub.builder.folder, [FAILED, FAILED])
  const { url, events } = await asked(t, { hub, person: ana, conversations }, 'Crie o app')
  assert.equal(check.calls(), 3, 'the tool, a failed end and a passing end')
  assert.deepEqual(reportsIn(model.asked[1]), [FAILED], 'the tool gave the report')
  assert.deepEqual(reportsIn(model.asked[2]).at(-1), FAILED, 'the end gave the same report')
  assert.equal(model.asked.length, 3)
  const built = [{ number: 1, changedFiles: 1, check: { state: 'passed' } }]
  assert.deepEqual(versionsOf(partsOf(events)), built)
  assert.deepEqual(versionsOf((await messagesOf(hub, ana, url)).at(-1)?.parts ?? []), built)
  assert.equal(endOf(events), 'complete')
})

test('a máquina que não confere (Chromium ausente, passo acima de 60 s) não conta como tentativa (12)', async (t) => {
  const model = turnOf([WRITE, CHECK])
  const { hub, ana, conversations } = await conversing(t, model.answer)
  const fails = Array.from({ length: CHECK_LIMITS.checks }, () => FAILED)
  const check = checking(hub.builder.folder, ['platform', ...fails])
  const { events } = await asked(t, { hub, person: ana, conversations }, 'Crie o app')
  assert.ok(model.asked[1]?.texts.some((text) => text.includes('CHECK_PLATFORM_FAILED')))
  assert.equal(check.calls(), 1 + CHECK_LIMITS.checks, 'every failed end of the turn counted')
  assert.deepEqual(versionsOf(partsOf(events)), [
    { number: 1, changedFiles: 1, check: { state: 'failed', code: 'APP_CHECK_FAILED' } },
  ])
})

test('quatro falhas no fim do turno: o código fica guardado, a versão não montou, APP_CHECK_FAILED (13)', async (t) => {
  const model = turnOf([WRITE], [FIX])
  const { hub, ana, companyId, projectId, conversations } = await conversing(t, model.answer)
  const check = checking(
    hub.builder.folder,
    Array.from({ length: CHECK_LIMITS.checks + 1 }, () => FAILED),
  )
  const { url, events } = await asked(t, { hub, person: ana, conversations }, 'Crie o app')
  assert.equal(check.calls(), CHECK_LIMITS.checks)
  // Each failed end but the last went back, and the model changed the file before it ended again.
  assert.equal(model.asked.length, 2 * CHECK_LIMITS.checks)
  const told = model.asked.filter((_call, at) => at > 0 && at % 2 === 0)
  for (const call of told) assert.deepEqual(reportsIn(call).at(-1), FAILED)
  const notBuilt = [
    { number: 1, changedFiles: 1, check: { state: 'failed', code: 'APP_CHECK_FAILED' } },
  ]
  assert.deepEqual(versionsOf(partsOf(events)), notBuilt)
  assert.deepEqual(versionsOf((await messagesOf(hub, ana, url)).at(-1)?.parts ?? []), notBuilt)
  const repository = hub.builder.repository({
    companyId: CompanyId.parse(companyId),
    projectId: ProjectId.parse(projectId),
  })
  const sha = await repository.main()
  const saved = await repository.file({ sha, path: 'a.ts', maxBytes: 100 })
  const fixed = `x\n${'y\n'.repeat(CHECK_LIMITS.checks - 1)}`
  assert.deepEqual(saved, { kind: 'text', text: fixed }, 'the code is kept')
  assert.equal(endOf(events), 'complete')
})

test('um turno que não muda arquivo não confere', async (t) => {
  const model = turnOf([])
  const { hub, ana, conversations } = await conversing(t, model.answer)
  const check = checking(hub.builder.folder, [FAILED])
  const { events } = await asked(t, { hub, person: ana, conversations }, 'Olá')
  assert.equal(check.calls(), 0)
  assert.deepEqual(versionsOf(partsOf(events)), [])
  assert.equal(model.asked.length, 1)
})

test('a máquina que não confere no fim do turno: o turno termina e guarda a versão sem conferência, CHECK_PLATFORM_FAILED', async (t) => {
  const model = turnOf([WRITE])
  const { hub, ana, conversations } = await conversing(t, model.answer)
  const check = checking(hub.builder.folder, ['platform'])
  const { url, events } = await asked(t, { hub, person: ana, conversations }, 'Crie o app')
  assert.equal(check.calls(), 1)
  assert.equal(model.asked.length, 2)
  const unchecked = [
    { number: 1, changedFiles: 1, check: { state: 'unchecked', code: 'CHECK_PLATFORM_FAILED' } },
  ]
  assert.deepEqual(versionsOf(partsOf(events)), unchecked)
  assert.deepEqual(versionsOf((await messagesOf(hub, ana, url)).at(-1)?.parts ?? []), unchecked)
})

test('uma pergunta encerra o turno: a versão fica sem veredito, nem a conferência roda', {
  timeout: 60_000,
}, async (t) => {
  const write = tool(WRITE.name, WRITE.input)
  const { hub, stream, send } = await conversingWith(t, [[write, ask(WHO)]])
  const check = checking(hub.builder.folder, ['platform'])
  assert.equal((await send()).statusCode, 200)
  const { events } = await untilCard(stream, 'question')
  assert.equal(endOf(events), 'suspended')
  assert.equal(check.calls(), 0)
  assert.deepEqual(versionsOf(partsOf(events)), [{ number: 1, changedFiles: 1, check: 'none' }])
})

/** The `conexus_check` calls of a turn, each as its last `tool-invocation` part says it. */
function checkCalls(events: Parameters<typeof partsOf>[0]) {
  const last = new Map<
    string,
    Extract<MastraMessagePart, { type: 'tool-invocation' }>['toolInvocation']
  >()
  for (const part of partsOf(events)) {
    if (part.type === 'tool-invocation' && part.toolInvocation.toolName === 'conexus_check') {
      last.set(part.toolInvocation.toolCallId, part.toolInvocation)
    }
  }
  return [...last.values()]
}

const Reported = z.object({
  ok: z.boolean(),
  steps: z.array(z.object({ name: z.string(), state: z.string() })),
})

test('a chamada de conexus_check guarda o relatório como resultado; a máquina que não conferiu é um erro da chamada (33)', async (t) => {
  const model = turnOf([WRITE, CHECK, CHECK])
  const { hub, ana, conversations } = await conversing(t, model.answer)
  checking(hub.builder.folder, [FAILED, 'platform'])
  const { events } = await asked(t, { hub, person: ana, conversations }, 'Crie o app')
  const [failed, unavailable] = checkCalls(events)
  assert.equal(failed?.state, 'result')
  assert.deepEqual(Reported.parse(failed?.result), {
    ok: false,
    steps: FAILED.steps.map(({ name, state }) => ({ name, state })),
  })
  assert.equal(unavailable?.state, 'result')
  assert.equal(Object(unavailable?.result).error, 'CHECK_PLATFORM_FAILED')
  assert.equal(Reported.safeParse(unavailable?.result).success, false, 'no report to open')
})

const PLANNED = [
  { content: 'Tabela de encomendas', activeForm: 'Criando a tabela', status: 'completed' },
  { content: 'Tela de encomendas', activeForm: 'Fazendo a tela', status: 'in_progress' },
  { content: 'Filtro por data', activeForm: 'Filtrando', status: 'pending' },
]
const TASKS = { type: 'tool_use', name: 'task_write', input: { tasks: PLANNED } } as const
const DONE = {
  type: 'tool_use',
  name: 'task_write',
  input: { tasks: PLANNED.map((task) => ({ ...task, status: 'completed' })) },
} as const
const OPEN = '2 tarefas abertas: Tela de encomendas; Filtro por data.'

/** The calls whose texts carry the words of a turn that ended with tasks open. */
function toldOpen(calls: Sent[]): Sent[] {
  return calls.filter((call) => call.texts.some((text) => text.includes(OPEN)))
}

test('o passo final vazio com tarefas abertas volta ao modelo com elas; feitas, a conferência roda e monta (14.2, 15)', async (t) => {
  const calls: Sent[] = []
  const steps: Blocks[] = [[TASKS, WRITE], [], [DONE]]
  const { hub, ana, conversations } = await conversing(t, (call): Reply => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    calls.push(call)
    const blocks = steps[calls.length - 1]
    return blocks === undefined ? { kind: 'text', text: 'Pronto.' } : { kind: 'blocks', blocks }
  })
  const check = checking(hub.builder.folder, [])
  const { events } = await asked(t, { hub, person: ana, conversations })
  assert.deepEqual(toldOpen(calls), calls.slice(2), 'the empty end went back with the open tasks')
  assert.equal(calls.length, 4)
  assert.equal(check.calls(), 1, 'the check ran once the tasks were done')
  assert.deepEqual(versionsOf(partsOf(events)), [
    { number: 1, changedFiles: 1, check: { state: 'passed' } },
  ])
})

test(`tarefas abertas em ${CHECK_LIMITS.checks} fins: a versão fica pela metade, sem conferência, e a linha conta as rodadas (14.2, 15, 17)`, async (t) => {
  const model = turnOf([TASKS, WRITE])
  const { hub, ana, conversations, lines } = await conversing(t, model.answer)
  const check = checking(hub.builder.folder, [])
  const { url, events } = await asked(t, { hub, person: ana, conversations })
  assert.equal(model.asked.length, 1 + CHECK_LIMITS.checks)
  assert.equal(toldOpen(model.asked).length, CHECK_LIMITS.checks - 1)
  assert.equal(check.calls(), 0)
  const halfDone = [{ number: 1, changedFiles: 1, check: { state: 'unfinished', open: 2 } }]
  assert.deepEqual(versionsOf(partsOf(events)), halfDone)
  assert.deepEqual(versionsOf((await messagesOf(hub, ana, url)).at(-1)?.parts ?? []), halfDone)
  const [ended] = lines.filter((line) => line.message === 'CONVERSATION_TURN_ENDED')
  assert.equal(ended?.fields.rounds, CHECK_LIMITS.checks)
})

test('uma pergunta com tarefas abertas: nada volta ao modelo e a versão fica sem veredito (14.2, 15)', {
  timeout: 60_000,
}, async (t) => {
  const write = tool(WRITE.name, WRITE.input)
  const tasks = tool(TASKS.name, TASKS.input)
  const { hub, stream, send, calls } = await conversingWith(t, [[tasks, write, ask(WHO)]])
  const check = checking(hub.builder.folder, [])
  assert.equal((await send()).statusCode, 200)
  const { events } = await untilCard(stream, 'question')
  assert.equal(endOf(events), 'suspended')
  assert.deepEqual(toldOpen(calls), [])
  assert.equal(check.calls(), 0)
  assert.deepEqual(versionsOf(partsOf(events)), [{ number: 1, changedFiles: 1, check: 'none' }])
})
