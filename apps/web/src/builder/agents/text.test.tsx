import { expect, test } from 'vitest'
import { UNCONFIRMED_DELETE, UNCONFIRMED_PUBLISH, UNCONFIRMED_SAVE } from './text.ts'

test('os "Não confirmamos" dos agentes são os de hoje, letra por letra', () => {
  expect([UNCONFIRMED_SAVE, UNCONFIRMED_PUBLISH, UNCONFIRMED_DELETE]).toEqual([
    'Não confirmamos a gravação. Confira o painel e tente de novo.',
    'Não confirmamos a publicação. Confira as versões e tente de novo.',
    'Não confirmamos a exclusão. Confira a lista e tente de novo.',
  ])
})
