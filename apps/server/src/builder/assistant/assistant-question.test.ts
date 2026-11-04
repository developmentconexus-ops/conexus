import assert from 'node:assert/strict'
import { test } from 'node:test'
import { endOf, sent } from '../conversation/test-conversation.ts'
import { answerTo, ask, cards, untilCard } from '../conversation/test-questions.ts'
import { assisting, created, talking } from './test-assistant.ts'

const question = {
  question: 'Qual ligação o resumo lê?',
  header: 'Ligação',
  multiSelect: false,
  options: [
    { label: 'Pedidos', description: 'Lê os pedidos de ontem' },
    { label: 'Metas', description: 'Lê as metas do mês' },
  ],
}

for (const [place, inProject] of [
  ['no Início', false],
  ['dentro de um Projeto', true],
] as const) {
  test(`a pergunta ${place}: o Assistente pergunta com ask_user, o turno espera a resposta e ela o continua`, async (t) => {
    const on = await assisting(t, [[ask(question)]])
    const url = await created(on.hub, on.ana, on.assistant, {
      ...(inProject ? { projectId: on.projectId } : {}),
      connections: [on.matriz],
    })
    const { stream } = await talking(t, on.hub, on.ana, url)
    assert.equal((await sent(on.hub, on.ana, url, 'Faça um resumo de vendas')).statusCode, 200)
    const { card } = await untilCard(stream, 'question')
    assert.equal(card.toolName, 'ask_user')
    const answers = { kind: 'answers', answers: [['Pedidos']] }
    const resumed = await answerTo(on.hub, on.ana, url, card.toolCallId, answers)
    assert.equal(resumed.statusCode, 200, resumed.body)
    const rest = await stream.turn()
    assert.equal(endOf(rest), 'complete')
    assert.deepEqual(cards(rest), [], 'the question is not asked again once answered')
  })
}
