import { expect, test } from 'vitest'
import { defaultRefusalText } from './text.ts'

test('o "Não confirmamos" da escolha padrão é o de hoje, letra por letra', () => {
  expect(defaultRefusalText(new Error('corte'))).toBe('Não confirmamos a mudança. Tente de novo.')
})
