import { z } from 'zod'
import { defineOperation } from '../../kernel/operation.ts'
import { rows } from '../answers.ts'
import { empresaPage, empresas } from './cadastros.ts'
import { Code, Date_, get, Page } from './shared.ts'

/** The filters the two financial lists share; their pages start at 1, where the other routes start at 0. */
const TitulosInput = z.object({
  codigoEmpresa: Code,
  page: Page(1),
  codigoParceiro: Code.optional(),
  statusFinanceiro: z.number().int().optional(),
  dataVencimentoInicio: Date_.optional(),
  dataVencimentoFinal: Date_.optional(),
  dataNegociacaoInicio: Date_.optional(),
  dataNegociacaoFinal: Date_.optional(),
})

export const contasAReceber = defineOperation({
  id: 'contasAReceber',
  class: 'read' as const,
  subject: 'financeiro',
  idempotent: true,
  summary:
    'Lista os títulos a receber de uma empresa (parceiro, natureza, vencimento, valor, baixa); a página começa em 1. `statusFinanceiro`: 1 aberto, 2 baixado, 3 todos.',
  label: 'Contas a receber',
  input: TitulosInput,
  ...rows({ list: 'financeiros' }),
  from: [empresas.id],
  probe: empresaPage(1),
  request: (input) => get('/v1/financeiros/receitas', input),
})

export const contasAPagar = defineOperation({
  id: 'contasAPagar',
  class: 'read' as const,
  subject: 'financeiro',
  idempotent: true,
  summary:
    'Lista os títulos a pagar de uma empresa (parceiro, natureza, vencimento, valor, baixa); a página começa em 1. `statusFinanceiro`: 1 aberto, 2 baixado, 3 todos.',
  label: 'Contas a pagar',
  input: TitulosInput,
  ...rows({ list: 'financeiros' }),
  from: [empresas.id],
  probe: empresaPage(1),
  request: (input) => get('/v1/financeiros/despesas', input),
})

export const tiposPagamento = defineOperation({
  id: 'tiposPagamento',
  class: 'read' as const,
  subject: 'financeiro',
  idempotent: true,
  summary:
    'Lista os tipos de pagamento (código, nome, subtipo); a página começa em 0. `subTipoPagamento` filtra por subtipo.',
  label: 'Tipos de pagamento',
  input: z.object({ page: Page(0), subTipoPagamento: z.number().int().optional() }),
  ...rows({ list: 'data' }),
  probe: () => ({ page: 0 }),
  request: (input) => get('/v1/financeiros/tipos-pagamento', input),
})
