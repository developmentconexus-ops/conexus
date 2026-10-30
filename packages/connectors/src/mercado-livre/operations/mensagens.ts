import { z } from 'zod'
import { get } from '../../kernel/operation.ts'
import { firstId, Limit, Offset, PathId, readOf, sellerOf } from './shared.ts'
import { pacote } from './vendas.ts'

export const mensagensNaoLidas = readOf({
  id: 'mensagensNaoLidas',
  subject: 'mensagens',
  docs: 'mensagens-post-venda',
  summary: 'Conta as mensagens de pós-venda ainda não lidas do vendedor, por pedido ou pacote.',
  label: 'Mensagens não lidas',
  input: z.object({}),
  list: 'results',
  probe: () => ({}),
  request: () => get('/messages/unread', { role: 'seller', tag: 'post_sale' }),
})

export const mensagensDoPacote = readOf({
  id: 'mensagensDoPacote',
  subject: 'mensagens',
  docs: 'mensagens-post-venda',
  summary:
    'Lê as mensagens de pós-venda de um pacote. A leitura nunca marca como lida: manda sempre mark_as_read=false.',
  label: 'Mensagens do pacote',
  input: z.object({ packId: PathId, offset: Offset.optional(), limit: Limit(100).optional() }),
  list: 'messages',
  omit: ['from.email', 'from.name', 'to.email', 'to.name'],
  from: [pacote.id],
  probe: (earlier) => {
    const packId = firstId(earlier, pacote.id, 'id')
    return packId === undefined ? null : { packId }
  },
  request: (input, account) =>
    get(`/messages/packs/${input.packId}/sellers/${sellerOf(account)}`, {
      tag: 'post_sale',
      mark_as_read: false,
      offset: input.offset,
      limit: input.limit,
    }),
})
