import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import {
  BRUNO,
  CARLA,
  call,
  codeOf,
  memberOn,
  plantCompany,
  post,
} from '../../hub/identity/test-hub.ts'
import { holding } from '../conversation/test-conversation.ts'
import type { Summary } from './test-automations.ts'
import {
  automating,
  automationOf,
  choiceOf,
  created,
  ended,
  nextSeven,
  ranNow,
  runsOf,
  salesSummary,
} from './test-automations.ts'

const BIA = { name: 'Bia Souza', email: 'bia@example.test' }

function listed(response: { json(): unknown }): Summary[] {
  return Object(response.json()).automations
}

test('criar: a dona cria no Início com as ligações que ele oferece; 201 com ACTIVE, a cadência e o próximo 07:00 de São Paulo; a lista mostra igual', async (t) => {
  const on = await automating(t)
  const before = new Date()
  const made = await post(on.hub, on.ana, on.automations, salesSummary([on.matriz, on.filial]))
  assert.equal(made.statusCode, 201, made.body)
  const automation = automationOf(made)
  assert.match(automation.id, /^schedule_conexus-automation-[0-9a-f-]{36}$/)
  assert.equal(automation.state, 'ACTIVE')
  assert.deepEqual(automation.cadence, { kind: 'DAILY', time: '07:00' })
  assert.equal(automation.projectId, null)
  assert.equal(automation.name, 'Resumo de vendas')
  assert.equal(automation.prompt, 'O resumo de vendas de ontem, por vendedor.')
  assert.deepEqual(choiceOf(automation.connections), [
    ['Matriz', true],
    ['Filial', true],
  ])
  assert.equal(automation.nextRunAt, nextSeven(before))
  const list = await call(on.hub, on.ana, 'GET', on.automations)
  assert.equal(list.statusCode, 200, list.body)
  assert.deepEqual(listed(list), [automation])
  const logged = on.lines.find((line) => line.message === 'AUTOMATION_CREATED')
  const { companyId } = on
  assert.deepEqual(logged?.fields, { companyId, automationId: automation.id, cadence: 'DAILY' })
})

test('a tentativa: a mesma chave e o mesmo corpo dão a mesma automação, também ao mesmo tempo; outro corpo, IDEMPOTENCY_CONFLICT; duas chaves, duas; a mesma chave da Bia cria a dela', async (t) => {
  const on = await automating(t)
  const bia = await memberOn(on.hub, on.companyId, BIA, 'admin')
  const body = salesSummary([on.matriz])
  const key = randomUUID()
  const [first, second] = await Promise.all([
    post(on.hub, on.ana, on.automations, body, key),
    post(on.hub, on.ana, on.automations, body, key),
  ])
  assert.equal(first.statusCode, 201, first.body)
  assert.equal(second.statusCode, 201, second.body)
  assert.equal(automationOf(first).id, automationOf(second).id)
  const again = await post(on.hub, on.ana, on.automations, body, key)
  assert.deepEqual(automationOf(again), automationOf(first))
  const other = await post(on.hub, on.ana, on.automations, { ...body, name: 'Outro' }, key)
  assert.equal(other.statusCode, 409, other.body)
  assert.equal(codeOf(other), 'IDEMPOTENCY_CONFLICT')
  const second2 = await post(on.hub, on.ana, on.automations, body, randomUUID())
  assert.notEqual(automationOf(second2).id, automationOf(first).id)
  const hers = await post(on.hub, bia, on.automations, body, key)
  assert.equal(hers.statusCode, 201, hers.body)
  assert.notEqual(automationOf(hers).id, automationOf(first).id)
  assert.equal(listed(await call(on.hub, on.ana, 'GET', on.automations)).length, 2)
  assert.deepEqual(
    listed(await call(on.hub, bia, 'GET', on.automations)).map((each) => each.id),
    [automationOf(hers).id],
  )
})

