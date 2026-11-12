import type { Route } from './fake-data.ts'
import {
  BAD_SCROLL,
  BUYER,
  badScroll,
  CLAIM,
  ITEMS,
  ORDER,
  PACK,
  pageOf,
  paging,
  SELLER,
  SELLER_PATH,
  scanOf,
} from './fake-data.ts'
import { envelope, rowsOf } from './recordings.ts'

let questionsKept: readonly Record<string, unknown>[] | undefined

/** 12 questions shaped as the recorded one, every fourth answered as it was; the asker's name and e-mail are planted for the kit to drop. */
export function questionsOf() {
  const recorded = rowsOf('perguntas-varredura', 'questions')
  questionsKept ??= Array.from({ length: 12 }, (_, index) => ({
    ...recorded[0],
    id: 9000000001 + index,
    text: `Tem na cor azul? (${index + 1})`,
    ...(index % 4 === 3 ? {} : { status: 'UNANSWERED', answer: null }),
    item_id: ITEMS[0],
    seller_id: Number(SELLER.ref),
    from: { id: BUYER.id, answered_questions: 3, nickname: BUYER.nickname, email: BUYER.email },
  }))
  return questionsKept
}

export const PERIODS = Array.from({ length: 14 }, (_, index) => {
  const month = String(index + 1).padStart(2, '0')
  return {
    key: `2025-${month}-01`,
    period: { date_from: `2025-${month}-01`, date_to: `2025-${month}-28` },
    amount: 120.5 + index,
    unpaid_amount: 0,
    expiration_date: `2025-${month}-28`,
    period_status: 'CLOSED',
  }
})

/** The reason of the double's one open claim. */
export const CLAIM_REASON = 'PNR'
/** The one promotion of the double: still a candidate, it starts on 1 October 2026. */
export const PROMOTION = {
  id: 'P-MLB1000',
  type: 'DEAL',
  status: 'candidate',
  name: 'Semana do Pão',
  start_date: '2026-10-01T00:00:00',
  finish_date: '2026-10-07T23:59:59',
}
/** The visits of the double: one total, none by listing. */
export const TOTAL_VISITS = 321

const NEEDS_DOCUMENT_TYPE = {
  status: 400,
  body: { message: 'document_type is required', error: 'bad_request', status: 400 },
}

