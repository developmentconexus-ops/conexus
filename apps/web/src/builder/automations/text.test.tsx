import { expect, test } from 'vitest'
import { UNCONFIRMED_ACTION, UNCONFIRMED_CREATION } from './text.ts'

test('os "Não confirmamos" das Automações são os de hoje, letra por letra', () => {
  expect([UNCONFIRMED_ACTION, UNCONFIRMED_CREATION]).toEqual([
    'Não confirmamos a mudança. Veja a lista.',
    'Não confirmamos a criação. Toque de novo.',
  ])
})