test('as recusas: o membro, um Projeto de outra empresa ou apagado, uma cadência fora da união, o pedido vazio ou longo; uma ligação de fora ou que o lugar não oferece não é gravada', async (t) => {
  const on = await automating(t)
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'member')
  const member = await post(on.hub, bruno, on.automations, salesSummary([]))
  assert.equal(member.statusCode, 404, member.body)
  assert.equal(codeOf(member), 'NOT_FOUND')

  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const otherCompany = await plantCompany(on.hub.test, carla.id, 'Outra')
  const theirs = await post(on.hub, carla, `/api/companies/${otherCompany}/projects`, {
    name: 'Deles',
  })
  assert.equal(theirs.statusCode, 201, theirs.body)
  const foreign = String(Object(theirs.json()).project.id)
  const elsewhere = await post(
    on.hub,
    on.ana,
    on.automations,
    salesSummary([], { projectId: foreign }),
  )
  assert.equal(codeOf(elsewhere), 'NOT_FOUND')
  const gone = await post(on.hub, on.ana, `${on.company}/projects`, { name: 'Apagado' })
  const goneId = String(Object(gone.json()).project.id)
  const deleted = await call(on.hub, on.ana, 'DELETE', `${on.company}/projects/${goneId}`, {
    name: 'Apagado',
  })
  assert.equal(deleted.statusCode, 204, deleted.body)
  const inGone = await post(on.hub, on.ana, on.automations, salesSummary([], { projectId: goneId }))
  assert.equal(codeOf(inGone), 'NOT_FOUND')

  for (const malformed of [
    { cadence: { kind: 'HOURLY', time: '07:00' } },
    { cadence: { kind: 'MONTHLY', day: 31, time: '07:00' } },
    { cadence: { kind: 'WEEKLY', days: [], time: '07:00' } },
    { cadence: { kind: 'DAILY', time: '24:00' } },
    { prompt: '   ' },
    { prompt: 'x'.repeat(4001) },
  ]) {
    const refused = await post(on.hub, on.ana, on.automations, salesSummary([], malformed))
    assert.equal(refused.statusCode, 400, JSON.stringify(malformed))
    assert.equal(codeOf(refused), 'REQUEST_MALFORMED')
  }
  assert.deepEqual(listed(await call(on.hub, on.ana, 'GET', on.automations)), [])

  const inProject = await created(
    on.hub,
    on.ana,
    on.automations,
    salesSummary([on.matriz, on.filial, randomUUID()], { projectId: on.projectId }),
  )
  assert.equal(inProject.projectId, on.projectId)
  assert.deepEqual(choiceOf(inProject.connections), [['Matriz', true]])
  const stored = await on.hub.mastra.schedules.get(inProject.id)
  assert.deepEqual(Object(stored).inputData.connections, [on.matriz])
})

test('o limite: a 31ª automação ativa da empresa dá AUTOMATION_LIMIT, de qualquer pessoa; retomar a 31ª também', async (t) => {
  const on = await automating(t)
  const bia = await memberOn(on.hub, on.companyId, BIA, 'admin')
  const made = []
  for (let each = 0; each < 30; each += 1) {
    const who = each % 2 === 0 ? on.ana : bia
    made.push({ who, automation: await created(on.hub, who, on.automations, salesSummary([])) })
  }
  const over = await post(on.hub, on.ana, on.automations, salesSummary([]))
  assert.equal(over.statusCode, 409, over.body)
  assert.equal(codeOf(over), 'AUTOMATION_LIMIT')
  const [first] = made
  assert.ok(first)
  const url = `${on.automations}/${first.automation.id}`
  assert.equal((await post(on.hub, first.who, `${url}/pause`, {})).statusCode, 200)
  await created(on.hub, bia, on.automations, salesSummary([]))
  const resumed = await post(on.hub, first.who, `${url}/resume`, {})
  assert.equal(resumed.statusCode, 409, resumed.body)
  assert.equal(codeOf(resumed), 'AUTOMATION_LIMIT')
})

