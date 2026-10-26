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