export const MORE_ROUTES: readonly Route[] = [
  {
    name: 'perguntas',
    group: 'perguntas',
    pattern: /^\/questions\/search$/,
    answer: ({ query }) => {
      if (query.get('search_type') === 'scan') {
        if (badScroll(query, 'questions')) return BAD_SCROLL
        const scan = scanOf(questionsOf(), query, 'questions')
        return {
          body: {
            ...envelope('perguntas-varredura', 'questions'),
            total: scan.total,
            limit: scan.limit,
            questions: scan.rows,
            scroll_id: scan.scrollId,
          },
        }
      }
      const page = pageOf(questionsOf(), query, 50)
      return {
        body: {
          total: page.total,
          limit: page.limit,
          questions: page.rows,
          filters: { limit: page.limit, offset: page.offset, api_version: '4' },
        },
      }
    },
  },
  {
    name: 'tempoDeResposta',
    group: 'perguntas',
    pattern: new RegExp(`^/users/${SELLER_PATH}/questions/response_time$`),
    answer: () => ({
      body: { user_id: Number(SELLER.ref), total: { response_time: 38, sales: 12 } },
    }),
  },
  {
    name: 'mensagensNaoLidas',
    group: 'mensagens',
    pattern: /^\/messages\/unread$/,
    answer: () => ({
      body: { paging: { total: 1 }, results: [{ resource: `/packs/${PACK}`, count: 2 }] },
    }),
  },
  {
    name: 'mensagensDoPacote',
    group: 'mensagens',
    pattern: new RegExp(`^/messages/packs/(?<pack>[0-9]+)/sellers/${SELLER_PATH}$`),
    answer: ({ query }) => ({
      body: {
        paging: { total: 1, offset: 0, limit: 10 },
        conversation_status: { status: 'active', substatus: null },
        messages: [
          {
            id: 'msg-0001',
            text: { plain: 'Quando chega?' },
            status: query.get('mark_as_read') === 'false' ? 'available' : 'read',
            message_date: { created: '2026-09-11T10:00:00.000-03:00', read: null },
            from: { user_id: BUYER.id, email: BUYER.email },
            to: { user_id: Number(SELLER.ref) },
          },
        ],
      },
    }),
  },
  {
    name: 'reclamacoes',
    group: 'reclamacoes',
    pattern: /^\/post-purchase\/v1\/claims\/search$/,
    answer: ({ query }) => ({
      body: {
        data: [
          {
            id: CLAIM,
            resource_id: ORDER,
            resource: 'order',
            status: query.get('status') ?? 'opened',
            type: 'mediations',
            stage: 'claim',
            reason_id: CLAIM_REASON,
            date_created: '2026-09-12T09:00:00.000-03:00',
            last_updated: '2026-09-12T10:00:00.000-03:00',
            players: [{ role: 'respondent', type: 'seller', user_id: Number(SELLER.ref) }],
          },
        ],
        paging: paging(1, query),
      },
    }),
  },
  {
    name: 'reclamacao',
    group: 'reclamacoes',
    pattern: /^\/post-purchase\/v1\/claims\/(?<id>[0-9]+)$/,
    answer: ({ match }) => ({
      body: {
        id: Number(match.groups?.id),
        resource_id: ORDER,
        resource: 'order',
        status: 'opened',
        type: 'mediations',
        stage: 'claim',
        reason_id: CLAIM_REASON,
        date_created: '2026-09-12T09:00:00.000-03:00',
        last_updated: '2026-09-12T10:00:00.000-03:00',
        resolution: null,
      },
    }),
  },
  {
    name: 'devolucao',
    group: 'reclamacoes',
    pattern: /^\/post-purchase\/v2\/claims\/(?<id>[0-9]+)\/returns$/,
    answer: ({ match }) => ({
      body: {
        id: 6000000001,
        claim_id: Number(match.groups?.id),
        status: 'pending',
        subtype: 'return_total',
        date_created: '2026-09-12T11:00:00.000-03:00',
        date_closed: null,
      },
    }),
  },
  {
    name: 'promocoes',
    group: 'promocoes',
    pattern: new RegExp(`^/seller-promotions/users/${SELLER_PATH}$`),
    answer: () => ({
      body: {
        results: [PROMOTION],
        paging: { total: 1 },
      },
    }),
  },
  {
    name: 'visitas',
    group: 'metricas',
    pattern: new RegExp(`^/users/${SELLER_PATH}/items_visits$`),
    answer: ({ query }) => ({
      body: {
        date_from: query.get('date_from'),
        date_to: query.get('date_to'),
        total_visits: TOTAL_VISITS,
        visits_detail: [{ company: 'mercadolibre', quantity: TOTAL_VISITS }],
      },
    }),
  },
  {
    name: 'periodosDeFaturamento',
    group: 'faturamento',
    pattern: /^\/billing\/integration\/monthly\/periods$/,
    answer: ({ query }) => {
      if (query.get('document_type') === null) return NEEDS_DOCUMENT_TYPE
      const page = pageOf(PERIODS, query, 6)
      return {
        body: { offset: page.offset, limit: page.limit, total: page.total, results: page.rows },
      }
    },
  },
  {
    name: 'cobrancasDoPeriodo',
    group: 'faturamento',
    pattern: /^\/billing\/integration\/periods\/key\/(?<key>[A-Za-z0-9_-]+)\/summary\/details$/,
    answer: ({ match, query }) =>
      query.get('document_type') === null
        ? NEEDS_DOCUMENT_TYPE
        : {
            body: {
              user: { nickname: SELLER.label },
              period: {
                date_from: '2025-01-01',
                date_to: '2025-01-28',
                expiration_date: '2025-01-28',
                key: match.groups?.key,
              },
              bill_includes: {
                total_amount: 120.5,
                total_perceptions: 0,
                bonuses: [],
                charges: [{ label: 'Tarifa de venda', amount: 120.5, type: 'CHARGE', groupId: 1 }],
              },
              payment_collected: {
                operation_discount: 0,
                total_payment: 120.5,
                total_credit_note: 0,
                total_collected: 120.5,
                total_debt: 0,
              },
            },
          },
  },
  {
    name: 'notaFiscalDoPedido',
    group: 'faturamento',
    pattern: new RegExp(`^/users/${SELLER_PATH}/invoices/orders/(?<order>[0-9]+)$`),
    answer: () => ({
      body: {
        id: 8000000001,
        status: 'authorized',
        invoice_series: '1',
        invoice_number: '1234',
        issued_date: '2026-09-10T12:00:00.000-03:00',
        recipient: { name: 'Maria Fictícia', tax_id: '52998224725', email: BUYER.email },
      },
    }),
  },
  {
    name: 'tendencias',
    group: 'mercado',
    pattern: /^\/trends\/MLB$/,
    answer: () => ({
      body: [{ keyword: 'pão de queijo', url: 'https://lista.exemplo.test/pao-de-queijo' }],
    }),
  },
  {
    name: 'maisVendidos',
    group: 'mercado',
    pattern: /^\/highlights\/MLB\/category\/(?<id>[A-Za-z0-9_-]+)$/,
    answer: () => ({
      body: {
        query_data: { highlight_type: 'BEST_SELLER', criteria: 'CATEGORY', id: 'MLB1055' },
        content: [{ id: 'MLB9000000001', position: 1, type: 'ITEM' }],
      },
    }),
  },
  {
    name: 'tarifaDeVenda',
    group: 'mercado',
    pattern: /^\/sites\/MLB\/listing_prices$/,
    answer: ({ query }) => ({
      body: {
        listing_type_id: query.get('listing_type_id'),
        listing_type_name: 'Clássico',
        currency_id: 'BRL',
        sale_fee_amount: 12.5,
        sale_fee_details: { percentage_fee: 11.5, fixed_fee: 6, gross_amount: 12.5 },
      },
    }),
  },
]
