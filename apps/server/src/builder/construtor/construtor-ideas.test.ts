import assert from 'node:assert/strict'
import { test } from 'node:test'
import { endOf, sent } from '../conversation/test-conversation.ts'
import { answerTo, ask, cards, untilCard } from '../conversation/test-questions.ts'
import { building } from './test-construtor.ts'

test('as ideias: o Construtor propõe com ask_user, o turno espera a escolha e a resposta o continua', async (t) => {
  const ideas = {
    question: 'Qual agente montar?',
    header: 'Ideias',
    multiSelect: true,
    options: [
      { label: 'Vendas do dia', description: 'Lê os pedidos de ontem' },
      { label: 'Metas', description: 'Compara as vendas com as metas' },
    ],
  }
  const on = await building(t, [() => [ask(ideas)]])
  assert.equal((await sent(on.hub, on.ana, on.url, 'Quero um agente de vendas')).statusCode, 200)
  const { card } = await untilCard(on.conversation.stream, 'question')
  assert.equal(card.toolName, 'ask_user')
  const answers = { kind: 'answers', answers: [['Vendas do dia']] }
  const resumed = await answerTo(on.hub, on.ana, on.url, card.toolCallId, answers)
  assert.equal(resumed.statusCode, 200, resumed.body)
  const rest = await on.conversation.stream.turn()
  assert.equal(endOf(rest), 'complete')
  assert.deepEqual(cards(rest), [], 'the question is not asked again once answered')
})
