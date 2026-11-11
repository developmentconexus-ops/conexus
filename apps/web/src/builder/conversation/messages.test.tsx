import { expect, test } from 'vitest'
import type { Stored } from './messages.ts'
import { messageOf, sentOf } from './messages.ts'
import { recordedRun } from './test-recorded.ts'

const at = '2026-10-25T00:00:00.000Z'
const text = [{ type: 'text' as const, text: 'Oi' }]

test('o texto que o isTaskComplete dá ao modelo não é mensagem do Builder (14.2, 15)', () => {
  const feedback = {
    id: 'm1',
    role: 'assistant',
    createdAt: at,
    content: { parts: text, metadata: { completionResult: { passed: false } } },
  }
  expect(messageOf(feedback)).toBeUndefined()
  expect(messageOf({ ...feedback, content: { parts: text } })?.role).toBe('builder')
})

/** What the person sent, in each of their messages. */
function sentIn(stored: readonly Stored[]) {
  return stored.flatMap((each) => {
    const message = messageOf(each)
    return message?.role === 'person' ? [sentOf(message)] : []
  })
}

test('a mensagem com arquivos se lê igual ao vivo e relida: as palavras e os arquivos, o .md pelo nome (11)', () => {
  const { events, read } = recordedRun('files')
  const live = events.flatMap((event) => (event.type === 'message_start' ? [event.message] : []))
  expect(sentIn(live)).toEqual(sentIn(read))
  expect(sentIn(read).map((one) => one.files.map((file) => file.filename))).toEqual([
    ['observacoes.md', 'precos.pdf', 'logo.png'],
    ['cardapio.pdf'],
  ])
})

/** The origin of each of the person's messages. */
function originsIn(stored: readonly Stored[]) {
  return stored.flatMap((each) => {
    const message = messageOf(each)
    return message?.role === 'person' ? [message.origin] : []
  })
}

test('o pedido que o Assistente entrega traz a origem igual ao vivo e relido; a mensagem comum, nenhuma (24.3.2)', () => {
  const handoff = recordedRun('handoff')
  const live = handoff.events.flatMap((event) =>
    event.type === 'message_start' ? [event.message] : [],
  )
  expect(originsIn(live)).toEqual(['assistant'])
  expect(originsIn(handoff.read)).toEqual(['assistant'])
  expect(originsIn(recordedRun('files').read)).toEqual([null, null])
})

const FILES_LIST = [
  'Arquivos que a pessoa mandou ao Assistente:',
  '- politica-comercial.pdf (PDF, 1,5 MB)',
  '- precos.xlsx (planilha, 48 KB)',
  'Eles ficam na conversa do Assistente; este Projeto não os tem. O que o briefing diz deles é o que o Assistente leu.',
].join('\n')

test('a lista da passagem aparece como veio', () => {
  const { read } = recordedRun('handoff')
  const withList = read.map((each) =>
    messageOf(each)?.origin === 'assistant'
      ? {
          ...each,
          content: {
            ...each.content,
            parts: [...each.content.parts, { type: 'text' as const, text: FILES_LIST }],
          },
        }
      : each,
  )
  const [handed] = sentIn(withList)
  expect(handed?.text.endsWith(FILES_LIST)).toBe(true)
  expect(handed?.files).toEqual([])
  expect(sentIn(read)[0]?.text.includes('Arquivos que a pessoa')).toBe(false)
})
