import { expect, test } from 'vitest'
import { UNCONFIRMED_ASK } from './text.ts'

test('o "Não confirmamos" do pedido é o de hoje, letra por letra', () => {
  expect(UNCONFIRMED_ASK).toBe('Não confirmamos o pedido. Tente de novo.')
})
