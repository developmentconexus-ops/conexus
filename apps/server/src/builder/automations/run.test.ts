import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { call, codeOf, memberOn, post } from '../../hub/identity/test-hub.ts'
import { bellOf } from '../../hub/notifications/test-notifications.ts'
import type { Reply } from '../../platform/test-anthropic.ts'
import { reading, talking } from '../assistant/test-assistant.ts'
import {
  endOf,
  holding,
  messagesOf,
  PARTIAL,
  settledOf,
  title,
} from '../conversation/test-conversation.ts'
import { failuresIn } from '../conversation/test-parts.ts'
import { tool } from '../conversation/test-questions.ts'
import { AUTOMATION_WORKFLOW } from './public.ts'
import {
  aMinuteAhead,
  answering,
  automating,
  choiceOf,
  conversing,
  created,
  dyingHub,
  ended,
  ranNow,
  runsOf,
  salesSummary,
} from './test-automations.ts'

const BIA = { name: 'Bia Souza', email: 'bia@example.test' }
const PROMPT = 'O resumo de vendas de ontem, por vendedor.'
/** Mastra's ownership lease of a run and of a thread (`MASTRA_AGENT_THREAD_LEASE_TTL_MS`, 15 s), and a margin. */
const LEASE_MS = 16_000

/** The person's questions in the conversation, in order. */
async function questionsIn(hub: Hub, person: Person, url: string): Promise<string[]> {
  const messages = await messagesOf(hub, person, url)
  return messages
    .filter((message) => message.role === 'person')
    .flatMap((message) =>
      message.parts.flatMap((part) => (part.type === 'text' ? [part.text] : [])),
    )
}

test('o horário: a agenda dispara no minuto; uma conversa do dono com o pedido, as marcas e as ligações; SCHEDULED e DONE; a pausada ao lado não roda', {
  timeout: 150_000,
}, async (t) => {
  const on = await automating(t)
  const cadence = await aMinuteAhead()
  const body = salesSummary([on.matriz], { cadence, projectId: on.projectId })
  const automation = await created(on.hub, on.ana, on.automations, body)
  const sibling = await created(on.hub, on.ana, on.automations, { ...body, name: 'Pausada' })
  const siblingUrl = `${on.automations}/${sibling.id}`
  assert.equal((await post(on.hub, on.ana, `${siblingUrl}/pause`, {})).statusCode, 200)

  const run = await ended(on.hub, on.ana, `${on.automations}/${automation.id}`)
  assert.equal(run.trigger, 'SCHEDULED')
  assert.equal(run.state.kind, 'DONE')
  const conversation = `${on.assistant}/${String(run.state.conversationId)}`
  const read = await call(on.hub, on.ana, 'GET', conversation)
  assert.equal(read.statusCode, 200, read.body)
  const shown = Object(read.json()).conversation
  assert.deepEqual(shown.automation, { automationId: automation.id, name: 'Resumo de vendas' })
  assert.equal(shown.projectId, on.projectId)
  assert.deepEqual(choiceOf(shown.connections), [['Matriz', true]])
  assert.deepEqual(await questionsIn(on.hub, on.ana, conversation), [PROMPT])
  const listed = Object((await call(on.hub, on.ana, 'GET', on.assistant)).json()).conversations
  assert.equal(listed.length, 1)
  assert.deepEqual((await runsOf(on.hub, on.ana, siblingUrl)).runs, [])
  const bell = await bellOf(on.hub, on.ana, on.company)
  assert.deepEqual(
    bell.notifications.map((each) => [each.kind, each.conversationId]),
    [['AUTOMATION_DONE', run.state.conversationId]],
  )
})

