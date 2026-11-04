import assert from 'node:assert/strict'
import { test } from 'node:test'
import { endOf, sent } from '../conversation/test-conversation.ts'
import { answerTo, ask, cards, untilCard } from '../conversation/test-questions.ts'
import { building } from './test-construtor.ts'

test('a pergunta: o Construtor pergunta com ask_user, o turno espera a resposta e ela o continua', async (t) => {
  const question = {
    question: 'Qual ligação o agente lê?',
    header: 'Ligação',
    multiSelect: false,
    options: [
      { label: 'Pedidos', description: 'Lê os pedidos de ontem' },
      { label: 'Metas', description: 'Lê as metas do mês' },
    ],
  }
  const on = await building(t, [() => [ask(question)]])
  assert.equal((await sent(on.hub, on.ana, on.url, 'Quero um agente de vendas')).statusCode, 200)
  const { card } = await untilCard(on.conversation.stream, 'question')
  assert.equal(card.toolName, 'ask_user')
  const answers = { kind: 'answers', answers: [['Pedidos']] }
  const resumed = await answerTo(on.hub, on.ana, on.url, card.toolCallId, answers)
  assert.equal(resumed.statusCode, 200, resumed.body)
  const rest = await on.conversation.stream.turn()
  assert.equal(endOf(rest), 'complete')
  assert.deepEqual(cards(rest), [], 'the question is not asked again once answered')
})
