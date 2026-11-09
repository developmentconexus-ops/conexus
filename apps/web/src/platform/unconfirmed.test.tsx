import { expect, test } from 'vitest'
import {
  UNCONFIRMED_DELETE,
  UNCONFIRMED_PUBLISH,
  UNCONFIRMED_SAVE,
} from '../builder/agents/text.ts'
import {
  UNCONFIRMED_CHOICE,
  UNCONFIRMED_HANDOFF,
  UNCONFIRMED_WRITE,
} from '../builder/assistant/text.ts'
import {
  UNCONFIRMED_CREATION as AUTOMATION_CREATION,
  UNCONFIRMED_ACTION,
} from '../builder/automations/text.ts'
import {
  HANDOFF_UNCONFIRMED,
  UNCONFIRMED_CREATION,
  UNCONFIRMED_MODEL,
  UNCONFIRMED_SEND,
} from '../builder/conversation/text.ts'
import { UNCONFIRMED_ASK } from '../hub/requests/text.ts'
import { unconfirmedText } from './hub.ts'

const TODAY: [string, string | undefined, string][] = [
  ['Não confirmamos o envio. Envie de novo.', 'o envio', 'Envie de novo.'],
  [
    'Não confirmamos o envio do seu pedido. Confira a conversa antes de enviar de novo.',
    'o envio do seu pedido',
    'Confira a conversa antes de enviar de novo.',
  ],
  [
    'Não confirmamos a criação da conversa. Tente de novo.',
    'a criação da conversa',
    'Tente de novo.',
  ],
  [
    'Não confirmamos a troca do modelo. Confira o modelo e tente de novo.',
    'a troca do modelo',
    'Confira o modelo e tente de novo.',
  ],
  [
    'Não confirmamos a troca das ferramentas. Confira a caixa e tente de novo.',
    'a troca das ferramentas',
    'Confira a caixa e tente de novo.',
  ],
  ['Não confirmamos. Veja a lista.', undefined, 'Veja a lista.'],
  ['Não confirmamos o envio ao Builder. Tente de novo.', 'o envio ao Builder', 'Tente de novo.'],
  [
    'Não confirmamos a gravação. Confira o painel e tente de novo.',
    'a gravação',
    'Confira o painel e tente de novo.',
  ],
  [
    'Não confirmamos a publicação. Confira as versões e tente de novo.',
    'a publicação',
    'Confira as versões e tente de novo.',
  ],
  [
    'Não confirmamos a exclusão. Confira a lista e tente de novo.',
    'a exclusão',
    'Confira a lista e tente de novo.',
  ],
  ['Não confirmamos a mudança. Veja a lista.', 'a mudança', 'Veja a lista.'],
  ['Não confirmamos a mudança. Tente de novo.', 'a mudança', 'Tente de novo.'],
  ['Não confirmamos a criação. Toque de novo.', 'a criação', 'Toque de novo.'],
  ['Não confirmamos a criação. Tente de novo.', 'a criação', 'Tente de novo.'],
  ['Não confirmamos a ligação. Tente de novo.', 'a ligação', 'Tente de novo.'],
  ['Não confirmamos o desligamento. Veja a lista.', 'o desligamento', 'Veja a lista.'],
  ['Não confirmamos a gravação. Veja a lista de papéis.', 'a gravação', 'Veja a lista de papéis.'],
  ['Não confirmamos a exclusão. Veja a lista.', 'a exclusão', 'Veja a lista.'],
  [
    'Não confirmamos a exclusão. Veja a lista antes de tentar de novo.',
    'a exclusão',
    'Veja a lista antes de tentar de novo.',
  ],
  [
    'Não confirmamos o cadastro. Veja a lista antes de tentar de novo.',
    'o cadastro',
    'Veja a lista antes de tentar de novo.',
  ],
  ['Não confirmamos o pedido. Tente de novo.', 'o pedido', 'Tente de novo.'],
]

test('"Não confirmamos <o quê>. <depois>": cada texto de hoje, letra por letra, sai da função', () => {
  for (const [text, what, next] of TODAY) expect(unconfirmedText(what, next)).toBe(text)
})

test('as constantes de cada tela dizem o texto de hoje, letra por letra', () => {
  expect([
    UNCONFIRMED_SEND,
    HANDOFF_UNCONFIRMED,
    UNCONFIRMED_CREATION,
    UNCONFIRMED_MODEL,
    UNCONFIRMED_CHOICE,
    UNCONFIRMED_WRITE,
    UNCONFIRMED_HANDOFF,
    UNCONFIRMED_SAVE,
    UNCONFIRMED_PUBLISH,
    UNCONFIRMED_DELETE,
    UNCONFIRMED_ACTION,
    AUTOMATION_CREATION,
    UNCONFIRMED_ASK,
  ]).toEqual([
    'Não confirmamos o envio. Envie de novo.',
    'Não confirmamos o envio do seu pedido. Confira a conversa antes de enviar de novo.',
    'Não confirmamos a criação da conversa. Tente de novo.',
    'Não confirmamos a troca do modelo. Confira o modelo e tente de novo.',
    'Não confirmamos a troca das ferramentas. Confira a caixa e tente de novo.',
    'Não confirmamos. Veja a lista.',
    'Não confirmamos o envio ao Builder. Tente de novo.',
    'Não confirmamos a gravação. Confira o painel e tente de novo.',
    'Não confirmamos a publicação. Confira as versões e tente de novo.',
    'Não confirmamos a exclusão. Confira a lista e tente de novo.',
    'Não confirmamos a mudança. Veja a lista.',
    'Não confirmamos a criação. Toque de novo.',
    'Não confirmamos o pedido. Tente de novo.',
  ])
})
