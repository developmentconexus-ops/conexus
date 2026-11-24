import { expect, test } from 'vitest'
import { dayAndHour } from '../../platform/dates.ts'
import {
  HANDOFF_UNCONFIRMED,
  titleOf,
  UNCONFIRMED_CREATION,
  UNCONFIRMED_MODEL,
  UNCONFIRMED_SEND,
} from './text.ts'

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

test('os "Não confirmamos" da conversa são os de hoje, letra por letra', () => {
  expect([UNCONFIRMED_SEND, HANDOFF_UNCONFIRMED, UNCONFIRMED_CREATION, UNCONFIRMED_MODEL]).toEqual([
    'Não confirmamos o envio. Envie de novo.',
    'Não confirmamos o envio do seu pedido. Confira a conversa antes de enviar de novo.',
    'Não confirmamos a criação da conversa. Tente de novo.',
    'Não confirmamos a troca do modelo. Confira o modelo e tente de novo.',
  ])
})