test('a conversa continua: a conversa da execução está na lista com a automação, abre pela rota e responde uma segunda pergunta', async (t) => {
  const on = await automating(t)
  const automation = await created(on.hub, on.ana, on.automations, salesSummary([on.matriz]))
  const url = `${on.automations}/${automation.id}`
  const run = await ended(on.hub, on.ana, url, await ranNow(on.hub, on.ana, url))
  assert.equal(run.state.kind, 'DONE')
  const listed = Object((await call(on.hub, on.ana, 'GET', on.assistant)).json()).conversations
  assert.deepEqual(
    listed.map((each: { id: string; automation: unknown }) => [each.id, each.automation]),
    [[run.state.conversationId, { automationId: automation.id, name: 'Resumo de vendas' }]],
  )
  const conversation = `${on.assistant}/${String(run.state.conversationId)}`
  const { say } = await talking(t, on.hub, on.ana, conversation)
  assert.equal(endOf(await say('E por região?')), 'complete')
  assert.deepEqual(await questionsIn(on.hub, on.ana, conversation), [PROMPT, 'E por região?'])
})

test('as ligações de hoje: uma ligação que o Projeto perdeu depois da criação fica fora da conversa, e a execução termina DONE', async (t) => {
  const on = await automating(t, [[reading('Matriz')]])
  const body = salesSummary([on.matriz], { projectId: on.projectId })
  const automation = await created(on.hub, on.ana, on.automations, body)
  const released = `${on.company}/projects/${on.projectId}/connections/${on.matriz}`
  const withdrawn = await call(on.hub, on.ana, 'DELETE', released)
  assert.equal(withdrawn.statusCode, 204, withdrawn.body)
  const url = `${on.automations}/${automation.id}`
  const run = await ended(on.hub, on.ana, url, await ranNow(on.hub, on.ana, url))
  assert.equal(run.state.kind, 'DONE')
  const conversation = `${on.assistant}/${String(run.state.conversationId)}`
  const read = await call(on.hub, on.ana, 'GET', conversation)
  assert.deepEqual(Object(read.json()).conversation.connections, [])
  assert.deepEqual(on.reads, [])
  assert.equal((await call(on.hub, on.ana, 'PUT', released)).statusCode, 200)
  const again = Object((await call(on.hub, on.ana, 'GET', conversation)).json()).conversation
  assert.deepEqual(choiceOf(again.connections), [['Matriz', false]])
})

test('a falha do turno: o modelo fora e a conta recusada terminam FAILED com o código que a conversa mostra', async (t) => {
  for (const [status, code] of [
    [529, 'MODEL_CALL_FAILED'],
    [401, 'MODEL_NO_ACCOUNT'],
  ] as const) {
    const on = await automating(t, (asked) => title(asked) ?? { kind: 'refuse', status })
    const automation = await created(on.hub, on.ana, on.automations, salesSummary([]))
    const url = `${on.automations}/${automation.id}`
    const run = await ended(on.hub, on.ana, url, await ranNow(on.hub, on.ana, url))
    assert.equal(run.state.kind, 'FAILED')
    assert.equal(run.state.code, code)
    const conversation = `${on.assistant}/${String(run.state.conversationId)}`
    const parts = (await settledOf(on.hub, on.ana, conversation)).flatMap((each) => each.parts)
    assert.deepEqual(failuresIn(parts), [code])
    assert.ok(on.lines.some((line) => line.message === 'AUTOMATION_RUN_FAILED'))
  }
})

test('a falha do turno: o turno que passa do orçamento é abortado, FAILED com INTERRUPTED, e a parte respondida fica', async (t) => {
  const held = holding(t)
  const on = await automating(t, answering([held.reply]), 2_000)
  const automation = await created(on.hub, on.ana, on.automations, salesSummary([]))
  const url = `${on.automations}/${automation.id}`
  const run = await ended(on.hub, on.ana, url, await ranNow(on.hub, on.ana, url))
  assert.equal(run.state.kind, 'FAILED')
  assert.equal(run.state.code, 'INTERRUPTED')
  const conversation = `${on.assistant}/${String(run.state.conversationId)}`
  const messages = await settledOf(on.hub, on.ana, conversation)
  const said = messages.filter((each) => each.role === 'builder').flatMap((each) => each.parts)
  assert.ok(said.some((part) => part.type === 'text' && part.text === PARTIAL))
})

