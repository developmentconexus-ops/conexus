import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { answeredOf, endOf } from './test-conversation.ts'
import {
  answerTo,
  conversingWith,
  invocations,
  PLAN,
  readPlan,
  SUBMIT,
  submitPlan,
  untilCard,
  WRITE_PLAN,
  writePlan,
} from './test-questions.ts'

const Planned = z.object({ title: z.string(), plan: z.string() })

test('submit_plan: fora de `.conexus/plans/` é recusado; no caminho chega o `tool_suspended` do plano; Pedir ajustes devolve o motivo; Aprovar continua', async (t) => {
  const { hub, ana, url, stream, send, calls } = await conversingWith(t, [
    [submitPlan('.conexus/plan.md')],
    [WRITE_PLAN],
    [SUBMIT],
    [SUBMIT],
  ])
  assert.equal((await send()).statusCode, 200)
  const first = await untilCard(stream, 'plan')
  const plan = first.card
  assert.equal(plan.toolName, 'submit_plan')
  const suspended = Planned.parse(plan.suspendPayload)
  assert.deepEqual(
    [suspended.title, suspended.plan.trim()],
    ['App de encomendas', 'Para a pessoa: um cadastro simples.'],
  )
  assert.ok(
    calls.some((each) =>
      each.texts.some((text) => text.includes('Refused: a plan is a .md file directly in')),
    ),
  )
  const rejected = { kind: 'plan', action: 'rejected', feedback: 'Falta o telefone.' }
  assert.equal((await answerTo(hub, ana, url, plan.toolCallId, rejected)).statusCode, 200)
  const second = await untilCard(stream, 'plan')
  assert.ok(
    calls.some((each) =>
      each.texts.some((text) => text.includes('User feedback: Falta o telefone.')),
    ),
  )
  assert.notEqual(second.card.toolCallId, plan.toolCallId)
  const approved = { kind: 'plan', action: 'approved' }
  assert.equal((await answerTo(hub, ana, url, second.card.toolCallId, approved)).statusCode, 200)
  const rest = await stream.turn()
  assert.equal(endOf(rest), 'complete')
  const read = (await answeredOf(hub, ana, url)).flatMap((message) => message.parts)
  assert.deepEqual(
    [plan.toolCallId, second.card.toolCallId].map((id) =>
      invocations(read, id).map((each) => each.state),
    ),
    [['result'], ['result']],
    'read again, both submissions are closed with the decision Mastra kept as their result',
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
  assert.equal((await send()).statusCode, 200)
  const first = await untilCard(stream, 'plan')
  const approved = { kind: 'plan', action: 'approved' }
  assert.equal((await answerTo(hub, ana, url, first.card.toolCallId, approved)).statusCode, 200)
  const second = await untilCard(stream, 'plan')
  assert.equal(Planned.parse(second.card.suspendPayload).plan.trim(), 'Um calendário.')
  assert.ok(
    calls.some((each) => each.texts.some((text) => text.includes(`${PLAN} is an approved plan`))),
  )
  assert.equal((await answerTo(hub, ana, url, second.card.toolCallId, approved)).statusCode, 200)
})
