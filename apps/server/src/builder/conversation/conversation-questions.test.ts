import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { answeredOf, endOf } from './test-conversation.ts'
import { partsOf } from './test-parts.ts'
import {
  answerTo,
  ask,
  cards,
  conversingWith,
  invocations,
  untilCard,
  WHO,
} from './test-questions.ts'

const Asked = z.object({ questions: z.array(z.object({ question: z.string() })) })

test('ask_user com 1 a 4 perguntas: a volta espera, o `tool_suspended` chega e a resposta a continua', async (t) => {
  const { hub, ana, url, stream, send, calls } = await conversingWith(t, [[ask(WHO)]])
  assert.equal((await send()).statusCode, 200)
  const { card } = await untilCard(stream, 'question')
  assert.equal(card.toolName, 'ask_user')
  assert.deepEqual(
    Asked.parse(card.suspendPayload).questions.map((each) => each.question),
    [WHO.question],
  )
  const answers = { kind: 'answers', answers: ['Todos (recomendado)'] }
  const answered = await answerTo(hub, ana, url, card.toolCallId, answers)
  assert.equal(answered.statusCode, 200, answered.body)
  const rest = await stream.turn()
  assert.equal(endOf(rest), 'complete')
  assert.deepEqual(cards(rest), [], 'the call is not asked again once answered')
  const told = invocations(partsOf(rest), card.toolCallId).at(-1)
  assert.equal(told?.state, 'result')
  assert.deepEqual(told.result, {
    content: `User answered:\n${WHO.question}: Todos (recomendado)`,
    answers: ['Todos (recomendado)'],
  })
  const given = calls[1]?.texts.join('\n') ?? ''
  assert.ok(given.includes(`User answered:\n${WHO.question}: Todos (recomendado)`), given)
  assert.ok(
    !given.includes('"answers"'),
    'the model reads the lines, not the result kept for the card',
  )
  const read = (await answeredOf(hub, ana, url)).flatMap((message) => message.parts)
  assert.deepEqual(
    invocations(read, card.toolCallId).map((each) => [each.state, each.result]),
    [[told.state, told.result]],
    'read again, the call holds the answers Mastra kept as its result',
  )
})

test('ask_user com 5 perguntas ou `multiSelect` sem opções: recusado ao modelo, sem cartão', async (t) => {
  const five = Array.from({ length: 5 }, (_, index) => ({ question: `Pergunta ${index}?` }))
  const noOptions = { question: 'Quais dias?', multiSelect: true }
  const { stream, send } = await conversingWith(t, [[ask(...five)], [ask(noOptions)]])
  assert.equal((await send()).statusCode, 200)
  const events = await stream.turn()
  assert.deepEqual(cards(events), [])
  assert.equal(endOf(events), 'complete')
})
