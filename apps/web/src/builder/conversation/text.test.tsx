import { expect, test } from 'vitest'
import { dayAndHour } from '../../platform/dates.ts'
import { titleOf } from './text.ts'

const BEGAN = '2026-11-07T13:12:00.000Z'

test('uma conversa com título se chama pelo título', () => {
  expect(titleOf({ title: 'Apps de padaria', createdAt: BEGAN })).toBe('Apps de padaria')
})

test('sem título, "Conversa de <criação>": o rótulo é o mesmo antes e depois de uma mensagem', () => {
  const before = titleOf({ title: null, createdAt: BEGAN })
  expect(before).toBe(`Conversa de ${dayAndHour(BEGAN)}`)
  const afterAMessage = { title: null, createdAt: BEGAN, updatedAt: '2026-11-08T09:00:00.000Z' }
  expect(titleOf(afterAMessage)).toBe(before)
})
