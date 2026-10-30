import { z } from 'zod'
import { get } from '../../kernel/operation.ts'
import { anunciosDetalhe } from './anuncios.ts'
import { firstId, PathId, readOf } from './shared.ts'
import { pedido } from './vendas.ts'

export const envio = readOf({
  id: 'envio',
  subject: 'envios',
  docs: 'gerenciamento-de-envios',
  summary:
    'Mostra um envio no formato novo: status e substatus, o pedido, o código de rastreio e a logística. O endereço do comprador não vem.',
  label: 'Envio',
  input: z.object({ shipmentId: PathId }),
  list: null,
  omit: ['receiver_address', 'receiver'],
  from: [pedido.id],
  probe: (earlier) => {
    const shipmentId = firstId(earlier, pedido.id, 'shipping.id')
    return shipmentId === undefined ? null : { shipmentId }
  },
  request: (input) => get(`/shipments/${input.shipmentId}`, {}, { 'x-format-new': 'true' }),
})

export const prazoDoEnvio = readOf({
  id: 'prazoDoEnvio',
  subject: 'envios',
  docs: 'gerenciamento-de-envios',
  summary: 'Mostra o prazo (SLA) de despacho de um envio: o serviço, o status e a data esperada.',
  label: 'Prazo do envio',
  input: z.object({ shipmentId: PathId }),
  list: null,
  from: [envio.id],
  probe: (earlier) => {
    const shipmentId = firstId(earlier, envio.id, 'id')
    return shipmentId === undefined ? null : { shipmentId }
  },
  request: (input) => get(`/shipments/${input.shipmentId}/sla`),
})

export const estoqueFull = readOf({
  id: 'estoqueFull',
  subject: 'envios',
  docs: 'estoque-full',
  summary:
    'Mostra o estoque no Full de um inventário: o total, o disponível e o indisponível por motivo.',
  label: 'Estoque no Full',
  input: z.object({ inventoryId: PathId }),
  list: null,
  from: [anunciosDetalhe.id],
  probe: (earlier) => {
    const inventoryId = firstId(earlier, anunciosDetalhe.id, 'body.inventory_id')
    return inventoryId === undefined ? null : { inventoryId }
  },
  request: (input) => get(`/inventories/${input.inventoryId}/stock/fulfillment`),
})
