import { expect, test } from 'vitest'
import { UNCONFIRMED_WRITE } from '../../harness/room/public.ts'
import { UNCONFIRMED_CHOICE, UNCONFIRMED_HANDOFF } from './text.ts'

test('os "Não confirmamos" do Assistente são os de hoje, letra por letra', () => {
  expect([UNCONFIRMED_CHOICE, UNCONFIRMED_WRITE, UNCONFIRMED_HANDOFF]).toEqual([
    'Não confirmamos a troca das ferramentas. Confira a caixa e tente de novo.',
    'Não confirmamos. Veja a lista.',
    'Não confirmamos o envio para Construir. Tente de novo.',
  ])
})
