import { z } from 'zod'
import { get } from '../../kernel/operation.ts'
import { chain, defineRoute, Limit, Offset, PathId, sellerOf } from './route.ts'
import { pacote } from './vendas.ts'

export const mensagensNaoLidas = defineRoute({
  id: 'mensagensNaoLidas',
  subject: 'mensagens',
  docs: 'mensagens-pendentes',
  summary: 'Conta as mensagens de pós-venda ainda não lidas do vendedor, por pedido ou pacote.',
  label: 'Mensagens não lidas',
  input: z.object({}),
  rowsAt: 'results',
  probe: () => ({}),
  request: () => get('/messages/unread', { role: 'seller', tag: 'post_sale' }),
})

export const mensagensDoPacote = defineRoute({
  id: 'mensagensDoPacote',
  subject: 'mensagens',
  docs: 'mensagens-post-venda',
  summary:
    'Lê as mensagens de pós-venda de um pacote. A leitura nunca marca como lida: manda sempre mark_as_read=false.',
  label: 'Mensagens do pacote',
  input: z.object({
    packId: PathId,
    offset: Offset.optional(),
    limit: Limit(100).optional(),
  }),
  rowsAt: 'messages',
  from: [pacote.id],
  probe: chain(pacote.id, 'id', (packId) => ({ packId })),
  request: (input, account) =>
    get(`/messages/packs/${input.packId}/sellers/${sellerOf(account)}`, {
      tag: 'post_sale',
      mark_as_read: false,
      offset: input.offset,
      limit: input.limit,
    }),
})
