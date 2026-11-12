import assert from 'node:assert/strict'
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { REDIRECT_PATH } from '@conexus/hub-api'
import type { MastraMessagePart } from '@mastra/core/agent-controller'
import {
  appsOf,
  linkMercadoLivre,
  mercadoLivreFake,
} from '../../hub/connectors/test-connections.ts'
import { PADARIA_SOL_FILIAL, PADARIA_SOL_MATRIZ, soldBy } from '../../hub/connectors/test-sales.ts'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import { endOf, messagesOf } from '../conversation/test-conversation.ts'
import {
  assisting,
  created,
  helperReading,
  READ,
  reading,
  researching,
  said,
  searching,
  talking,
} from './test-assistant.ts'
import { file, pdf } from './test-files.ts'
import { REAL_MODEL, subscribed } from './test-real-model.ts'
import type { Question, Scorecard } from './test-scorecard.ts'
import { judged, QUESTIONS, scoreOf } from './test-scorecard.ts'
import { expectedOf, goalsSheet } from './test-truths.ts'

/** The folder of a round's scorecards, outside the repository: one JSON per question. */
function roundFolder(t: TestContext): string {
  const folder = mkdtempSync(join(tmpdir(), 'conexus-scorecard-'))
  t.after(() => rmSync(folder, { recursive: true, force: true }))
  return folder
}

test('o placar conta o turno: uma leitura repetida e uma ferramenta que falhou dão repeated 1 e errors 1, e o placar vai num JSON por pergunta fora do repositório', async (t) => {
  const on = await assisting(t, [
    [searching()],
    [reading('Matriz')],
    [reading('Matriz')],
    [reading('Inexistente')],
    [said('Pronto.')],
  ])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const events = await (await talking(t, on.hub, on.ana, url)).say('Quantas empresas?')
  assert.equal(endOf(events), 'complete')
  const messages = await messagesOf(on.hub, on.ana, url)
  const asked = messages.findLastIndex((message) => message.role === 'person')
  const parts: MastraMessagePart[] = messages.slice(asked + 1).flatMap((message) => message.parts)
  const card = scoreOf({ question: 1, parts, events, right: true })
  assert.deepEqual(card, {
    question: 1,
    right: true,
    calls: 4,
    errors: 1,
    repeated: 1,
    firstStepTokens: card.firstStepTokens,
    helpers: 0,
  })
  const folder = roundFolder(t)
  writeFileSync(join(folder, 'pergunta-1.json'), JSON.stringify(card, null, 2))
  const written: Scorecard = JSON.parse(readFileSync(join(folder, 'pergunta-1.json'), 'utf8'))
  assert.deepEqual(written, card)
  assert.deepEqual(readdirSync(folder), ['pergunta-1.json'])
})

test('cada pergunta tem os seus dados: as 27 do fundador, numeradas, cada uma com os dados que um dublê dá e o que torna a resposta certa', () => {
  assert.deepEqual(
    QUESTIONS.map((each) => each.n),
    Array.from({ length: 27 }, (_, at) => at + 1),
  )
  for (const each of QUESTIONS) {
    assert.ok(each.text.length > 0 && each.right.length > 0 && each.data.length > 0, String(each.n))
  }
  assert.deepEqual(
    QUESTIONS.filter((each) => each.enters !== 'now').map((each) => [each.n, each.enters]),
    [
      [26, 'U7'],
      [27, 'U9'],
    ],
  )
  assert.ok([...soldBy(PADARIA_SOL_MATRIZ, '2026-09').values()].length > 0)
  assert.equal(goalsSheet().split('\n').length, 201)
  assert.equal(goalsSheet().split('\n')[0]?.split(',').length, 3)
})

test('o modelo de verdade, a lista inteira: cada pergunta numa conversa nova, o placar com os tokens do primeiro passo, e a resposta errada só conta', {
  timeout: 10_800_000,
}, async (t) => {
  if (REAL_MODEL === undefined) {
    t.skip(
      'opt-in: set CONEXUS_EVAL_REAL_MODEL to a folder (and the credential switch the other real cases use); firstmate runs it and attaches the scorecard JSONs',
    )
    return
  }
  const ml = mercadoLivreFake({ redirectUri: `${TEST_ORIGIN}${REDIRECT_PATH}` })
  const served = await ml.serve()
  t.after(() => served.close())
  const on = await subscribed(t, REAL_MODEL, 'claude', (config) => ({
    ...config,
    connectorOrigins: new Map([['mercado-livre', served.origin]]),
    connectorApps: appsOf(ml.app),
  }))
  const linked = await linkMercadoLivre(on.hub, on.ana, on.companyId)
  assert.equal(linked.statusCode, 200, linked.body)
  const loja = String(Object(linked.json()).connection.id)
  const folder = roundFolder(t)
  const sheet = file('metas.csv', 'text/csv', Buffer.from(goalsSheet()))
  for (const each of QUESTIONS.filter((one) => one.enters === 'now')) {
    const connections = each.bare === true ? [] : [on.matriz, on.filial, loja]
    const url = await created(on.hub, on.ana, on.assistant, { connections })
    const files = attached(each, sheet)
    const events = await (await talking(t, on.hub, on.ana, url)).say(each.text, files)
    const messages = await messagesOf(on.hub, on.ana, url)
    const asked = messages.findLastIndex((message) => message.role === 'person')
    const parts: MastraMessagePart[] = messages.slice(asked + 1).flatMap((message) => message.parts)
    const right = endOf(events) === 'complete' && judged(each, parts, READ)
    const card = scoreOf({ question: each.n, parts, events, right })
    writeFileSync(join(folder, `pergunta-${each.n}.json`), JSON.stringify(card, null, 2))
  }
  assert.equal(readdirSync(folder).length, QUESTIONS.filter((one) => one.enters === 'now').length)
  process.stdout.write(`placar em ${folder}\n`)
})

function attached(each: Question, sheet: ReturnType<typeof file>) {
  if (each.data.includes('AQ')) return [pdf]
  if (each.data.includes('PL')) return [sheet]
  return []
}

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
