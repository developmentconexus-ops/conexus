import { EMPRESAS, json, paged, retornoErro } from './fake-data.ts'
import { CLIENTES, PEDIDOS, PRODUTOS } from './fake-rows.ts'
import {
  CENTROS,
  FINANCEIROS,
  GRUPOS,
  NATUREZAS,
  NOTAS,
  PRECOS,
  VENDEDORES,
} from './fake-rows-more.ts'

/** A route of the fake: the operation it answers (the name a switch refuses it by) and how. */
type Route = {
  name: string
  pattern: RegExp
  answer(query: URLSearchParams, match: RegExpExecArray): Response
}

/** The list the route holds, in a page, wrapped as its answer shapes it. */
function listOf<T>(rows: readonly T[], query: URLSearchParams, from: 0 | 1, key = 'page') {
  const size = 2
  const index = Number(query.get(key) ?? from) - from
  return {
    page: rows.slice(index * size, (index + 1) * size),
    more: (index + 1) * size < rows.length,
  }
}

function metadados(query: URLSearchParams, total: number, more: boolean) {
  return {
    paginaAtual: Number(query.get('page')),
    totalPaginas: Math.max(1, Math.ceil(total / 2)),
    totalRegistros: total,
    possuiMaisPaginas: more,
  }
}

function needs(query: URLSearchParams, ...names: string[]) {
  return names.every((name) => query.has(name))
    ? null
    : retornoErro(`${names.join(' e ')} são obrigatórios`)
}

/** Notes of one company, wrapped as the nfe lists answer. */
function notas(query: URLSearchParams, rows: readonly unknown[]) {
  const refused = needs(query, 'codigoEmpresa', 'page')
  if (refused) return refused
  const { page, more } = listOf(rows, query, 1)
  return json({ registros: page, metadados: metadados(query, rows.length, more) })
}

function titulos(query: URLSearchParams) {
  const refused = needs(query, 'codigoEmpresa')
  if (refused) return refused
  const { page, more } = listOf(FINANCEIROS, query, 1)
  return json({
    financeiros: page,
    pagination: { page: Number(query.get('page') ?? 1), pageSize: 2, hasMore: more },
  })
}

function precos(query: URLSearchParams, rows: readonly unknown[]) {
  const { page, more } = listOf(rows, query, 1, 'pagina')
  return json({
    precos: page,
    page: Number(query.get('pagina') ?? 1),
    numeroRegistros: page.length,
    temMaisRegistros: more,
  })
}

