import { z } from 'zod'
import { get } from '../../kernel/operation.ts'
import { chain, Limit, Offset, PathId, readOf, sellerOf } from './shared.ts'
import { firstOrder, pedidos } from './vendas.ts'

/** The billing reads ask for one kind of document; the bill is the default. */
const DocumentType = z.enum(['BILL', 'CREDIT_NOTE'])

export const periodosDeFaturamento = readOf({
  id: 'periodosDeFaturamento',
  subject: 'faturamento',
  docs: 'relatorios-de-faturamento',
  summary:
    'Lista os períodos mensais de faturamento do Mercado Livre para o vendedor: a chave, as datas e os valores.',
  label: 'Períodos de faturamento',
  input: z.object({
    documentType: DocumentType.optional(),
    offset: Offset.optional(),
    limit: Limit(12).optional(),
  }),
  list: 'results',
  probe: () => ({}),
  request: (input) =>
    get('/billing/integration/monthly/periods', {
      group: 'ML',
      document_type: input.documentType ?? 'BILL',
      offset: input.offset,
      limit: input.limit,
    }),
})

export const cobrancasDoPeriodo = readOf({
  id: 'cobrancasDoPeriodo',
  subject: 'faturamento',
  docs: 'relatorios-de-faturamento',
  summary:
    'Mostra o resumo de um período de faturamento numa linha: o período, o total, as cobranças e bonificações com o tipo e o valor, e o que foi pago.',
  label: 'Cobranças do período',
  input: z.object({ key: PathId, documentType: DocumentType.optional() }),
  list: null,
  from: [periodosDeFaturamento.id],
  probe: chain(periodosDeFaturamento.id, 'key', (key) => ({ key })),
  request: (input) =>
    get(`/billing/integration/periods/key/${input.key}/summary/details`, {
      group: 'ML',
      document_type: input.documentType ?? 'BILL',
    }),
})

export const notaFiscalDoPedido = readOf({
  id: 'notaFiscalDoPedido',
  subject: 'faturamento',
  docs: 'obtendo-nota-fiscal',
  summary:
    'Mostra a nota fiscal emitida para um pedido: série, número, status e data. O destinatário não vem.',
  label: 'Nota fiscal do pedido',
  input: z.object({ orderId: PathId }),
  list: null,
  omit: ['recipient'], // the buyer's CPF or CNPJ is on it
  from: [pedidos.id],
  probe: firstOrder,
  request: (input, account) => get(`/users/${sellerOf(account)}/invoices/orders/${input.orderId}`),
})
