import { z } from 'zod'
import type { OperationId } from '../../kernel/operation.ts'
import { get } from '../../kernel/operation.ts'
import {
  fromEarlier,
  Id,
  Instant,
  Limit,
  maybe,
  Offset,
  Paging,
  PathId,
  readOf,
  sellerOf,
} from './shared.ts'

/** An order as the seller reads it. The buyer is left out whole: the API sends a nickname, a name and, on some routes, an e-mail and a phone (founder, T1). */
const Pedido = z.object({
  id: Id,
  status: maybe(z.string()),
  date_created: maybe(z.string()),
  date_closed: maybe(z.string()),
  total_amount: maybe(z.number()),
  paid_amount: maybe(z.number()),
  currency_id: maybe(z.string()),
  pack_id: maybe(Id),
  shipping: maybe(z.object({ id: maybe(Id) })),
  order_items: z
    .array(
      z.object({
        item: z.object({ id: Id, title: maybe(z.string()), seller_sku: maybe(z.string()) }),
        quantity: z.number(),
        unit_price: maybe(z.number()),
      }),
    )
    .default([]),
})

const Pedidos = z.object({ results: z.array(Pedido), paging: Paging })

export const pedidos = readOf({
  id: 'pedidos',
  subject: 'vendas',
  docs: 'gerenciamento-de-vendas',
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
  output: Pedidos,
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
  return fromEarlier(earlier, pedidos, ({ results }) =>
    results[0] ? { orderId: results[0].id } : null,
  )
}

export const pedido = readOf({
  id: 'pedido',
  subject: 'vendas',
  docs: 'gerenciamento-de-vendas',
  summary: 'Mostra um pedido pelo id: status, datas, valores, itens e o id do envio e do pacote.',
  label: 'Pedido',
  input: z.object({ orderId: PathId }),
  output: Pedido,
  from: [pedidos.id],
  probe: firstOrder,
  request: (input) => get(`/orders/${input.orderId}`),
})

const Pacote = z.object({
  id: Id,
  status: maybe(z.string()),
  date_created: maybe(z.string()),
  orders: z.array(z.object({ id: Id })),
  shipment: maybe(z.object({ id: maybe(Id) })),
})

export const pacote = readOf({
  id: 'pacote',
  subject: 'vendas',
  docs: 'gerenciamento-de-pacotes',
  summary: 'Mostra um pacote (várias vendas de um comprador num envio só): os pedidos e o envio.',
  label: 'Pacote',
  input: z.object({ packId: PathId }),
  output: Pacote,
  from: [pedido.id],
  probe: (earlier) =>
    fromEarlier(earlier, pedido, (order) => (order.pack_id ? { packId: order.pack_id } : null)),
  request: (input) => get(`/packs/${input.packId}`),
})
