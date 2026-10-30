import type { Route } from './fake-data.ts'
import {
  ITEMS,
  itemBody,
  ORDER,
  ORDER_BODY,
  paging,
  SELLER,
  SELLER_PATH,
  SHIPMENT,
} from './fake-data.ts'
import { MORE_ROUTES } from './fake-routes-more.ts'

/** The routes of the double, by permission group; the order is the order they are tried. */
export const ROUTES: readonly Route[] = [
  {
    name: 'anuncios',
    group: 'anuncios',
    pattern: new RegExp(`^/users/${SELLER_PATH}/items/search$`),
    answer: ({ query }) => ({
      body: { seller_id: SELLER.ref, results: ITEMS, paging: paging(ITEMS.length, query) },
    }),
  },
  {
    name: 'anunciosDetalhe',
    group: 'anuncios',
    pattern: /^\/items\/bulk$/,
    answer: ({ query }) => ({
      body: (query.get('ids') ?? '')
        .split(',')
        .map((id) =>
          ITEMS.includes(id)
            ? { code: 200, body: itemBody(id, ITEMS.indexOf(id)) }
            : { code: 404, body: { message: 'Item not found', error: 'not_found', status: 404 } },
        ),
    }),
  },
  {
    name: 'descricao',
    group: 'anuncios',
    pattern: /^\/items\/(?<id>[A-Za-z0-9_-]+)\/description$/,
    answer: () => ({
      body: {
        plain_text: 'Pão fresquinho, assado todo dia.',
        last_updated: '2026-09-01T10:00:00.000Z',
      },
    }),
  },
  {
    name: 'estoque',
    group: 'anuncios',
    pattern: /^\/user-products\/(?<id>[A-Za-z0-9_-]+)\/stock$/,
    answer: ({ match }) => ({
      body: {
        user_product_id: match.groups?.id,
        locations: [{ type: 'seller_warehouse', quantity: 8 }],
      },
    }),
  },
  {
    name: 'qualidade',
    group: 'anuncios',
    pattern: /^\/item\/(?<id>[A-Za-z0-9_-]+)\/performance$/,
    answer: ({ match }) => ({
      body: {
        item_id: match.groups?.id,
        score: 82,
        level: 'Standard',
        level_wording: 'Profissional',
        calculated_at: '2026-09-12T03:00:00Z',
      },
    }),
  },
  {
    name: 'pedidos',
    group: 'vendas',
    pattern: /^\/orders\/search$/,
    answer: ({ query }) => ({
      body: { results: [ORDER_BODY], paging: paging(1, query), sort: { id: 'date_desc' } },
    }),
  },
  {
    name: 'pedido',
    group: 'vendas',
    pattern: /^\/orders\/(?<id>[0-9]+)$/,
    answer: () => ({ body: ORDER_BODY }),
  },
  {
    name: 'pacote',
    group: 'vendas',
    pattern: /^\/packs\/(?<id>[0-9]+)$/,
    answer: ({ match }) => ({
      body: {
        id: Number(match.groups?.id),
        status: 'delivered',
        date_created: '2026-09-10T10:00:00.000-03:00',
        orders: [{ id: ORDER }],
        shipment: { id: SHIPMENT },
      },
    }),
  },
  {
    name: 'envio',
    group: 'envios',
    pattern: /^\/shipments\/(?<id>[0-9]+)$/,
    answer: ({ match, headers }) =>
      headers.get('x-format-new') === 'true'
        ? {
            body: {
              id: Number(match.groups?.id),
              status: 'delivered',
              substatus: null,
              order_id: ORDER,
              tracking_number: 'BR000000000FAKE',
              date_created: '2026-09-10T11:00:00.000-03:00',
              last_updated: '2026-09-12T15:00:00.000-03:00',
              logistic: { mode: 'me2', type: 'cross_docking' },
              receiver_address: {
                receiver_name: 'Maria Fictícia',
                receiver_phone: '11988776655',
                street_name: 'Rua Inventada',
                street_number: '1',
                zip_code: '00000000',
              },
            },
          }
        : {
            status: 400,
            body: { message: 'x-format-new required', error: 'bad_request', status: 400 },
          },
  },
  {
    name: 'prazoDoEnvio',
    group: 'envios',
    pattern: /^\/shipments\/(?<id>[0-9]+)\/sla$/,
    answer: () => ({
      body: {
        status: 'on_time',
        service: 'same_day',
        expected_date: '2026-09-11T20:00:00.000-03:00',
        last_updated: '2026-09-10T11:00:00.000-03:00',
      },
    }),
  },
  {
    name: 'estoqueFull',
    group: 'envios',
    pattern: /^\/inventories\/(?<id>[A-Za-z0-9_-]+)\/stock\/fulfillment$/,
    answer: ({ match }) => ({
      body: {
        inventory_id: match.groups?.id,
        total: 12,
        available_units: 10,
        not_available_units: 2,
        not_available_detail: [{ status: 'damaged', quantity: 2 }],
      },
    }),
  },
  ...MORE_ROUTES,
]
