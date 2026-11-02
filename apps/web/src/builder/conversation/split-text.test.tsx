import type { MastraMessagePart } from '@mastra/client-js'
import { expect, test } from 'vitest'
import type { Message } from './messages.ts'
import { itemsOf } from './rows.ts'

const view = { suspended: {}, running: {}, heard: {}, live: false }

function source(id: string) {
  return {
    type: 'source' as const,
    source: { sourceType: 'url' as const, id, url: `https://example.org/${id}`, title: id },
  }
}

const search: MastraMessagePart = {
  type: 'tool-invocation',
  toolInvocation: {
    state: 'result',
    toolCallId: 'toolu_search_1',
    toolName: 'web_search',
    args: { query: 'previsão do tempo no fim de semana' },
    result: [],
  },
}

/** The shape of an answer after Anthropic's native web search: text blocks cut around each citation. */
const message: Message = {
  id: 'm1',
  role: 'builder',
  model: null,
  createdAt: '2026-11-02T00:39:37.000Z',
  parts: [
    search,
    source('a'),
    source('b'),
    { type: 'text', text: 'Para o fim de semana:\n\n- ' },
    source('c'),
    { type: 'text', text: 'O serviço A' },
    { type: 'text', text: ' dá 8% de chance de chuva.\n- ' },
    source('d'),
    { type: 'text', text: 'O serviço B' },
    { type: 'text', text: ' dá 52%, e a página nova' },
    source('e'),
    { type: 'text', text: ' dá 36%. Leve um guarda-chuva.' },
  ],
}

test('o texto cortado em volta das citações é um só texto, com a frase e o item inteiros', () => {
  const texts = itemsOf([message], view).filter((item) => item.kind === 'text')
  expect(texts.map((item) => item.text)).toEqual([
    'Para o fim de semana:\n\n- O serviço A dá 8% de chance de chuva.\n- O serviço B dá 52%, e a página nova dá 36%. Leve um guarda-chuva.',
  ])
})

test('uma ferramenta entre dois textos os mantém separados', () => {
  const apart: Message = {
    ...message,
    parts: [
      { type: 'text', text: 'Antes.' },
      search,
      source('a'),
      { type: 'text', text: 'Depois.' },
    ],
  }
  const kinds = itemsOf([apart], view).map((item) => item.kind)
  expect(kinds).toEqual(['text', 'tool', 'text'])
})