test('a falha do turno: sem conta para o modelo padrão, FAILED com MODEL_NO_ACCOUNT antes do turno, sem conversa', async (t) => {
  const on = await automating(t)
  const automation = await created(on.hub, on.ana, on.automations, salesSummary([]))
  const accounts = `${on.company}/model-accounts`
  const { company } = Object((await call(on.hub, on.ana, 'GET', accounts)).json())
  for (const account of company) {
    const removed = await call(on.hub, on.ana, 'DELETE', `${accounts}/${account.id}`)
    assert.equal(removed.statusCode, 204, removed.body)
  }
  const url = `${on.automations}/${automation.id}`
  const run = await ended(on.hub, on.ana, url, await ranNow(on.hub, on.ana, url))
  assert.deepEqual(run.state, { kind: 'FAILED', code: 'MODEL_NO_ACCOUNT', conversationId: null })
  const listed = Object((await call(on.hub, on.ana, 'GET', on.assistant)).json()).conversations
  assert.deepEqual(listed, [])
})

test('o dono virou membro: o disparo não abre conversa, SKIPPED com OWNER_CANNOT_ASK, e a automação fica PAUSED', {
  timeout: 150_000,
}, async (t) => {
  const on = await automating(t)
  const bia = await memberOn(on.hub, on.companyId, BIA, 'admin')
  const cadence = await aMinuteAhead()
  const automation = await created(on.hub, bia, on.automations, salesSummary([], { cadence }))
  function role(to: string, from: string) {
    return call(on.hub, on.ana, 'PUT', `${on.company}/members/${bia.id}`, { role: to, from })
  }
  assert.equal((await role('member', 'admin')).statusCode, 200)
  const asMember = await post(on.hub, bia, `${on.automations}/${automation.id}/run`, {})
  assert.deepEqual([asMember.statusCode, codeOf(asMember)], [404, 'NOT_FOUND'])
  const deadline = Date.now() + 90_000
  async function paused() {
    const { notifications } = await bellOf(on.hub, bia, on.company)
    return notifications.some((each) => each.kind === 'AUTOMATION_PAUSED')
  }
  while (!(await paused()) && Date.now() < deadline) await sleep(200)
  assert.ok(await paused(), 'the run ended SKIPPED and told its owner')
  assert.equal((await role('admin', 'member')).statusCode, 200)
  const [run] = (await runsOf(on.hub, bia, `${on.automations}/${automation.id}`)).runs
  assert.equal(run?.trigger, 'SCHEDULED')
  assert.deepEqual(run?.state, { kind: 'SKIPPED', reason: 'OWNER_CANNOT_ASK' })
  const [listed] = Object((await call(on.hub, bia, 'GET', on.automations)).json()).automations
  assert.equal(listed.state, 'PAUSED')
  const conversations = Object((await call(on.hub, bia, 'GET', on.assistant)).json()).conversations
  assert.deepEqual(conversations, [])
})

test('uma pergunta só: o passo refeito no mesmo runId, por outro Hub depois do arrendamento, acha a pergunta e não a manda de novo', {
  timeout: 150_000,
}, async (t) => {
  const held = holding(t)
  const overview: Reply = { kind: 'blocks', blocks: [tool('conexus_overview', {})] }
  const on = await automating(t, answering([overview, held.reply]))
  const dying = await dyingHub(t, on.hub)
  const automation = await created(on.hub, on.ana, on.automations, salesSummary([]))
  const url = `${on.automations}/${automation.id}`
  const runId = await ranNow(dying.hub, on.ana, url)
  const running = await conversing(on.hub, on.ana, url, runId)
  while (on.calls.length < 2) await sleep(50)
  await dying.die()
  await sleep(LEASE_MS)
  const workflow = on.hub.mastra.getWorkflow(AUTOMATION_WORKFLOW)
  await (await workflow.createRun({ runId })).restart()
  const run = await ended(on.hub, on.ana, url, runId)
  assert.deepEqual(run.state, {
    kind: 'FAILED',
    code: 'INTERRUPTED',
    conversationId: running.state.conversationId,
  })
  assert.equal(on.calls.length, 2, 'the model was not asked again')
  const conversation = `${on.assistant}/${String(running.state.conversationId)}`
  assert.deepEqual(await questionsIn(on.hub, on.ana, conversation), [PROMPT])
})
