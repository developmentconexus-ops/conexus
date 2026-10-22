import assert from 'node:assert/strict'
import { test } from 'node:test'
import { memberOn, post } from '../../hub/identity/test-hub.ts'
import { answeredOf } from './test-conversation.ts'
import { answerUrl, ask, cards, conversingWith, untilCard, WHO } from './test-questions.ts'

test('ask_user com 1 a 4 perguntas: a volta espera, a parte `question` chega e a resposta a continua', async (t) => {
  const { hub, ana, url, stream, send, calls } = await conversingWith(t, [[ask(WHO)]])
  assert.equal((await send()).statusCode, 202)
  const { card } = await untilCard(stream, 'question')
  assert.equal(card.type, 'question')
  assert.deepEqual(
    card.type === 'question' && card.questions.map((each) => [each.kind, each.question]),
    [['choice', WHO.question]],
  )
  const answers = { kind: 'answers', answers: ['Todos (recomendado)'] }
  const answered = await post(hub, ana, answerUrl(url, card.toolCallId), answers)
  assert.equal(answered.statusCode, 202, answered.body)
  const rest = await stream.turn()
  assert.deepEqual(rest.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.equal(cards(rest).at(-1)?.state, 'answered')
  assert.ok(calls[1]?.texts.some((text) => text.includes('User answered')))
  const read = (await answeredOf(hub, ana, url)).flatMap((message) => message.parts)
  assert.deepEqual(
    read.flatMap((part) => (part.type === 'question' ? [part.state] : [])),
    ['answered'],
  )
})

test('ask_user com 5 perguntas ou `multiSelect` sem opções: recusado ao modelo, sem cartão', async (t) => {
  const five = Array.from({ length: 5 }, (_, index) => ({ question: `Pergunta ${index}?` }))
  const noOptions = { question: 'Quais dias?', multiSelect: true }
  const { stream, send } = await conversingWith(t, [[ask(...five)], [ask(noOptions)]])
  assert.equal((await send()).statusCode, 202)
  const events = await stream.turn()
  assert.deepEqual(cards(events), [])
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
})

test('responder: dono da Conversa, uma vez, com as respostas certas; outra pessoa ou empresa: 404', async (t) => {
  const { hub, ana, url, stream, send, companyId, projectId } = await conversingWith(t, [
    [ask(WHO, { question: 'Que cor?' })],
  ])
  assert.equal((await send()).statusCode, 202)
  const { card } = await untilCard(stream, 'question')
  const where = answerUrl(url, card.toolCallId)
  const bruno = await memberOn(
    hub,
    companyId,
    { name: 'Bruno Reis', email: 'bruno@example.test' },
    'admin',
  )
  const other = await post(hub, bruno, where, { kind: 'answers', answers: ['a', 'b'] })
  assert.equal(other.statusCode, 404)
  const elsewhere = `/api/companies/${companyId}x/projects/${projectId}/conversations/${url.split('/').at(-1)}/questions/${card.toolCallId}`
  assert.equal(
    (await post(hub, ana, elsewhere, { kind: 'answers', answers: ['a', 'b'] })).statusCode,
    404,
  )
  for (const answers of [['a'], ['a', 'b', 'c'], ['a', ['b']]]) {
    const wrong = await post(hub, ana, where, { kind: 'answers', answers })
    assert.equal(wrong.statusCode, 422, wrong.body)
    assert.equal(Object(wrong.json()).code, 'QUESTION_ANSWERS_INVALID')
  }
  const plan = await post(hub, ana, where, { kind: 'plan', action: 'approved' })
  assert.equal(plan.statusCode, 422)
  const right = await post(hub, ana, where, { kind: 'answers', answers: ['a', 'b'] })
  assert.equal(right.statusCode, 202, right.body)
  const again = await post(hub, ana, where, { kind: 'answers', answers: ['a', 'b'] })
  assert.equal(again.statusCode, 409)
  assert.equal(Object(again.json()).code, 'QUESTION_CLOSED')
  assert.deepEqual((await stream.turn()).at(-1), { type: 'turnEnd', reason: 'complete' })
  const closed = await post(hub, ana, answerUrl(url, 'toolu_outra'), {
    kind: 'answers',
    answers: ['a'],
  })
  assert.equal(Object(closed.json()).code, 'QUESTION_CLOSED')
})
