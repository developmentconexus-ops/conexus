import { z } from 'zod'
import { defineOperation } from '../../kernel/operation.ts'
import { restAnswer } from '../answers.ts'
import { empresas, firstEmpresaPage } from './cadastros.ts'
import { Code, DashDate, Date_, get, Metadados, maybe, Page } from './shared.ts'

const Item = z.object({
  sequencia: Code,
  codigoProduto: Code,
  descricaoProduto: maybe(z.string()),
  quantidade: z.number(),
  unidade: maybe(z.string()),
  valorUnitario: z.number(),
  valorTotal: z.number(),
})

/** What a sale document says of itself, whether it is an order or an invoice. */
const Documento = z.object({
  codigoNota: Code,
  numeroNota: maybe(Code),
  serieNota: maybe(z.string()),
  cliente: maybe(z.object({ nome: maybe(z.string()), cnpjCpf: maybe(z.string()) })),
  dataNegociacao: maybe(z.string()),
  confirmada: maybe(z.boolean()),
  pendente: maybe(z.boolean()),
  codigoVendedor: maybe(Code),
  nomeVendedor: maybe(z.string()),
  valorNota: maybe(z.number()),
})

/** The filters the orders and the invoices share. */
const Janela = z.object({
  codigoEmpresa: Code,
  page: Page(1),
  dataNegociacaoInicio: Date_.optional(),
  dataNegociacaoFinal: Date_.optional(),
  codigoCliente: Code.optional(),
  codigoNota: Code.optional(),
})

const Pedidos = z.object({
  registros: z.array(Documento.extend({ codigoEmpresa: Code, itens: z.array(Item) })),
  metadados: Metadados,
})

export const pedidos = defineOperation({
  id: 'pedidos',
  class: 'read' as const,
  subject: 'vendas',
  idempotent: true,
  summary:
    'Lista os pedidos de venda de uma empresa (nota, cliente, vendedor, valor e itens), uma página por chamada; a página começa em 1.',
  label: 'Pedidos',
  input: Janela.extend({ confirmada: z.boolean().optional(), pendente: z.boolean().optional() }),
  output: Pedidos,
  from: [empresas.id],
  probe: firstEmpresaPage,
  request: (input) => get('/v1/vendas/pedidos', input),
  answer: (answer) =>
    restAnswer(answer, Pedidos, {
      registros: [],
      metadados: { paginaAtual: 1, totalPaginas: 1, possuiMaisPaginas: false },
    }),
})

const Tax = z.object({
  tipo: z.string(),
  cst: maybe(z.string()),
  aliquota: maybe(z.number()),
  valorBase: maybe(z.number()),
  valorImposto: maybe(z.number()),
})

const ItemTaxes = z.object({
  sequencia: Code,
  codigoProduto: Code,
  cfop: maybe(z.string()),
  ncm: maybe(z.string()),
  cst: maybe(z.string()),
  valorICMS: maybe(z.number()),
  valorIPI: maybe(z.number()),
  impostos: z
    .array(Tax)
    .nullish()
    .transform((value) => value ?? []),
})

/** What the pedido read answers, for the items alone: the schema of the body and the value taken from it. */
const PedidoItens = z
  .object({ registros: z.array(z.object({ itens: z.array(ItemTaxes) })) })
  .transform(({ registros }) => ({ itens: registros[0]?.itens ?? [] }))

/** The API has no stored-tax read, only a calculation; the taxes of one pedido are the ones on its items. */
export const impostosDoPedido = defineOperation({
  id: 'impostosDoPedido',
  class: 'read' as const,
  subject: 'vendas',
  idempotent: true,
  summary:
    'Lê os impostos de um pedido (CFOP, NCM, CST, ICMS, IPI e os demais) a partir dos itens dele.',
  label: 'Impostos dos pedidos',
  input: z.object({ codigoEmpresa: Code, codigoNota: Code }),
  output: PedidoItens,
  from: [pedidos.id],
  probe: (earlier) => {
    const first = Pedidos.safeParse(earlier.get(pedidos.id)).data?.registros[0]
    return first ? { codigoEmpresa: first.codigoEmpresa, codigoNota: first.codigoNota } : null
  },
  request: ({ codigoEmpresa, codigoNota }) =>
    get('/v1/vendas/pedidos', { codigoEmpresa, codigoNota, page: 1 }),
  answer: (answer) => restAnswer(answer, PedidoItens),
})

const Parcela = z.object({
  sequencia: maybe(Code),
  tipoPagamento: maybe(Code),
  dataVencimento: maybe(z.string()),
  dataBaixa: maybe(z.string()),
  valorParcela: maybe(z.number()),
})

