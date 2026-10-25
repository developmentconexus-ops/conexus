import { expect, test } from 'vitest'
import { messageOf } from './messages.ts'

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
