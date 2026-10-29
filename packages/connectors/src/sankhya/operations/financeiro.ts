import { z } from 'zod'
import { defineOperation } from '../../kernel/operation.ts'
import { restAnswer } from '../answers.ts'
import { firstEmpresaPage } from './cadastros.ts'
import { Code, Date_, get, maybe, Page } from './shared.ts'

const Titulos = z.object({
  financeiros: z.array(
    z.object({
      codigoFinanceiro: Code,
      origemFinanceiro: maybe(z.string()),
      codigoEmpresa: maybe(Code),
      nomeEmpresa: maybe(z.string()),
      codigoParceiro: maybe(Code),
      nomeParceiro: maybe(z.string()),
      codigoNatureza: maybe(Code),
      nomeNatureza: maybe(z.string()),
      codigoCentroResultado: maybe(Code),
      codigoTipoPagamento: maybe(Code),
      numeroNota: maybe(Code),
      dataNegociacao: maybe(z.string()),
      dataVencimento: maybe(z.string()),
      dataBaixa: maybe(z.string()),
      numeroParcela: maybe(Code),
      valorParcela: maybe(z.number()),
      valorBaixa: maybe(z.number()),
      observacao: maybe(z.string()),
    }),
  ),
  pagination: maybe(z.object({ hasMore: maybe(z.boolean()) })),
})

/** The filters the two financial lists share. */
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
    'Lista os títulos a receber de uma empresa (parceiro, natureza, vencimento, valor, baixa); a página começa em 1 e `pagination.hasMore` diz se há outra. `statusFinanceiro`: 1 aberto, 2 baixado, 3 todos.',
  label: 'Contas a receber',
  input: TitulosInput,
  output: Titulos,
  probe: firstEmpresaPage,
  request: (input) => get('/v1/financeiros/receitas', input),
  answer: (answer) => restAnswer(answer, Titulos, { financeiros: [] }),
})

export const contasAPagar = defineOperation({
  id: 'contasAPagar',
  class: 'read' as const,
  subject: 'financeiro',
  idempotent: true,
  summary:
    'Lista os títulos a pagar de uma empresa (parceiro, natureza, vencimento, valor, baixa); a página começa em 1 e `pagination.hasMore` diz se há outra. `statusFinanceiro`: 1 aberto, 2 baixado, 3 todos.',
  label: 'Contas a pagar',
  input: TitulosInput,
  output: Titulos,
  probe: firstEmpresaPage,
  request: (input) => get('/v1/financeiros/despesas', input),
  answer: (answer) => restAnswer(answer, Titulos, { financeiros: [] }),
})

const TiposPagamento = z
  .array(
    z.object({
      codigoTipoPagamento: Code,
      nome: maybe(z.string()),
      ativo: maybe(z.boolean()),
      subTipoPagamento: maybe(z.number().int()),
    }),
  )
  .transform((tiposPagamento) => ({ tiposPagamento }))

export const tiposPagamento = defineOperation({
  id: 'tiposPagamento',
  class: 'read' as const,
  subject: 'financeiro',
  idempotent: true,
  summary:
    'Lista os tipos de pagamento (código, nome, subtipo); a página começa em 1 e a lista não diz quando acaba.',
  label: 'Tipos de pagamento',
  input: z.object({ page: Page(1), subTipoPagamento: z.number().int().optional() }),
  output: TiposPagamento,
  probe: () => ({ page: 1 }),
  request: (input) => get('/v1/financeiros/tipos-pagamento', input),
  answer: (answer) => restAnswer(answer, TiposPagamento),
})
