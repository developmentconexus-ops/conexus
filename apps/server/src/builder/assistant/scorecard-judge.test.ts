import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { PADARIA_SOL_FILIAL, PADARIA_SOL_MATRIZ, soldBy } from '../../hub/connectors/test-sales.ts'
import { endOf, messagesOf } from '../conversation/test-conversation.ts'
import {
  assisting,
  created,
  helperReading,
  READ,
  researching,
  said,
  talking,
} from './test-assistant.ts'
import type { Question } from './test-scorecard.ts'
import { judged, QUESTIONS, scoreOf } from './test-scorecard.ts'
import { expectedOf } from './test-truths.ts'

function questionOf(n: number): Question {
  const found = QUESTIONS.find((each) => each.n === n)
  if (found === undefined) throw new Error(`No question ${n}.`)
  return found
}

/** What the judge says of each answer the model gives, each in a conversation of its own, over the parts Mastra stores. */
async function judgedAnswers(t: TestContext, answers: readonly (readonly [number, string])[]) {
  const on = await assisting(
    t,
    answers.map(([, text]) => [said(text)]),
  )
  const verdicts: boolean[] = []
  for (const [n, text] of answers) {
    const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
    const events = await (await talking(t, on.hub, on.ana, url)).say(questionOf(n).text)
    assert.equal(endOf(events), 'complete', text)
    const messages = await messagesOf(on.hub, on.ana, url)
    const asked = messages.findLastIndex((message) => message.role === 'person')
    const parts = messages.slice(asked + 1).flatMap((message) => message.parts)
    verdicts.push(judged(questionOf(n), parts, READ))
  }
  return verdicts
}

function money(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

test('o juiz de cada pergunta é a coluna "Certo quando": a resposta com a verdade do dublê é certa e a de número errado ou lista a mais é errada', async (t) => {
  const everySeller = [
    ...soldBy(PADARIA_SOL_MATRIZ, '2026-09'),
    ...soldBy(PADARIA_SOL_FILIAL, '2026-09'),
  ]
  const lines = everySeller.map(([name, total]) => `${name}: R$ ${money(total)}`)
  const biggest = [...soldBy(PADARIA_SOL_FILIAL, '2026-09')].sort((a, b) => b[1] - a[1])[0] ?? [
    '',
    0,
  ]
  const verdicts = await judgedAnswers(t, [
    [1, lines.join('\n')],
    [1, lines.slice(1).join('\n')],
    [2, `${biggest[0]} vendeu R$ ${money(biggest[1])}`],
    [2, `${biggest[0]} vendeu R$ ${money(1)}`],
    [9, 'O Pão de queijo (kg) está zerado.'],
    [9, 'Pão de queijo (kg) e Bolo de fubá estão zerados.'],
    [12, 'Temos 1.300 anúncios ativos.'],
    [12, 'Temos 12 anúncios ativos.'],
    [14, 'Há 9 perguntas sem resposta.'],
  ])
  assert.deepEqual(verdicts, [true, false, true, false, true, false, true, false, true])
  assert.deepEqual(expectedOf(9)?.names, ['PAO DE QUEIJO KG'])
})

test('o placar das perguntas de vendas compara a Matriz e a Filial: a diferença da pergunta 3 é a dos dois totais', () => {
  const sales = expectedOf(3)
  assert.equal(sales?.figures?.length, 3)
  const [matriz, filial, difference] = sales?.figures ?? []
  assert.equal(
    Math.round(Math.abs((matriz ?? 0) - (filial ?? 0)) * 100),
    Math.round((difference ?? 0) * 100),
  )
})

test('o placar conta os ajudantes pelo fim de cada um, não pelas ferramentas que chamaram', async (t) => {
  const on = await assisting(t, [
    [researching('Quantas empresas?')],
    [helperReading()],
    [said('Há 2 empresas.')],
    [said('Há 2 empresas.')],
  ])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const events = await (await talking(t, on.hub, on.ana, url)).say('Quantas empresas a Matriz tem?')
  const messages = await messagesOf(on.hub, on.ana, url)
  const asked = messages.findLastIndex((message) => message.role === 'person')
  const parts = messages.slice(asked + 1).flatMap((message) => message.parts)
  const card = scoreOf({ question: 3, parts, events, right: true })
  assert.equal(card.helpers, 1)
  assert.ok(card.calls >= 2, 'the helper tool counts as a call, the helper itself as one helper')
})
