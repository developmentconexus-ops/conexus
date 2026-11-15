import type { MastraMessagePart } from '@mastra/client-js'
import { expect, test } from 'vitest'
import { seenBy } from './approval-item.ts'
import type { Message } from './messages.ts'
import { itemsOf } from './rows.ts'
import { OPENED } from './session-state.ts'
import { nulledQuestionPart, QUESTION_NULLED_ANSWERS } from './tool-fixtures.ts'

const view = { suspended: {}, approval: seenBy(OPENED), running: {}, heard: {}, live: false }

function builder(id: string, parts: MastraMessagePart[]): Message {
  return {
    id,
    role: 'builder',
    model: null,
    origin: null,
    createdAt: '2026-11-12T00:00:00.000Z',
    parts,
  }
}

function questionCards(messages: Message[]) {
  return itemsOf(messages, view).flatMap((item) =>
    item.kind === 'card' && item.cardKind === 'question'
      ? [{ state: item.state, questions: item.questions.length, answers: item.answers }]
      : [],
  )
}

test('a pergunta respondida do GPT Luna conta as perguntas, ao vivo: a chamada traz `null` e o resultado vem sem os argumentos', () => {
  const cards = questionCards([
    builder('m1', [nulledQuestionPart('call')]),
    builder('m2', [nulledQuestionPart('result', {})]),
  ])
  expect(cards).toEqual([{ state: 'answered', questions: 2, answers: QUESTION_NULLED_ANSWERS }])
})

test('a pergunta respondida do GPT Luna conta as perguntas, relida: os argumentos guardados trazem `null`', () => {
  const cards = questionCards([builder('m1', [nulledQuestionPart('result')])])
  expect(cards).toEqual([{ state: 'answered', questions: 2, answers: QUESTION_NULLED_ANSWERS }])
})

test('o `null` vira campo ausente: a pergunta lida tem o mesmo desenho que a do modelo que omite', () => {
  const [card] = itemsOf([builder('m1', [nulledQuestionPart('result')])], view)
  expect(card).toMatchObject({
    questions: [
      {
        question: 'Quem cadastra as encomendas?',
        options: [{ label: 'Todos (recomendado)' }, { label: 'Só eu' }],
        multiSelect: false,
      },
      { question: 'Quais dias?', header: 'Dias', options: [], multiSelect: false },
    ],
  })
})

test('o que não é `null` e não cabe no contrato continua recusado, sem cartão com perguntas', () => {
  const broken = { questions: [{ question: 42, header: null }] }
  const cards = questionCards([builder('m1', [nulledQuestionPart('result', broken)])])
  expect(cards).toEqual([{ state: 'answered', questions: 0, answers: QUESTION_NULLED_ANSWERS }])
})
