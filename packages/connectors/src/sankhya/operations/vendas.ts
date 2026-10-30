import { z } from 'zod'
import { defineOperation, get } from '../../kernel/operation.ts'
import { rows } from '../answers.ts'
import { empresaPage, empresas } from './cadastros.ts'
import { Code, DashDate, Date_, firstCode, Page } from './shared.ts'

/** The filters the orders and the invoices share; the order route ignores `codigoNota` (measured 2026-10-30), so only the invoices take it. */
const Janela = z.object({
  codigoEmpresa: Code,
  page: Page(0),
  dataNegociacaoInicio: Date_.optional(),
  dataNegociacaoFinal: Date_.optional(),
  codigoCliente: Code.optional(),
})

export const pedidos = defineOperation({
  id: 'pedidos',
  class: 'read' as const,
  subject: 'vendas',
  idempotent: true,
  summary:
    'Lista os pedidos de venda de uma empresa (nota, cliente, vendedor, valor e itens), uma página por chamada; a página começa em 0.',
  label: 'Pedidos',
  input: Janela.extend({ confirmada: z.boolean().optional(), pendente: z.boolean().optional() }),
  ...rows({ list: 'pedido' }),
  from: [empresas.id],
  probe: empresaPage(0),
  request: (input) => get('/v1/vendas/pedidos', input),
})

export const notasFiscais = defineOperation({
  id: 'notasFiscais',
  class: 'read' as const,
  subject: 'vendas',
  idempotent: true,
  summary:
    'Lista as notas fiscais de venda de uma empresa (número, cliente, tipo de operação, valor, status da NF-e), sem os itens; a página começa em 0.',
  label: 'Notas fiscais',
  input: Janela.extend({ statusNFe: z.number().int().optional(), codigoNota: Code.optional() }),
  ...rows({ list: 'nota' }),
  from: [empresas.id],
  probe: empresaPage(0),
  request: (input) => get('/v1/vendas/nfe', input),
})

export const notaFiscal = defineOperation({
  id: 'notaFiscal',
  class: 'read' as const,
  subject: 'vendas',
  idempotent: true,
  summary: 'Lê uma nota fiscal de venda inteira pelo código: itens, impostos e parcelas.',
  label: 'Nota fiscal com itens',
  input: z.object({ codigoNota: Code }),
  ...rows({ list: 'nota' }),
  from: [notasFiscais.id],
  probe: (earlier) => {
    const codigoNota = firstCode(earlier, notasFiscais.id, 'codigoNota')
    return codigoNota === undefined ? null : { codigoNota }
  },
  request: ({ codigoNota }) => get(`/v1/vendas/nfe/${codigoNota}`, {}),
})

export const devolucoes = defineOperation({
  id: 'devolucoes',
  class: 'read' as const,
  subject: 'vendas',
  idempotent: true,
  summary:
    'Lista as notas de devolução de venda de uma empresa, sem os itens; a página começa em 0 e as datas vão como dd-mm-aaaa.',
  label: 'Devoluções',
  input: z.object({
    codigoEmpresa: Code,
    page: Page(0),
    dataNegociacaoInicio: DashDate.optional(),
    dataNegociacaoFinal: DashDate.optional(),
    codigoCliente: Code.optional(),
  }),
  ...rows({ list: 'nota' }),
  from: [empresas.id],
  probe: empresaPage(0),
  request: (input) => get('/v1/vendas/nfe/devolucoes', input),
})

export const notasCanceladas = defineOperation({
  id: 'notasCanceladas',
  class: 'read' as const,
  subject: 'vendas',
  idempotent: true,
  summary:
    'Lista as notas fiscais canceladas de uma empresa (número, cliente, motivo, data); a página começa em 0 e as datas de cancelamento vão como dd-mm-aaaa.',
  label: 'Notas canceladas',
  input: z.object({
    codigoEmpresa: Code,
    page: Page(0),
    dataCancelamentoInicio: DashDate.optional(),
    dataCancelamentoFinal: DashDate.optional(),
  }),
  ...rows({ list: 'registros' }),
  from: [empresas.id],
  probe: empresaPage(0),
  request: (input) => get('/v1/vendas/nfe/canceladas', input),
})
