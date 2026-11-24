import { z } from 'zod'
import { Instant } from '../../kernel/copy.ts'
import type { OperationId } from '../../kernel/operation.ts'
import { get } from '../../kernel/operation.ts'
import { chain, defineRoute, firstId, Limit, Offset, PathId, sellerOf } from './route.ts'

export const pedidos = defineRoute({
  id: 'pedidos',
  subject: 'vendas',
  docs: 'pedidos-e-opinioes',
  summary:
    'Lista os pedidos do vendedor (status, datas, valores, itens e o envio), uma página por chamada (até 50). A janela dos pedidos é de 12 meses; use o status e as datas para filtrar, ou `changedFrom` para só o que mudou desde um instante.',
  label: 'Pedidos',
  input: z.object({
    status: z
      .enum(['confirmed', 'payment_required', 'payment_in_process', 'paid', 'cancelled'])
      .optional(),
    dateFrom: Instant.optional(),
    dateTo: Instant.optional(),
    changedFrom: Instant.optional(),
    sort: z.enum(['date_asc', 'date_desc']).optional(),
    offset: Offset.optional(),
    limit: Limit(50).optional(),
  }),
  rowsAt: 'results',
  list: {
    paging: { kind: 'OFFSET', offset: 'offset', limit: 'limit', max: 50, ceiling: null },
    changed: { input: 'changedFrom', field: 'date_last_updated' },
  },
  probe: () => ({ offset: 0, limit: 5 }),
  request: (input, account) =>
    get('/orders/search', {
      seller: sellerOf(account),
      'order.status': input.status,
      'order.date_created.from': input.dateFrom,
      'order.date_created.to': input.dateTo,
      'order.date_last_updated.from': input.changedFrom,
      sort: input.sort,
      offset: input.offset,
      limit: input.limit,
    }),
})

export function firstOrder(earlier: ReadonlyMap<OperationId, unknown>) {
  const orderId = firstId(earlier, pedidos.id, 'id')
  return orderId === undefined ? null : { orderId }
}

export const pedido = defineRoute({
  id: 'pedido',
  subject: 'vendas',
  docs: 'gerenciamento-de-vendas',
  summary: 'Mostra um pedido pelo id: status, datas, valores, itens e o id do envio e do pacote.',
  label: 'Pedido',
  input: z.object({ orderId: PathId }),
  rowsAt: null,
  from: [pedidos.id],
  probe: firstOrder,
  request: (input) => get(`/orders/${input.orderId}`),
})

export const pacote = defineRoute({
  id: 'pacote',
  subject: 'vendas',
  docs: 'gestao-packs',
  summary: 'Mostra um pacote (várias vendas de um comprador num envio só): os pedidos e o envio.',
  label: 'Pacote',
  input: z.object({ packId: PathId }),
  rowsAt: null,
  from: [pedido.id],
  probe: chain(pedido.id, 'pack_id', (packId) => ({ packId })),
  request: (input) => get(`/packs/${input.packId}`),
})
