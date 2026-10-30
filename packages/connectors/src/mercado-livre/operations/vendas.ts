import { z } from 'zod'
import type { OperationId } from '../../kernel/operation.ts'
import { get } from '../../kernel/operation.ts'
import { chain, firstId, Instant, Limit, Offset, PathId, readOf, sellerOf } from './shared.ts'

/** The buyer is left out whole: the API sends a nickname, a name and, on some routes, an e-mail and a phone (founder, T1). */
const BUYER = ['buyer'] as const

export const pedidos = readOf({
  id: 'pedidos',
  subject: 'vendas',
  docs: 'pedidos-e-opinioes',
  summary:
    'Lista os pedidos do vendedor (status, datas, valores, itens e o envio), uma página por chamada (até 50). A janela dos pedidos é de 12 meses; use o status e as datas para filtrar.',
  label: 'Pedidos',
  input: z.object({
    status: z
      .enum(['confirmed', 'payment_required', 'payment_in_process', 'paid', 'cancelled'])
      .optional(),
    dateFrom: Instant.optional(),
    dateTo: Instant.optional(),
    sort: z.enum(['date_asc', 'date_desc']).optional(),
    offset: Offset,
    limit: Limit(50),
  }),
  list: 'results',
  omit: BUYER,
  probe: () => ({ offset: 0, limit: 5 }),
  request: (input, account) =>
    get('/orders/search', {
      seller: sellerOf(account),
      'order.status': input.status,
      'order.date_created.from': input.dateFrom,
      'order.date_created.to': input.dateTo,
      sort: input.sort,
      offset: input.offset,
      limit: input.limit,
    }),
})

/** The first order the listing before gave, for the reads that open one order. */
export function firstOrder(earlier: ReadonlyMap<OperationId, unknown>) {
  const orderId = firstId(earlier, pedidos.id, 'id')
  return orderId === undefined ? null : { orderId }
}

export const pedido = readOf({
  id: 'pedido',
  subject: 'vendas',
  docs: 'gerenciamento-de-vendas',
  summary: 'Mostra um pedido pelo id: status, datas, valores, itens e o id do envio e do pacote.',
  label: 'Pedido',
  input: z.object({ orderId: PathId }),
  list: null,
  omit: BUYER,
  from: [pedidos.id],
  probe: firstOrder,
  request: (input) => get(`/orders/${input.orderId}`),
})

export const pacote = readOf({
  id: 'pacote',
  subject: 'vendas',
  docs: 'gestao-packs',
  summary: 'Mostra um pacote (várias vendas de um comprador num envio só): os pedidos e o envio.',
  label: 'Pacote',
  input: z.object({ packId: PathId }),
  list: null,
  from: [pedido.id],
  probe: chain(pedido.id, 'pack_id', (packId) => ({ packId })),
  request: (input) => get(`/packs/${input.packId}`),
})