test('a lista: só as da pessoa, do lugar pedido; a da Ana não aparece para a Bia; o membro recebe NOT_FOUND', async (t) => {
  const on = await automating(t)
  const bia = await memberOn(on.hub, on.companyId, BIA, 'admin')
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'member')
  const home = await created(on.hub, on.ana, on.automations, salesSummary([on.matriz]))
  const inProject = await created(
    on.hub,
    on.ana,
    on.automations,
    salesSummary([on.matriz], { projectId: on.projectId }),
  )
  async function ids(who = on.ana, query = '') {
    const read = await call(on.hub, who, 'GET', `${on.automations}${query}`)
    return listed(read).map((each) => each.id)
  }
  assert.deepEqual(await ids(), [home.id])
  assert.deepEqual(await ids(on.ana, `?projectId=${on.projectId}`), [inProject.id])
  assert.deepEqual(await ids(bia), [])
  assert.deepEqual(await ids(bia, `?projectId=${on.projectId}`), [])
  const member = await call(on.hub, bruno, 'GET', on.automations)
  assert.equal(member.statusCode, 404, member.body)
  assert.equal(codeOf(member), 'NOT_FOUND')
})

test('pausar e retomar: PAUSED sem próximo, ACTIVE com o próximo; repetir responde o estado; a de outra pessoa, AUTOMATION_NOT_FOUND', async (t) => {
  const on = await automating(t)
  const bia = await memberOn(on.hub, on.companyId, BIA, 'admin')
  const automation = await created(on.hub, on.ana, on.automations, salesSummary([]))
  const url = `${on.automations}/${automation.id}`
  for (const round of [1, 2]) {
    const paused = await post(on.hub, on.ana, `${url}/pause`, {})
    assert.equal(paused.statusCode, 200, `pause ${round}: ${paused.body}`)
    assert.equal(automationOf(paused).state, 'PAUSED')
    assert.equal(automationOf(paused).nextRunAt, null)
  }
  const listedPaused = listed(await call(on.hub, on.ana, 'GET', on.automations))
  assert.equal(listedPaused[0]?.state, 'PAUSED')
  for (const round of [1, 2]) {
    const before = new Date()
    const resumed = await post(on.hub, on.ana, `${url}/resume`, {})
    assert.equal(resumed.statusCode, 200, `resume ${round}: ${resumed.body}`)
    assert.equal(automationOf(resumed).state, 'ACTIVE')
    assert.equal(automationOf(resumed).nextRunAt, nextSeven(before))
  }
  for (const action of ['pause', 'resume', 'run']) {
    const refused = await post(on.hub, bia, `${url}/${action}`, {})
    assert.equal(refused.statusCode, 404, refused.body)
    assert.equal(codeOf(refused), 'AUTOMATION_NOT_FOUND')
  }
  for (const method of ['DELETE', 'GET'] as const) {
    const refused = await call(on.hub, bia, method, method === 'GET' ? `${url}/runs` : url)
    assert.equal(codeOf(refused), 'AUTOMATION_NOT_FOUND')
  }
})

test('rodar agora: 202 com o id da execução, MANUAL no histórico; um segundo pedido enquanto roda dá AUTOMATION_RUNNING; pausada, roda do mesmo jeito', async (t) => {
  const held = holding(t)
  let calls = 0
  const on = await automating(t, (asked) => {
    if (!asked.stream) return { kind: 'text', text: 'Título' }
    calls += 1
    return calls === 1 ? held.reply : { kind: 'text', text: 'Pronto.' }
  })
  const automation = await created(on.hub, on.ana, on.automations, salesSummary([]))
  const url = `${on.automations}/${automation.id}`
  const runId = await ranNow(on.hub, on.ana, url)
  assert.match(runId, new RegExp(`^sched_${automation.id}_\\d+$`))
  const [running] = (await runsOf(on.hub, on.ana, url)).runs
  assert.equal(running?.runId, runId)
  assert.equal(running?.trigger, 'MANUAL')
  assert.equal(running?.state.kind, 'RUNNING')
  const busy = await post(on.hub, on.ana, `${url}/run`, {})
  assert.equal(busy.statusCode, 409, busy.body)
  assert.equal(codeOf(busy), 'AUTOMATION_RUNNING')
  held.release()
  assert.equal((await ended(on.hub, on.ana, url, runId)).state.kind, 'DONE')

  assert.equal((await post(on.hub, on.ana, `${url}/pause`, {})).statusCode, 200)
  const whilePaused = await ranNow(on.hub, on.ana, url)
  const done = await ended(on.hub, on.ana, url, whilePaused)
  assert.equal(done.trigger, 'MANUAL')
  assert.equal(done.state.kind, 'DONE')
  assert.ok(on.lines.some((line) => line.message === 'AUTOMATION_RUN_REQUESTED'))
  assert.deepEqual(on.mail.sent, [], 'Rodar agora never mails')
})

