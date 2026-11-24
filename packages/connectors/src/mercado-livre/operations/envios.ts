import { z } from 'zod'
import { get } from '../../kernel/operation.ts'
import { anunciosDetalhe } from './anuncios.ts'
import { chain, defineRoute, PathId } from './route.ts'
import { pedido } from './vendas.ts'

export const envio = defineRoute({
  id: 'envio',
  subject: 'envios',
  docs: 'gerenciamento-de-envios',
  summary:
    'Mostra um envio no formato novo: status e substatus, o pedido, o código de rastreio, a logística e o destino (o endereço, o nome e o telefone de quem recebe).',
  label: 'Envio',
  input: z.object({ shipmentId: PathId }),
  rowsAt: null,
  from: [pedido.id],
  probe: chain(pedido.id, 'shipping.id', (shipmentId) => ({ shipmentId })),
  request: (input) => get(`/shipments/${input.shipmentId}`, {}, { 'x-format-new': 'true' }),
})

export const prazoDoEnvio = defineRoute({
  id: 'prazoDoEnvio',
  subject: 'envios',
  docs: 'gerenciamento-de-envios',
  summary: 'Mostra o prazo (SLA) de despacho de um envio: o serviço, o status e a data esperada.',
  label: 'Prazo do envio',
  input: z.object({ shipmentId: PathId }),
  rowsAt: null,
  from: [envio.id],
  probe: chain(envio.id, 'id', (shipmentId) => ({ shipmentId })),
  request: (input) => get(`/shipments/${input.shipmentId}/sla`),
})

export const estoqueFull = defineRoute({
  id: 'estoqueFull',
  subject: 'envios',
  docs: 'envios-fulfillment',
  summary:
    'Mostra o estoque no Full de um inventário: o total, o disponível e o indisponível por motivo.',
  label: 'Estoque no Full',
  input: z.object({ inventoryId: PathId }),
  rowsAt: null,
  from: [anunciosDetalhe.id],
  probe: chain(anunciosDetalhe.id, 'body.inventory_id', (inventoryId) => ({
    inventoryId,
  })),
  request: (input) => get(`/inventories/${input.inventoryId}/stock/fulfillment`),
})
