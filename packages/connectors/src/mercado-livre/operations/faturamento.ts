import { z } from 'zod'
import { get } from '../../kernel/operation.ts'
import { fromEarlier, Id, Limit, maybe, Offset, PathId, readOf, sellerOf } from './shared.ts'
import { firstOrder, pedidos } from './vendas.ts'

const Periodos = z.object({
  results: z.array(
    z.object({
      key: z.string(),
      period: maybe(z.object({ date_from: maybe(z.string()), date_to: maybe(z.string()) })),
      amount: maybe(z.number()),
      unpaid_amount: maybe(z.number()),
      expiration_date: maybe(z.string()),
    }),
  ),
})

export const periodosDeFaturamento = readOf({
  id: 'periodosDeFaturamento',
  subject: 'faturamento',
  docs: 'faturamento-relatorios',
  summary:
    'Lista os períodos mensais de faturamento do Mercado Livre para o vendedor: a chave, as datas e os valores.',
  label: 'Períodos de faturamento',
  input: z.object({ offset: Offset.optional(), limit: Limit(12).optional() }),
  output: Periodos,
  probe: () => ({}),
  request: (input) =>
    get('/billing/integration/monthly/periods', {
      group: 'ML',
      offset: input.offset,
      limit: input.limit,
    }),
})

const Cobrancas = z.object({
  bill_includes: maybe(z.object({ total_amount: maybe(z.number()) })),
  results: z
    .array(
      z.object({
        legal_document_number: maybe(z.string()),
        charge_info: maybe(
          z.object({ detail_amount: maybe(z.number()), detail_type: maybe(z.string()) }),
        ),
      }),
    )
    .default([]),
})

export const cobrancasDoPeriodo = readOf({
  id: 'cobrancasDoPeriodo',
  subject: 'faturamento',
  docs: 'faturamento-relatorios',
  summary:
    'Mostra o resumo das cobranças de um período de faturamento: o total e cada cobrança com o tipo e o valor.',
  label: 'Cobranças do período',
  input: z.object({ key: PathId }),
  output: Cobrancas,
  from: [periodosDeFaturamento.id],
  probe: (earlier) =>
    fromEarlier(earlier, periodosDeFaturamento, ({ results }) =>
      results[0] ? { key: results[0].key } : null,
    ),
  request: (input) =>
    get(`/billing/integration/periods/key/${input.key}/summary/details`, { group: 'ML' }),
})

/** The invoice without its recipient: the buyer's CPF or CNPJ is on it. */
const NotaFiscal = z.object({
  id: maybe(Id),
  status: maybe(z.string()),
  invoice_series: maybe(z.string()),
  invoice_number: maybe(z.string()),
  issued_date: maybe(z.string()),
})

export const notaFiscalDoPedido = readOf({
  id: 'notaFiscalDoPedido',
  subject: 'faturamento',
  docs: 'faturador',
  summary:
    'Mostra a nota fiscal emitida para um pedido: série, número, status e data. O destinatário não vem.',
  label: 'Nota fiscal do pedido',
  input: z.object({ orderId: PathId }),
  output: NotaFiscal,
  from: [pedidos.id],
  probe: firstOrder,
  request: (input, account) => get(`/users/${sellerOf(account)}/invoices/orders/${input.orderId}`),
})