test('o histórico: da mais nova para a mais velha, 20 por página com next; um page adulterado dá REQUEST_MALFORMED', {
  timeout: 240_000,
}, async (t) => {
  const on = await automating(t)
  const automation = await created(on.hub, on.ana, on.automations, salesSummary([]))
  const url = `${on.automations}/${automation.id}`
  const ran: string[] = []
  for (let each = 0; each < 21; each += 1) {
    const runId = await ranNow(on.hub, on.ana, url)
    await ended(on.hub, on.ana, url, runId)
    ran.push(runId)
  }
  const first = await runsOf(on.hub, on.ana, url)
  assert.equal(first.runs.length, 20)
  assert.deepEqual(
    first.runs.map((each) => each.runId),
    ran.slice(1).reverse(),
  )
  for (const run of first.runs) {
    assert.equal(run.trigger, 'MANUAL')
    assert.equal(run.state.kind, 'DONE')
    assert.match(String(run.state.conversationId), /^[0-9a-f-]{36}$/)
    assert.ok(!Number.isNaN(Date.parse(run.firedAt)))
  }
  const times = first.runs.map((each) => Date.parse(each.firedAt))
  assert.deepEqual(
    times,
    [...times].sort((a, b) => b - a),
  )
  assert.equal(first.next.kind, 'MORE')
  const page = first.next.kind === 'MORE' ? first.next.page : ''
  const second = await runsOf(on.hub, on.ana, url, page)
  assert.deepEqual(
    second.runs.map((each) => each.runId),
    [ran[0]],
  )
  assert.deepEqual(second.next, { kind: 'END' })
  const tampered = await call(on.hub, on.ana, 'GET', `${url}/runs?page=${page}x`)
  assert.equal(tampered.statusCode, 400, tampered.body)
  assert.equal(codeOf(tampered), 'REQUEST_MALFORMED')
})

test('apagar: 204, some da lista, as conversas abertas ficam; apagar de novo dá AUTOMATION_NOT_FOUND', async (t) => {
  const on = await automating(t)
  const automation = await created(on.hub, on.ana, on.automations, salesSummary([]))
  const url = `${on.automations}/${automation.id}`
  const run = await ended(on.hub, on.ana, url, await ranNow(on.hub, on.ana, url))
  const conversation = `${on.assistant}/${String(run.state.conversationId)}`
  const deleted = await call(on.hub, on.ana, 'DELETE', url)
  assert.equal(deleted.statusCode, 204, deleted.body)
  assert.deepEqual(listed(await call(on.hub, on.ana, 'GET', on.automations)), [])
  const kept = await call(on.hub, on.ana, 'GET', conversation)
  assert.equal(kept.statusCode, 200, kept.body)
  assert.deepEqual(Object(kept.json()).conversation.automation, {
    automationId: automation.id,
    name: 'Resumo de vendas',
  })
  const again = await call(on.hub, on.ana, 'DELETE', url)
  assert.equal(again.statusCode, 404, again.body)
  assert.equal(codeOf(again), 'AUTOMATION_NOT_FOUND')
  assert.ok(on.lines.some((line) => line.message === 'AUTOMATION_DELETED'))
})
