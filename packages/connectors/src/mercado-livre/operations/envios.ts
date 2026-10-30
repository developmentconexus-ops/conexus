import { z } from 'zod'
import { get } from '../../kernel/operation.ts'
import { anunciosDetalhe } from './anuncios.ts'
import { fromEarlier, Id, maybe, PathId, readOf } from './shared.ts'
import { pedido } from './vendas.ts'

/** The shipment in the new format, without the receiver: the address is the buyer's. */
const Envio = z.object({
  id: Id,
  status: maybe(z.string()),
  substatus: maybe(z.string()),
  order_id: maybe(Id),
  tracking_number: maybe(z.string()),
  date_created: maybe(z.string()),
  last_updated: maybe(z.string()),
  logistic: maybe(z.object({ mode: maybe(z.string()), type: maybe(z.string()) })),
})

export const envio = readOf({
  id: 'envio',
  subject: 'envios',
  docs: 'gerenciamento-de-envios',
  summary:
    'Mostra um envio no formato novo: status e substatus, o pedido, o código de rastreio e a logística. O endereço do comprador não vem.',
  label: 'Envio',
  input: z.object({ shipmentId: PathId }),
  output: Envio,
  from: [pedido.id],
  probe: (earlier) =>
    fromEarlier(earlier, pedido, (order) =>
      order.shipping?.id ? { shipmentId: order.shipping.id } : null,
    ),
  request: (input) => get(`/shipments/${input.shipmentId}`, {}, { 'x-format-new': 'true' }),
})

const Prazo = z.object({
  status: maybe(z.string()),
  service: maybe(z.string()),
  expected_date: maybe(z.string()),
  last_updated: maybe(z.string()),
})

export const prazoDoEnvio = readOf({
  id: 'prazoDoEnvio',
  subject: 'envios',
  docs: 'gerenciamento-de-envios',
  summary: 'Mostra o prazo (SLA) de despacho de um envio: o serviço, o status e a data esperada.',
  label: 'Prazo do envio',
  input: z.object({ shipmentId: PathId }),
  output: Prazo,
  from: [envio.id],
  probe: (earlier) => fromEarlier(earlier, envio, (found) => ({ shipmentId: found.id })),
  request: (input) => get(`/shipments/${input.shipmentId}/sla`),
})

const EstoqueFull = z.object({
  inventory_id: maybe(z.string()),
  total: maybe(z.number()),
  available_units: maybe(z.number()),
  not_available_units: maybe(z.number()),
  not_available_detail: z.array(z.object({ status: z.string(), quantity: z.number() })).default([]),
})

export const estoqueFull = readOf({
  id: 'estoqueFull',
  subject: 'envios',
  docs: 'estoque-full',
  summary:
    'Mostra o estoque no Full de um inventário: o total, o disponível e o indisponível por motivo.',
  label: 'Estoque no Full',
  input: z.object({ inventoryId: PathId }),
  output: EstoqueFull,
  from: [anunciosDetalhe.id],
  probe: (earlier) =>
    fromEarlier(earlier, anunciosDetalhe, (items) => {
      const found = items.find((item) => item.body?.inventory_id)?.body?.inventory_id
      return found ? { inventoryId: found } : null
    }),
  request: (input) => get(`/inventories/${input.inventoryId}/stock/fulfillment`),
})