const ROUTES: readonly Route[] = [
  {
    name: 'empresas',
    pattern: /^\/v1\/empresas$/,
    answer: (q) => json({ empresas: paged(EMPRESAS, q, 0).page }),
  },
  {
    name: 'produtos',
    pattern: /^\/v1\/produtos$/,
    answer: (q) => json({ produtos: paged(PRODUTOS, q, 0).page }),
  },
  {
    name: 'clientes',
    pattern: /^\/v1\/parceiros\/clientes$/,
    answer: (q) => {
      const { page, more } = paged(CLIENTES, q, 1)
      return json({ clientes: page, temMaisRegistros: more })
    },
  },
  {
    name: 'pedidos',
    pattern: /^\/v1\/vendas\/pedidos$/,
    answer: (q) => {
      const empresa = Number(q.get('codigoEmpresa'))
      if (!Number.isInteger(empresa) || !q.has('page'))
        return retornoErro('codigoEmpresa e page são obrigatórios')
      const nota = q.get('codigoNota')
      const rows = PEDIDOS.filter(
        (p) => p.codigoEmpresa === empresa && (nota === null || p.codigoNota === Number(nota)),
      )
      return json({
        registros: paged(rows, q, 1).page,
        metadados: metadados(q, rows.length, paged(rows, q, 1).more),
      })
    },
  },
  {
    name: 'vendedores',
    pattern: /^\/v1\/vendedores$/,
    answer: (q) => json({ vendedores: paged(VENDEDORES, q, 0).page }),
  },
  // The documentation shows the one type of operation as an object, not a list.
  {
    name: 'tiposOperacao',
    pattern: /^\/v1\/tipos-operacao$/,
    answer: () => json({ codigoTipoOperacao: 1100, nome: 'Venda', tipoMovimento: 3, ativo: true }),
  },
  {
    name: 'naturezas',
    pattern: /^\/v1\/naturezas$/,
    answer: (q) => json(paged(NATUREZAS, q, 1).page),
  },
  {
    name: 'centrosResultado',
    pattern: /^\/v1\/centros-resultado$/,
    answer: (q) => json(paged(CENTROS, q, 1).page),
  },
  {
    name: 'gruposProduto',
    pattern: /^\/v1\/grupos-produto$/,
    answer: (q) => json({ grupos: paged(GRUPOS, q, 0).page }),
  },
  {
    name: 'notasFiscais',
    pattern: /^\/v1\/vendas\/nfe$/,
    answer: (q) =>
      notas(
        q,
        NOTAS.map(({ itens: _itens, financeiros: _financeiros, ...nota }) => nota),
      ),
  },
  {
    name: 'notaFiscal',
    pattern: /^\/v1\/vendas\/nfe\/(\d+)$/,
    answer: (_q, match) => {
      const nota = NOTAS.find((candidate) => candidate.codigoNota === Number(match[1]))
      return nota ? json(nota) : json({ code: 'NOT_FOUND' }, 404)
    },
  },
  {
    name: 'devolucoes',
    pattern: /^\/v1\/vendas\/nfe\/devolucoes$/,
    answer: (q) =>
      notas(q, [
        {
          ...NOTAS[0],
          codigoNota: 203,
          numeroNota: 7003,
          codigoTipoOperacao: 1200,
          nomeTipoOperacao: 'Devolução de venda',
        },
      ]),
  },
  {
    name: 'notasCanceladas',
    pattern: /^\/v1\/vendas\/nfe\/canceladas$/,
    answer: (q) => {
      const refused = needs(q, 'codigoEmpresa', 'page')
      if (refused) return refused
      const registros = [
        {
          codigoNota: 204,
          numeroNota: 7004,
          serieNota: '1',
          codigoEmpresa: 1,
          nomeEmpresa: 'Empresa Alfa',
          codigoCliente: 1,
          nomeCliente: 'Cliente Um',
          chaveNFe: '00000000000000000000000000000000000000000004',
          status: 'Cancelada',
          valorTotal: 80,
          dataEmissao: '2026-10-03',
          dataCancelamento: '2026-10-04',
          motivoCancelamento: 'Pedido em duplicidade',
        },
      ]
      return json({
        registros,
        metadados: { paginaAtual: Number(q.get('page')), totalRegistros: registros.length },
      })
    },
  },
  {
    name: 'estoque',
    pattern: /^\/v1\/estoque\/produtos$/,
    answer: () =>
      json({
        estoque: [
          { codigoProduto: 11, codigoEmpresa: 1, codigoLocal: 1, estoque: 40 },
          { codigoProduto: 12, codigoEmpresa: 1, codigoLocal: 1, controle: 'L1', estoque: 12.5 },
        ],
      }),
  },
  {
    name: 'locaisEstoque',
    pattern: /^\/v1\/estoque\/locais$/,
    answer: () =>
      json([{ codigoLocal: 1, descricaoLocal: 'Depósito', grau: 1, analitico: true, ativo: true }]),
  },
  { name: 'contasAReceber', pattern: /^\/v1\/financeiros\/receitas$/, answer: (q) => titulos(q) },
  { name: 'contasAPagar', pattern: /^\/v1\/financeiros\/despesas$/, answer: (q) => titulos(q) },
  {
    name: 'tiposPagamento',
    pattern: /^\/v1\/financeiros\/tipos-pagamento$/,
    answer: () =>
      json([{ codigoTipoPagamento: 1, nome: 'Boleto', ativo: true, subTipoPagamento: 2 }]),
  },
  {
    name: 'precosDoProduto',
    pattern: /^\/v1\/precos\/produto\/(\d+)$/,
    answer: (q, m) =>
      precos(
        q,
        PRECOS.filter((p) => p.codigoProduto === Number(m[1])),
      ),
  },
  {
    name: 'precosDaTabela',
    pattern: /^\/v1\/precos\/tabela\/(\d+)$/,
    answer: (q, m) =>
      precos(
        q,
        PRECOS.filter((p) => p.codigoTabela === Number(m[1])),
      ),
  },
  {
    name: 'transportadoras',
    pattern: /^\/v1\/parceiros\/transportadoras$/,
    answer: () =>
      json({
        transportadoras: [
          {
            ativo: true,
            codigoTransportadora: 5,
            nome: 'Transportadora Cinco',
            cnpj: '00000000000500',
            endereco: { cidade: 'Cidade Um', uf: 'SP' },
          },
        ],
        pagination: { page: '1', offset: '0', total: '1', hasMore: false },
      }),
  },
  {
    name: 'ordensCarga',
    pattern: /^\/v1\/logistica\/ordens-carga$/,
    answer: (q) => {
      const refused = needs(q, 'page')
      if (refused) return refused
      return json({
        ordensCarga: [
          {
            codigoOrdemCarga: 55,
            codigoEmpresa: 1,
            nomeEmpresa: 'Empresa Alfa',
            dataInicio: '2026-10-05',
            codigoVeiculo: 3,
            codigoTransportadora: 5,
            nomeTransportadora: 'Transportadora Cinco',
            tipo: 1,
            situacao: 1,
          },
        ],
        pagination: { page: '1', offset: '0', total: '1', hasMore: 'false' },
      })
    },
  },
]

/** The route a REST path belongs to, or null when the fake has no such route. */
export function routeOf(
  path: string,
): { name: string; answer(query: URLSearchParams): Response } | null {
  for (const route of ROUTES) {
    const match = route.pattern.exec(path)
    if (match) return { name: route.name, answer: (query) => route.answer(query, match) }
  }
  return null
}
