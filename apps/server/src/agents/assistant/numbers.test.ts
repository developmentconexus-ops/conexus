import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { PADARIA_SOL_FILIAL, PADARIA_SOL_MATRIZ, soldBy } from '../../hub/connectors/test-sales.ts'
import { nativeRecording } from '../../platform/test-recordings.ts'
import { numbersFromReads } from './test-numbers.ts'

const Stored = z.object({
  role: z.string(),
  content: z.object({ parts: z.array(z.looseObject({ type: z.string() })) }),
})

/** The `reads` turn as Mastra stored it: the question, and the parts of the answer (a read, then the text). */
function recordedTurn() {
  const messages = nativeRecording('reads')
    .rows.filter((row) => row.table === 'message')
    .map((row) => Stored.parse(row.row))
  const question = messages.find((each) => each.role !== 'assistant')
  const answer = messages.find((each) => each.role === 'assistant')
  const said = question?.content.parts.find((part) => part.type === 'text')
  return { question: String(said?.text), parts: answer?.content.parts ?? [] }
}

/** The recorded turn with its final text replaced by `text`: the same parts Mastra stored, another answer. */
function answering(text: string) {
  const turn = recordedTurn()
  const parts = structuredClone(turn.parts)
  const last = parts.findLastIndex((part) => part.type === 'text')
  parts[last] = { ...parts[last], type: 'text', text }
  return { ...turn, parts }
}

const MATRIZ = [...soldBy(PADARIA_SOL_MATRIZ, '2026-09').values()]
const FILIAL = [...soldBy(PADARIA_SOL_FILIAL, '2026-09').values()]

test('a conferência aprova a resposta gravada: cada número está na leitura do turno e bate com o dublê', () => {
  assert.deepEqual(numbersFromReads({ ...recordedTurn(), truth: MATRIZ }), { ok: true })
})

test('a conferência recusa um número que nenhuma leitura trouxe, ou que não bate com o dublê, e diz qual', () => {
  assert.deepEqual(
    numbersFromReads({ ...answering('JOAO vendeu R$ 8.172,70 em setembro.'), truth: MATRIZ }),
    { ok: false, number: '8.172,70', why: 'NOT_IN_READS' },
  )
  assert.deepEqual(numbersFromReads({ ...recordedTurn(), truth: FILIAL }), {
    ok: false,
    number: '8.072,70',
    why: 'NOT_TRUE',
  })
})

test('a conferência aprova "não consegui" sem número, e não conta datas, horas nem os números da pergunta', () => {
  assert.deepEqual(
    numbersFromReads({ ...answering('Não consegui ler as vendas agora.'), truth: MATRIZ }),
    { ok: true },
  )
  const dated = answering(
    'Até 30/09/2026 às 18h, em setembro de 2026 (de 2026-09-01 a 2026-09-30), JOAO vendeu R$ 8.072,70.',
  )
  assert.deepEqual(numbersFromReads({ ...dated, truth: MATRIZ }), { ok: true })
})

test('a conferência aceita menos casas e porcentagens que as leituras dão, e recusa as que não dão', () => {
  for (const text of [
    'JOAO vendeu R$ 8 mil.',
    'JOAO vendeu R$ 8,1 mil.',
    'JOAO vendeu R$ 8.073.',
    'RITA vendeu 98,5% do que JOAO vendeu.',
  ]) {
    assert.deepEqual(numbersFromReads({ ...answering(text), truth: MATRIZ }), { ok: true }, text)
  }
  assert.deepEqual(numbersFromReads({ ...answering('JOAO vendeu R$ 9 mil.'), truth: MATRIZ }), {
    ok: false,
    number: '9 mil',
    why: 'NOT_IN_READS',
  })
  assert.deepEqual(
    numbersFromReads({ ...answering('RITA vendeu 90% do que JOAO vendeu.'), truth: MATRIZ }),
    { ok: false, number: '90%', why: 'NOT_IN_READS' },
  )
})
