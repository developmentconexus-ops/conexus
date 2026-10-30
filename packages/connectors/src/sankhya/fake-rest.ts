import { EMPRESAS, json, nothingFound, retornoErro } from './fake-data.ts'
import {
  CENTROS,
  CLIENTES,
  ESTOQUE,
  FINANCEIROS,
  GRUPOS,
  LOCAIS,
  NATUREZAS,
  NOTA_COMPLETA,
  NOTAS,
  ORDENS_CARGA,
  PEDIDOS,
  PRECOS,
  PRODUTOS,
  TIPOS_OPERACAO,
  TIPOS_PAGAMENTO,
  TRANSPORTADORAS,
  VENDEDORES,
} from './fake-rows.ts'

/** A route of the fake: the operation it answers (the name a switch refuses it by), the entity its empty 404 names, and how. */
type Route = {
  name: string
  entity: string
  pattern: RegExp
  answer(query: URLSearchParams, match: RegExpExecArray): Response
}

const SIZE = 2

/** The page asked, two rows a page, counted from `from`; null past the end, where the gateway sends its empty 404. */
function slice<T>(rows: readonly T[], query: URLSearchParams, from: 0 | 1, key = 'page') {
  const index = Number(query.get(key) ?? from) - from
  const page = rows.slice(index * SIZE, (index + 1) * SIZE)
  return page.length === 0 ? null : { index, page, more: (index + 1) * SIZE < rows.length }
}

/** A list of one goes out as the element itself, as the gateway sends it. */
function sent<T>(page: readonly T[]): T | readonly T[] {
  return page.length === 1 && page[0] !== undefined ? page[0] : page
}

/** The family most routes belong to: the page from 0 and `pagination` all in text. */
function paginated(entity: string, list: string, rows: readonly unknown[], query: URLSearchParams) {
  const found = slice(rows, query, 0)
  if (!found) return nothingFound(entity)
  const { index, page, more } = found
  return json({
    [list]: sent(page),
    pagination: {
      page: String(index),
      offset: String(index * SIZE),
      total: String(page.length),
      hasMore: String(more),
    },
  })
}

function needs(query: URLSearchParams, ...names: string[]) {
  return names.every((name) => query.has(name))
    ? null
    : retornoErro(`${names.join(' e ')} são obrigatórios`)
}

/** The rows of one company: the reads that need one refuse a call without it. */
function ofEmpresa(entity: string, list: string, rows: readonly unknown[], query: URLSearchParams) {
  return needs(query, 'codigoEmpresa', 'page') ?? paginated(entity, list, rows, query)
}

/** The invoices carry no `pagination`: the list alone. */
function notas(query: URLSearchParams, rows: readonly unknown[]) {
  const refused = needs(query, 'codigoEmpresa', 'page')
  if (refused) return refused
  const found = slice(rows, query, 0)
  return found ? json({ nota: sent(found.page) }) : nothingFound('CabecalhoNota')
}

/** The financial lists count from 1 and send `pagination` in numbers. */
function titulos(query: URLSearchParams, rows: readonly unknown[]) {
  const refused = needs(query, 'codigoEmpresa', 'page')
  if (refused) return refused
  const found = slice(rows, query, 1)
  if (!found) return nothingFound('Financeiro')
  return json({
    pagination: {
      page: found.index + 1,
      pageSize: SIZE,
      total: rows.length,
      totalPages: Math.ceil(rows.length / SIZE),
      hasMore: found.more,
    },
    financeiros: sent(found.page),
  })
}

/** The prices count `pagina` from 1 and say the end with `temMaisRegistros`. */
function precos(query: URLSearchParams, rows: readonly unknown[]) {
  const found = slice(rows, query, 1, 'pagina')
  if (!found) return nothingFound('Preco')
  return json({
    codigo: 1,
    pagina: found.index + 1,
    numeroRegistros: found.page.length,
    temMaisRegistros: found.more,
    tipo: 'SUCESSO',
    mensagem: 'Consulta realizada com sucesso!',
    produtos: found.page,
  })
}

