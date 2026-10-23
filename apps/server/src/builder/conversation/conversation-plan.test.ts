import assert from 'node:assert/strict'
import { test } from 'node:test'
import { post } from '../../hub/identity/test-hub.ts'
import { answeredOf } from './test-conversation.ts'
import {
  answerUrl,
  conversingWith,
  PLAN,
  readPlan,
  SUBMIT,
  submitPlan,
  tool,
  untilCard,
  WRITE_PLAN,
  writePlan,
} from './test-questions.ts'

test('submit_plan: fora de `.conexus/plans/` é recusado; no caminho chega a parte `plan`; Pedir ajustes devolve o motivo; Aprovar continua', async (t) => {
  const { hub, ana, url, stream, send, calls } = await conversingWith(t, [
    [submitPlan('.conexus/plan.md')],
    [WRITE_PLAN],
    [SUBMIT],
    [SUBMIT],
  ])
  assert.equal((await send()).statusCode, 202)
  const first = await untilCard(stream, 'plan')
  const plan = first.card
  assert.ok(plan.type === 'plan')
  assert.deepEqual(
    [plan.title, plan.plan.trim()],
    ['App de encomendas', 'Para a pessoa: um cadastro simples.'],
  )
  assert.ok(
    calls.some((each) =>
      each.texts.some((text) => text.includes('Refused: a plan is a .md file directly in')),
    ),
  )
  const rejected = { kind: 'plan', action: 'rejected', feedback: 'Falta o telefone.' }
  assert.equal((await post(hub, ana, answerUrl(url, plan.toolCallId), rejected)).statusCode, 202)
  const second = await untilCard(stream, 'plan')
  assert.ok(
    calls.some((each) =>
      each.texts.some((text) => text.includes('User feedback: Falta o telefone.')),
    ),
  )
  assert.notEqual(second.card.toolCallId, plan.toolCallId)
  const approved = { kind: 'plan', action: 'approved' }
  assert.equal(
    (await post(hub, ana, answerUrl(url, second.card.toolCallId), approved)).statusCode,
    202,
  )
  const rest = await stream.turn()
  assert.deepEqual(rest.at(-1), { type: 'turnEnd', reason: 'complete' })
  const read = (await answeredOf(hub, ana, url)).flatMap((message) => message.parts)
  assert.deepEqual(
    read.flatMap((part) => (part.type === 'plan' ? [[part.title, part.state]] : [])),
    [
      ['App de encomendas', 'rejected'],
      ['App de encomendas', 'approved'],
    ],
  )
})

test('submit_plan: o plano aprovado não é reescrito nem reenviado; outro plano, em outro arquivo, abre o cartão', async (t) => {
  const other = '.conexus/plans/calendario.md'
  const { hub, ana, url, stream, send, calls } = await conversingWith(t, [
    [WRITE_PLAN],
    [SUBMIT],
    [readPlan],
    [writePlan(PLAN, 'Outro texto.')],
    [SUBMIT],
    [writePlan(other, 'Um calendário.')],
    [submitPlan(other)],
  ])
  assert.equal((await send()).statusCode, 202)
  const first = await untilCard(stream, 'plan')
  const approved = { kind: 'plan', action: 'approved' }
  assert.equal(
    (await post(hub, ana, answerUrl(url, first.card.toolCallId), approved)).statusCode,
    202,
  )
  const second = await untilCard(stream, 'plan')
  assert.ok(second.card.type === 'plan')
  assert.equal(second.card.plan.trim(), 'Um calendário.')
  assert.ok(
    calls.some((each) => each.texts.some((text) => text.includes(`${PLAN} is an approved plan`))),
  )
  assert.equal(
    (await post(hub, ana, answerUrl(url, second.card.toolCallId), approved)).statusCode,
    202,
  )
})

test('submit_plan: depois de uma escrita do plano que falhou, é recusado e não abre cartão', async (t) => {
  const failed = tool('mastra_workspace_edit_file', {
    path: PLAN,
    old_string: 'texto que não está no plano',
    new_string: 'novo',
  })
  const { hub, ana, url, stream, send, calls } = await conversingWith(t, [
    [WRITE_PLAN],
    [failed],
    [SUBMIT],
    [readPlan],
    [WRITE_PLAN],
    [SUBMIT],
  ])
  assert.equal((await send()).statusCode, 202)
  const card = await untilCard(stream, 'plan')
  assert.ok(
    calls.some((each) => each.texts.some((text) => text.includes('the last write to'))),
    'the refusal came first',
  )
  assert.equal(
    card.events.filter((event) => event.type === 'part' && event.part.type === 'plan').length,
    1,
  )
  assert.equal(
    (
      await post(hub, ana, answerUrl(url, card.card.toolCallId), {
        kind: 'plan',
        action: 'approved',
      })
    ).statusCode,
    202,
  )
})
