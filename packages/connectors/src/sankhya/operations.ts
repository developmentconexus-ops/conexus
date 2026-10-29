import { z } from 'zod'
import type { ProviderRequest } from '../kernel/operation.ts'
import { defineOperation, OperationId } from '../kernel/operation.ts'
import { restAnswer } from './answers.ts'

/** A field the API may leave out or send as null: either way the kit hands on `null`. */
function maybe<T extends z.ZodType>(schema: T) {
  return schema.nullish().transform((value) => value ?? null)
}

const EMPRESAS = OperationId.parse('empresas')
const PEDIDOS = OperationId.parse('pedidos')

function Page(from: 0 | 1) {
  return z.number().int().min(from)
}
const Date_ = z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/)
const DateTime = z.string().regex(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/)

function get(
  path: `/${string}`,
  query: Readonly<Record<string, string | number | boolean | undefined>>,
): ProviderRequest {
  const set = Object.entries(query).flatMap(([name, value]) =>
    value === undefined ? [] : [[name, String(value)] as const],
  )
  return { method: 'GET', path, query: Object.fromEntries(set), body: undefined }
}

const Empresas = z.object({
  empresas: z.array(
    z.object({
      codigoEmpresa: z.number().int(),
      nomeFantasia: maybe(z.string()),
      razaoSocial: maybe(z.string()),
    }),
  ),
})

const empresas = defineOperation({
  id: 'empresas',
  class: 'read' as const,
  idempotent: true,
  summary:
    'Lista as empresas do Sankhya (código e nome), uma página por chamada; a página começa em 0.',
  label: 'Empresas',
  input: z.object({ page: Page(0) }),
  output: Empresas,
  probe: () => ({ page: 0 }),
  request: ({ page }) => get('/v1/empresas', { page }),
  answer: (answer) => restAnswer(answer, Empresas),
})

const Item = z.object({
  sequencia: z.number().int(),
  codigoProduto: z.number().int(),
  descricaoProduto: maybe(z.string()),
  quantidade: z.number(),
  unidade: maybe(z.string()),
  valorUnitario: z.number(),
  valorTotal: z.number(),
})

const Pedidos = z.object({
  registros: z.array(
    z.object({
      codigoNota: z.number().int(),
      numeroNota: maybe(z.number().int()),
      serieNota: maybe(z.string()),
      codigoEmpresa: z.number().int(),
      cliente: maybe(z.object({ nome: maybe(z.string()), cnpjCpf: maybe(z.string()) })),
      dataNegociacao: maybe(z.string()),
      confirmada: maybe(z.boolean()),
      pendente: maybe(z.boolean()),
      codigoVendedor: maybe(z.number().int()),
      nomeVendedor: maybe(z.string()),
      valorNota: maybe(z.number()),
      itens: z.array(Item),
    }),
  ),
  metadados: z.object({
    paginaAtual: z.number().int(),
    totalPaginas: z.number().int(),
    possuiMaisPaginas: z.boolean(),
  }),
})

const pedidos = defineOperation({
  id: 'pedidos',
  class: 'read' as const,
  idempotent: true,
  summary:
    'Lista os pedidos de venda de uma empresa (nota, cliente, vendedor, valor e itens), uma página por chamada; a página começa em 1.',
  label: 'Pedidos',
  input: z.object({
    codigoEmpresa: z.number().int(),
    page: Page(1),
    dataNegociacaoInicio: Date_.optional(),
    dataNegociacaoFinal: Date_.optional(),
    codigoCliente: z.number().int().optional(),
    codigoNota: z.number().int().optional(),
    confirmada: z.boolean().optional(),
    pendente: z.boolean().optional(),
  }),
  output: Pedidos,
  probe: (earlier) => {
    const first = Empresas.safeParse(earlier.get(EMPRESAS)).data?.empresas[0]
    return first ? { codigoEmpresa: first.codigoEmpresa, page: 1 } : null
  },
  request: (input) => get('/v1/vendas/pedidos', input),
  answer: (answer) => restAnswer(answer, Pedidos),
})

