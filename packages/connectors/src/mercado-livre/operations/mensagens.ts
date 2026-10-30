import { z } from 'zod'
import { get } from '../../kernel/operation.ts'
import {
  fromEarlier,
  Id,
  Limit,
  maybe,
  Offset,
  Paging,
  PathId,
  readOf,
  sellerOf,
} from './shared.ts'
import { pacote } from './vendas.ts'

const NaoLidas = z.object({
  paging: maybe(Paging),
  results: z.array(z.object({ resource: z.string(), count: z.number().int() })),
})

export const mensagensNaoLidas = readOf({
  id: 'mensagensNaoLidas',
  subject: 'mensagens',
  docs: 'mensagens-post-venda',
  summary: 'Conta as mensagens de pós-venda ainda não lidas do vendedor, por pedido ou pacote.',
  label: 'Mensagens não lidas',
  input: z.object({}),
  output: NaoLidas,
  probe: () => ({}),
  request: () => get('/messages/unread', { role: 'seller', tag: 'post_sale' }),
})

const Mensagens = z.object({
  paging: maybe(Paging),
  conversation_status: maybe(z.object({ status: maybe(z.string()), substatus: maybe(z.string()) })),
  messages: z.array(
    z.object({
      id: Id,
      text: maybe(z.object({ plain: maybe(z.string()) })),
      status: maybe(z.string()),
      message_date: maybe(z.object({ created: maybe(z.string()), read: maybe(z.string()) })),
    }),
  ),
})

export const mensagensDoPacote = readOf({
  id: 'mensagensDoPacote',
  subject: 'mensagens',
  docs: 'mensagens-post-venda',
  summary:
    'Lê as mensagens de pós-venda de um pacote. A leitura nunca marca como lida: manda sempre mark_as_read=false.',
  label: 'Mensagens do pacote',
  input: z.object({ packId: PathId, offset: Offset.optional(), limit: Limit(100).optional() }),
  output: Mensagens,
  from: [pacote.id],
  probe: (earlier) => fromEarlier(earlier, pacote, (found) => ({ packId: found.id })),
  request: (input, account) =>
    get(`/messages/packs/${input.packId}/sellers/${sellerOf(account)}`, {
      tag: 'post_sale',
      mark_as_read: false,
      offset: input.offset,
      limit: input.limit,
    }),
})
