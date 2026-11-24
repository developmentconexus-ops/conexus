import { z } from 'zod'
import { get } from '../../kernel/operation.ts'
import { companyProbe, empresas } from './cadastros.ts'
import { Code, Day, defineRoute, Page } from './route.ts'

/** The filters both title lists take; their first page is 1, where most routes start at 0. */
const Titulos = z.strictObject({
  codigoEmpresa: Code,
  page: Page(1),
  codigoParceiro: Code.optional(),
  statusFinanceiro: z.number().int().optional(),
  dataVencimentoInicio: Day.optional(),
  dataVencimentoFinal: Day.optional(),
  dataNegociacaoInicio: Day.optional(),
  dataNegociacaoFinal: Day.optional(),
})

function titulos(kind: 'receber' | 'pagar') {
  const receivable = kind === 'receber'
  return defineRoute({
    id: receivable ? 'contasAReceber' : 'contasAPagar',
    subject: 'financeiro',
    summary: `Lista os títulos a ${kind} de uma empresa (parceiro, natureza, vencimento, valor, baixa); a página começa em 1. \`statusFinanceiro\`: 1 aberto, 2 baixado, 3 todos.`,
    label: receivable ? 'Contas a receber' : 'Contas a pagar',
    input: Titulos,
    rowsAt: 'financeiros',
    from: [empresas.id],
    probe: companyProbe(1),
    request: (input) =>
      get(receivable ? '/v1/financeiros/receitas' : '/v1/financeiros/despesas', input),
  })
}

export const contasAReceber = titulos('receber')
export const contasAPagar = titulos('pagar')

export const tiposPagamento = defineRoute({
  id: 'tiposPagamento',
  subject: 'financeiro',
  summary:
    'Lista os tipos de pagamento (código, nome, subtipo); a página começa em 0. `subTipoPagamento` filtra por subtipo.',
  label: 'Tipos de pagamento',
  input: z.strictObject({ page: Page(0), subTipoPagamento: z.number().int().optional() }),
  rowsAt: 'data',
  probe: () => ({ page: 0 }),
  request: (input) => get('/v1/financeiros/tipos-pagamento', input),
})