const Nota = Documento.extend({
  codigoEmpresa: maybe(Code),
  codigoTipoOperacao: maybe(Code),
  nomeTipoOperacao: maybe(z.string()),
  chaveNFe: maybe(z.string()),
  statusNFe: maybe(z.string()),
})

const Notas = z.object({ registros: z.array(Nota), metadados: Metadados })

export const notasFiscais = defineOperation({
  id: 'notasFiscais',
  class: 'read' as const,
  subject: 'vendas',
  idempotent: true,
  summary:
    'Lista as notas fiscais de venda de uma empresa (número, cliente, tipo de operação, valor, status da NF-e), sem os itens; a página começa em 1.',
  label: 'Notas fiscais',
  input: Janela.extend({ statusNFe: z.number().int().optional() }),
  output: Notas,
  from: [empresas.id],
  probe: firstEmpresaPage,
  request: (input) => get('/v1/vendas/nfe', input),
  answer: (answer) =>
    restAnswer(answer, Notas, {
      registros: [],
      metadados: { paginaAtual: 1, totalPaginas: 1, possuiMaisPaginas: false },
    }),
})

const NotaCompleta = Nota.extend({
  itens: z
    .array(Item.extend({ impostos: ItemTaxes.shape.impostos }))
    .nullish()
    .transform((value) => value ?? []),
  financeiros: z
    .array(Parcela)
    .nullish()
    .transform((value) => value ?? []),
})

export const notaFiscal = defineOperation({
  id: 'notaFiscal',
  class: 'read' as const,
  subject: 'vendas',
  idempotent: true,
  summary: 'Lê uma nota fiscal de venda inteira pelo código: itens, impostos e parcelas.',
  label: 'Nota fiscal com itens',
  input: z.object({ codigoNota: Code }),
  output: NotaCompleta,
  from: [notasFiscais.id],
  probe: (earlier) => {
    const first = Notas.safeParse(earlier.get(notasFiscais.id)).data?.registros[0]
    return first ? { codigoNota: first.codigoNota } : null
  },
  request: ({ codigoNota }) => get(`/v1/vendas/nfe/${codigoNota}`, {}),
  answer: (answer) => restAnswer(answer, NotaCompleta),
})

export const devolucoes = defineOperation({
  id: 'devolucoes',
  class: 'read' as const,
  subject: 'vendas',
  idempotent: true,
  summary:
    'Lista as notas de devolução de venda de uma empresa, sem os itens; a página começa em 1 e as datas vão como dd-mm-aaaa.',
  label: 'Devoluções',
  input: z.object({
    codigoEmpresa: Code,
    page: Page(1),
    dataNegociacaoInicio: DashDate.optional(),
    dataNegociacaoFinal: DashDate.optional(),
    codigoCliente: Code.optional(),
  }),
  output: Notas,
  from: [empresas.id],
  probe: firstEmpresaPage,
  request: (input) => get('/v1/vendas/nfe/devolucoes', input),
  answer: (answer) =>
    restAnswer(answer, Notas, {
      registros: [],
      metadados: { paginaAtual: 1, totalPaginas: 1, possuiMaisPaginas: false },
    }),
})

const Canceladas = z.object({
  registros: z.array(
    z.object({
      codigoNota: Code,
      numeroNota: maybe(Code),
      serieNota: maybe(z.string()),
      codigoEmpresa: maybe(Code),
      codigoCliente: maybe(Code),
      nomeCliente: maybe(z.string()),
      chaveNFe: maybe(z.string()),
      valorTotal: maybe(z.number()),
      dataEmissao: maybe(z.string()),
      dataCancelamento: maybe(z.string()),
      motivoCancelamento: maybe(z.string()),
    }),
  ),
  metadados: maybe(z.object({ paginaAtual: maybe(Code), totalRegistros: maybe(Code) })),
})

export const notasCanceladas = defineOperation({
  id: 'notasCanceladas',
  class: 'read' as const,
  subject: 'vendas',
  idempotent: true,
  summary:
    'Lista as notas fiscais canceladas de uma empresa (número, cliente, motivo, data); a página começa em 1 e as datas de cancelamento vão como dd-mm-aaaa.',
  label: 'Notas canceladas',
  input: z.object({
    codigoEmpresa: Code,
    page: Page(1),
    dataCancelamentoInicio: DashDate.optional(),
    dataCancelamentoFinal: DashDate.optional(),
  }),
  output: Canceladas,
  from: [empresas.id],
  probe: firstEmpresaPage,
  request: (input) => get('/v1/vendas/nfe/canceladas', input),
  answer: (answer) => restAnswer(answer, Canceladas, { registros: [], metadados: null }),
})