const Produtos = z.object({
  produtos: z.array(
    z.object({
      codigoProduto: z.number().int(),
      nome: maybe(z.string()),
      complemento: maybe(z.string()),
      referencia: maybe(z.string()),
      codigoGrupoProduto: maybe(z.number().int()),
      nomeGrupoProduto: maybe(z.string()),
      volume: maybe(z.string()),
      marca: maybe(z.string()),
      ativo: maybe(z.union([z.boolean(), z.string()])),
      ncm: maybe(z.string()),
      dataAltercao: maybe(z.string()),
    }),
  ),
})

const produtos = defineOperation({
  id: 'produtos',
  class: 'read' as const,
  idempotent: true,
  summary:
    'Lista os produtos do Sankhya (código, nome, grupo, marca, NCM), uma página por chamada; a página começa em 0.',
  label: 'Produtos',
  input: z.object({ page: Page(0) }),
  output: Produtos,
  probe: () => ({ page: 0 }),
  request: ({ page }) => get('/v1/produtos', { page }),
  answer: (answer) => restAnswer(answer, Produtos),
})

const Clientes = z.object({
  clientes: z.array(
    z.object({
      codigoCliente: z.number().int(),
      tipo: maybe(z.enum(['PF', 'PJ'])),
      cnpjCpf: maybe(z.string()),
      nome: maybe(z.string()),
      razao: maybe(z.string()),
      email: maybe(z.string()),
      endereco: maybe(z.object({ cidade: maybe(z.string()), uf: maybe(z.string()) })),
      camposAdicionais: maybe(z.record(z.string(), z.string())),
    }),
  ),
  temMaisRegistros: z.boolean(),
})

const clientes = defineOperation({
  id: 'clientes',
  class: 'read' as const,
  idempotent: true,
  summary:
    'Lista os clientes do Sankhya (documento, nome, cidade e os campos AD_ da empresa), uma página por chamada; a página começa em 1.',
  label: 'Clientes',
  input: z.object({ page: Page(1), dataHoraAlteracao: DateTime.optional() }),
  output: Clientes,
  probe: () => ({ page: 1 }),
  request: (input) =>
    get('/v1/parceiros/clientes', { ...input, sort_by: 'codigoCliente', sort_order: 'ASC' }),
  answer: (answer) => restAnswer(answer, Clientes),
})

const Tax = z.object({
  tipo: z.string(),
  cst: maybe(z.string()),
  aliquota: maybe(z.number()),
  valorBase: maybe(z.number()),
  valorImposto: maybe(z.number()),
})

const ItemTaxes = z.object({
  sequencia: z.number().int(),
  codigoProduto: z.number().int(),
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

const Impostos = z.object({ itens: z.array(ItemTaxes) })

/** What the pedido read answers, for the items alone. */
const PedidoItens = z
  .object({ registros: z.array(z.object({ itens: z.array(ItemTaxes) })) })
  .transform(({ registros }) => ({ itens: registros[0]?.itens ?? [] }))

/** The API has no stored-tax read, only a calculation; the taxes of one pedido are the ones on its items. */
const impostosDoPedido = defineOperation({
  id: 'impostosDoPedido',
  class: 'read' as const,
  idempotent: true,
  summary:
    'Lê os impostos de um pedido (CFOP, NCM, CST, ICMS, IPI e os demais) a partir dos itens dele.',
  label: 'Impostos dos pedidos',
  input: z.object({ codigoEmpresa: z.number().int(), codigoNota: z.number().int() }),
  output: Impostos,
  probe: (earlier) => {
    const first = Pedidos.safeParse(earlier.get(PEDIDOS)).data?.registros[0]
    return first ? { codigoEmpresa: first.codigoEmpresa, codigoNota: first.codigoNota } : null
  },
  request: ({ codigoEmpresa, codigoNota }) =>
    get('/v1/vendas/pedidos', { codigoEmpresa, codigoNota, page: 1 }),
  answer: (answer) => restAnswer(answer, PedidoItens),
})

export const sankhyaOperations = [empresas, pedidos, produtos, clientes, impostosDoPedido] as const
