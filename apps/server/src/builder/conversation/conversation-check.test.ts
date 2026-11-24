import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CHECK_LIMITS } from '@conexus/app/check'
import { CompanyId, ProjectId } from '@conexus/hub-api'
import { z } from 'zod'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import type { Blocks } from './test-check.ts'
import { CHECK, checkCalls, checking, FAILED, FIX, reportsIn, turnOf, WRITE } from './test-check.ts'
import { answeredOf, asked, conversing, endOf, messagesOf, title } from './test-conversation.ts'
import { partsOf, shownPartsOf, versionsOf } from './test-parts.ts'
import { ask, conversingWith, tool, untilCard, WHO } from './test-questions.ts'

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
  assert.deepEqual(versionsOf(shownPartsOf(events)), built)
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
  assert.deepEqual(versionsOf(shownPartsOf(events)), [
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
  assert.deepEqual(versionsOf(shownPartsOf(events)), notBuilt)
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
  assert.deepEqual(versionsOf(shownPartsOf(events)), [])
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
  assert.deepEqual(versionsOf(shownPartsOf(events)), unchecked)
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
  assert.deepEqual(versionsOf(shownPartsOf(events)), [
    { number: 1, changedFiles: 1, check: 'none' },
  ])
})

const Checked = z.object({
  kind: z.string(),
  machine: z.object({
    ok: z.boolean(),
    steps: z.array(z.object({ name: z.string(), state: z.string() })),
  }),
})

test('conexus_check que conferiu devolve o BuilderCheck, sem erro; a máquina ou o navegador que não puderam lançam CHECK_PLATFORM_FAILED (27)', async (t) => {
  const model = turnOf([WRITE, CHECK, CHECK, CHECK])
  const { hub, ana, conversations } = await conversing(t, model.answer)
  hub.builder.knobs.seeing = { ok: false, error: 'CONFER_PLATFORM_FAILED' }
  checking(hub.builder.folder, [FAILED, 'platform'])
  const { url, events } = await asked(t, { hub, person: ana, conversations }, 'Crie o app')
  const [failed, ...unchecked] = checkCalls(partsOf(events))
  assert.equal(failed?.state, 'result')
  assert.notEqual(failed?.isError, true)
  assert.deepEqual(Checked.parse(failed?.result), {
    kind: 'MACHINE_FAILED',
    machine: { ok: false, steps: FAILED.steps.map(({ name, state }) => ({ name, state })) },
  })
  const [machine, browser] = unchecked
  assert.equal(unchecked.length, 2, 'the machine that failed and the browser that did')
  for (const call of unchecked) {
    assert.equal(call.state, 'result')
    assert.equal(call.isError, true, 'live, the end of the tool is an error')
    assert.equal(Checked.safeParse(call.result).success, false, 'no check to open')
  }
  assert.equal(hub.builder.knobs.conferred.browsed, 2, 'the third call and the end reached it')
  const stored = checkCalls((await answeredOf(hub, ana, url)).flatMap((message) => message.parts))
  assert.deepEqual(
    stored.map((call) => call.state),
    ['result', 'output-error', 'output-error'],
  )
  for (const call of [machine, browser]) {
    const kept = stored.find((each) => each.toolCallId === call?.toolCallId)
    assert.equal(kept?.errorText, 'CHECK_PLATFORM_FAILED')
  }
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
  const evaluations = events.filter((event) => event.type === 'task_complete_evaluation')
  assert.deepEqual(
    evaluations.map((event) => Object(event.payload).passed),
    [false, true],
    'the screen is told each evaluation',
  )
  assert.deepEqual(versionsOf(shownPartsOf(events)), [
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
  assert.deepEqual(versionsOf(shownPartsOf(events)), halfDone)
  assert.deepEqual(versionsOf((await messagesOf(hub, ana, url)).at(-1)?.parts ?? []), halfDone)
  const [ended] = lines.filter((line) => line.message === 'CONVERSATION_TURN_ENDED')
  assert.equal(ended?.fields.rounds, CHECK_LIMITS.checks)
})

test('tarefas abertas não gastam as voltas da conferência: três fins abertos e depois três conferências que falham ainda deixam a quarta montar (14.2, 15)', async (t) => {
  const open = CHECK_LIMITS.checks - 1
  const steps: Blocks[] = [
    [TASKS, WRITE],
    ...Array.from({ length: open }, (): Blocks => []),
    [DONE],
  ]
  let calls = 0
  const { hub, ana, conversations } = await conversing(t, (call): Reply => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    const blocks = steps[calls]
    calls += 1
    return blocks === undefined ? { kind: 'text', text: 'Pronto.' } : { kind: 'blocks', blocks }
  })
  const check = checking(
    hub.builder.folder,
    Array.from({ length: CHECK_LIMITS.checks - 1 }, () => FAILED),
  )
  const { events } = await asked(t, { hub, person: ana, conversations })
  assert.equal(check.calls(), CHECK_LIMITS.checks, 'the check had all of its own turns')
  assert.deepEqual(versionsOf(shownPartsOf(events)), [
    { number: 1, changedFiles: 1, check: { state: 'passed' } },
  ])
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
  assert.deepEqual(versionsOf(shownPartsOf(events)), [
    { number: 1, changedFiles: 1, check: 'none' },
  ])
})