const ROUTES: readonly Route[] = [
  {
    name: 'empresas',
    entity: 'Empresa',
    pattern: /^\/v1\/empresas$/,
    answer: (q) => paginated('Empresa', 'empresas', EMPRESAS, q),
  },
  {
    name: 'produtos',
    entity: 'Produto',
    pattern: /^\/v1\/produtos$/,
    answer: (q) => paginated('Produto', 'produtos', PRODUTOS, q),
  },
  {
    name: 'clientes',
    entity: 'Parceiro',
    pattern: /^\/v1\/parceiros\/clientes$/,
    answer: (q) => paginated('Parceiro', 'clientes', CLIENTES, q),
  },
  {
    name: 'pedidos',
    entity: 'CabecalhoNota',
    pattern: /^\/v1\/vendas\/pedidos$/,
    answer: (q) => ofEmpresa('CabecalhoNota', 'pedido', PEDIDOS, q),
  },
  {
    name: 'vendedores',
    entity: 'Vendedor',
    pattern: /^\/v1\/vendedores$/,
    answer: (q) => paginated('Vendedor', 'vendedores', VENDEDORES, q),
  },
  {
    name: 'tiposOperacao',
    entity: 'TipoOperacao',
    pattern: /^\/v1\/tipos-operacao$/,
    answer: (q) => paginated('TipoOperacao', 'data', TIPOS_OPERACAO, q),
  },
  {
    name: 'naturezas',
    entity: 'Natureza',
    pattern: /^\/v1\/naturezas$/,
    answer: (q) => paginated('Natureza', 'data', NATUREZAS, q),
  },
  {
    name: 'centrosResultado',
    entity: 'CentroResultado',
    pattern: /^\/v1\/centros-resultado$/,
    answer: (q) => paginated('CentroResultado', 'data', CENTROS, q),
  },
  {
    name: 'gruposProduto',
    entity: 'GrupoProduto',
    pattern: /^\/v1\/grupos-produto$/,
    answer: (q) => paginated('GrupoProduto', 'grupos', GRUPOS, q),
  },
  {
    name: 'notasFiscais',
    entity: 'CabecalhoNota',
    pattern: /^\/v1\/vendas\/nfe$/,
    answer: (q) => notas(q, NOTAS),
  },
  {
    name: 'notaFiscal',
    entity: 'CabecalhoNota',
    pattern: /^\/v1\/vendas\/nfe\/(\d+)$/,
    answer: (_q, match) =>
      match[1] === NOTA_COMPLETA.codigoNota
        ? json({ nota: NOTA_COMPLETA })
        : nothingFound('CabecalhoNota'),
  },
  {
    name: 'devolucoes',
    entity: 'CabecalhoNota',
    pattern: /^\/v1\/vendas\/nfe\/devolucoes$/,
    answer: (q) => notas(q, [{ ...NOTAS[0], codigoNota: '203', codigoTipoOperacao: '1200' }]),
  },
  {
    name: 'notasCanceladas',
    entity: 'CabecalhoNota',
    pattern: /^\/v1\/vendas\/nfe\/canceladas$/,
    answer: (q) => {
      const refused = needs(q, 'codigoEmpresa', 'page')
      if (refused) return refused
      return json({
        metadados: {},
        registros: [{ codigoNota: 204, numeroNota: 7004, codigoEmpresa: 1, valorTotal: 80 }],
        pagination: { page: '0', offset: '0', total: '1', hasMore: 'false' },
      })
    },
  },
  {
    name: 'estoque',
    entity: 'Estoque',
    pattern: /^\/v1\/estoque\/produtos$/,
    answer: (q) => paginated('Estoque', 'estoque', ESTOQUE, q),
  },
  {
    name: 'locaisEstoque',
    entity: 'LocalEstoque',
    pattern: /^\/v1\/estoque\/locais$/,
    answer: (q) => paginated('LocalEstoque', 'locais', LOCAIS, q),
  },
  {
    name: 'contasAReceber',
    entity: 'Financeiro',
    pattern: /^\/v1\/financeiros\/receitas$/,
    answer: (q) => titulos(q, FINANCEIROS),
  },
  // One title: the gateway sends it as an object, not a list.
  {
    name: 'contasAPagar',
    entity: 'Financeiro',
    pattern: /^\/v1\/financeiros\/despesas$/,
    answer: (q) => titulos(q, FINANCEIROS.slice(1)),
  },
  {
    name: 'tiposPagamento',
    entity: 'TipoPagamento',
    pattern: /^\/v1\/financeiros\/tipos-pagamento$/,
    answer: (q) => paginated('TipoPagamento', 'data', TIPOS_PAGAMENTO, q),
  },
  {
    name: 'precosDoProduto',
    entity: 'Preco',
    pattern: /^\/v1\/precos\/produto\/(\d+)$/,
    answer: (q, m) =>
      precos(
        q,
        PRECOS.filter((p) => p.codigoProduto === Number(m[1])),
      ),
  },
  {
    name: 'precosDaTabela',
    entity: 'Preco',
    pattern: /^\/v1\/precos\/tabela\/(\d+)$/,
    answer: (q, m) =>
      precos(
        q,
        PRECOS.filter((p) => p.codigoTabela === Number(m[1])),
      ),
  },
  {
    name: 'transportadoras',
    entity: 'Transportadora',
    pattern: /^\/v1\/parceiros\/transportadoras$/,
    answer: (q) => paginated('Transportadora', 'transportadoras', TRANSPORTADORAS, q),
  },
  {
    name: 'ordensCarga',
    entity: 'OrdemCarga',
    pattern: /^\/v1\/logistica\/ordens-carga$/,
    answer: (q) => ofEmpresa('OrdemCarga', 'ordensCarga', ORDENS_CARGA, q),
  },
]

/** The reads whose page documents the 403 body as `mensagem: { codigo, descricao }`; the other pages give it none. */
const DOCUMENTED_403 = new Set([
  'clientes',
  'estoque',
  'contasAReceber',
  'contasAPagar',
  'precosDoProduto',
  'precosDaTabela',
])

/** A 403 as the route's page documents it, or with the gateway's own `code` on a route whose page gives no body. */
export function forbidden(path: string, code: string, text: string): Response {
  const documented = DOCUMENTED_403.has(routeOf(path)?.name ?? '')
  return json(
    documented ? { mensagem: { codigo: code, descricao: text } } : { code, message: text },
    403,
  )
}

/** The route a REST path belongs to, or null when the fake has no such route. */
export function routeOf(
  path: string,
): { name: string; entity: string; answer(query: URLSearchParams): Response } | null {
  for (const route of ROUTES) {
    const match = route.pattern.exec(path)
    if (match)
      return {
        name: route.name,
        entity: route.entity,
        answer: (query) => route.answer(query, match),
      }
  }
  return null
}
