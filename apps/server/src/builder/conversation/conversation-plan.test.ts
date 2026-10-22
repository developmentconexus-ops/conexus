import assert from 'node:assert/strict'
import { test } from 'node:test'
import { post } from '../../hub/identity/test-hub.ts'
import { answeredOf } from './test-conversation.ts'
import { answerUrl, conversingWith, SUBMIT, tool, untilCard, WRITE_PLAN } from './test-questions.ts'

test('submit_plan: fora de `.conexus/plan.md` é recusado; no caminho chega a parte `plan`; Pedir ajustes devolve o motivo; Aprovar continua', async (t) => {
  const elsewhere = tool('submit_plan', { path: 'outro.md' })
  const { hub, ana, url, stream, send, calls } = await conversingWith(t, [
    [elsewhere],
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
    calls.some((each) => each.texts.some((text) => text.includes('Refused: the plan lives in'))),
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
