import { z } from 'zod'

// Invented values only (S40).
export const CREDENTIAL = Object.freeze({
  clientId: 'fake-client-id-0001',
  clientSecret: 'fake-client-secret-0001',
  xToken: 'fake-x-token-0001',
})

const EMPRESAS = [
  { codigoEmpresa: 1, nomeFantasia: 'Empresa Alfa', razaoSocial: 'Alfa Comercial Ltda' },
  { codigoEmpresa: 2, nomeFantasia: 'Empresa Beta', razaoSocial: 'Beta Distribuidora Ltda' },
]

const PEDIDOS = [
  {
    codigoNota: 101,
    numeroNota: 5001,
    serieNota: '1',
    codigoEmpresa: 1,
    cliente: { nome: 'Cliente Um', cnpjCpf: '00000000000' },
    dataNegociacao: '2026-10-01',
    confirmada: true,
    pendente: false,
    codigoVendedor: 7,
    nomeVendedor: 'Vendedor Sete',
    valorNota: 150.5,
    itens: [
      {
        sequencia: 1,
        codigoProduto: 11,
        descricaoProduto: 'Produto Onze',
        quantidade: 2,
        unidade: 'UN',
        valorUnitario: 50,
        valorTotal: 100,
        cfop: '5102',
        ncm: '00000000',
        cst: '00',
        valorICMS: 18,
        valorIPI: 0,
        impostos: [{ tipo: 'icms', cst: '00', aliquota: 18, valorBase: 100, valorImposto: 18 }],
      },
      {
        sequencia: 2,
        codigoProduto: 12,
        descricaoProduto: 'Produto Doze',
        quantidade: 1,
        unidade: 'UN',
        valorUnitario: 50.5,
        valorTotal: 50.5,
        cfop: '5102',
        ncm: '00000000',
        cst: '00',
        valorICMS: 9.09,
        valorIPI: 0,
        impostos: [],
      },
    ],
  },
  {
    codigoNota: 102,
    numeroNota: 5002,
    serieNota: '1',
    codigoEmpresa: 1,
    cliente: { nome: 'Cliente Dois', cnpjCpf: '00000000001' },
    dataNegociacao: '2026-10-02',
    confirmada: false,
    pendente: true,
    codigoVendedor: 8,
    nomeVendedor: 'Vendedor Oito',
    valorNota: 30,
    itens: [
      {
        sequencia: 1,
        codigoProduto: 13,
        descricaoProduto: 'Produto Treze',
        quantidade: 3,
        unidade: 'CX',
        valorUnitario: 10,
        valorTotal: 30,
      },
    ],
  },
]

const PRODUTOS = [
  {
    codigoProduto: 11,
    nome: 'Produto Onze',
    referencia: 'P-11',
    codigoGrupoProduto: 1,
    nomeGrupoProduto: 'Grupo Um',
    marca: 'Marca A',
    ativo: true,
    ncm: '00000000',
  },
  {
    codigoProduto: 12,
    nome: 'Produto Doze',
    referencia: 'P-12',
    codigoGrupoProduto: 1,
    nomeGrupoProduto: 'Grupo Um',
    marca: 'Marca A',
    ativo: true,
    ncm: '00000000',
  },
  {
    codigoProduto: 13,
    nome: 'Produto Treze',
    referencia: 'P-13',
    codigoGrupoProduto: 2,
    nomeGrupoProduto: 'Grupo Dois',
    marca: 'Marca B',
    ativo: false,
    ncm: '00000000',
  },
]

const CLIENTES = [
  {
    codigoCliente: 1,
    tipo: 'PJ',
    cnpjCpf: '00000000000100',
    nome: 'Cliente Um',
    razao: 'Cliente Um Ltda',
    email: 'um@example.test',
    endereco: { cidade: 'Cidade Um', uf: 'SP' },
    camposAdicionais: { AD_REGIAO: 'Sul' },
  },
  {
    codigoCliente: 2,
    tipo: 'PF',
    cnpjCpf: '00000000001',
    nome: 'Cliente Dois',
    razao: 'Cliente Dois',
    email: 'dois@example.test',
    endereco: { cidade: 'Cidade Dois', uf: 'RJ' },
    camposAdicionais: {},
  },
]

/** A page of empresas above the 256 KB cap that the schema reads: only the cap can refuse it. */
export const OVERSIZE = {
  empresas: Array.from({ length: 3000 }, (_, index) => ({
    codigoEmpresa: index + 1,
    nomeFantasia: `Empresa ${index + 1}`,
    razaoSocial: 'Comercial Distribuidora Ltda '.repeat(4),
  })),
}

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status })
}

export function empty(status: number, headers: Record<string, string> = {}): Response {
  return new Response(null, { status, headers })
}

/** The page numbered from `from`: the rows a page holds and whether more follow. */
function paged<T>(
  rows: readonly T[],
  query: URLSearchParams,
  from: 0 | 1,
  size = 2,
): { page: T[]; more: boolean } {
  const index = Number(query.get('page') ?? from) - from
  return {
    page: rows.slice(index * size, (index + 1) * size),
    more: (index + 1) * size < rows.length,
  }
}

function retornoErro(message: string): Response {
  return json({ code: 'INVALID_PARAMETER', message, details: [] }, 400)
}

export function rest(path: string, query: URLSearchParams): Response | null {
  if (path === '/v1/empresas') return json({ empresas: paged(EMPRESAS, query, 0).page })
  if (path === '/v1/produtos') return json({ produtos: paged(PRODUTOS, query, 0).page })
  if (path === '/v1/parceiros/clientes') {
    const { page, more } = paged(CLIENTES, query, 1)
    return json({ clientes: page, temMaisRegistros: more })
  }
  if (path === '/v1/vendas/pedidos') {
    const empresa = Number(query.get('codigoEmpresa'))
    if (!Number.isInteger(empresa) || !query.has('page'))
      return retornoErro('codigoEmpresa e page são obrigatórios')
    const nota = query.get('codigoNota')
    const rows = PEDIDOS.filter(
      (p) => p.codigoEmpresa === empresa && (nota === null || p.codigoNota === Number(nota)),
    )
    const { page, more } = paged(rows, query, 1)
    const paginas = Math.max(1, Math.ceil(rows.length / 2))
    return json({
      registros: page,
      metadados: {
        paginaAtual: Number(query.get('page')),
        totalPaginas: paginas,
        totalRegistros: rows.length,
        possuiMaisPaginas: more,
      },
    })
  }
  return null
}

export const SERVICE_PATH = '/gateway/v1/mge/service.sbr'
export const DOOR_NAMES: Record<string, string> = {
  'CRUDServiceProvider.loadRecords': 'carregar',
  'DbExplorerSP.executeQuery': 'consultar',
}

const ENTITY_ROWS: Record<string, Record<string, string>[]> = {
  Empresa: EMPRESAS.map((e) => ({
    CODEMP: String(e.codigoEmpresa),
    NOMEFANTASIA: e.nomeFantasia,
    RAZAOSOCIAL: e.razaoSocial,
  })),
}

export function envelope(service: string, status: string, responseBody?: unknown): Response {
  return json({
    serviceName: service,
    status,
    pendingPrinting: 'false',
    ...(responseBody === undefined ? { statusMessage: 'Serviço recusado' } : { responseBody }),
  })
}

const LoadRecordsBody = z.object({
  dataSet: z
    .object({
      rootEntity: z.string(),
      entity: z.object({ fieldset: z.object({ list: z.string() }) }),
    })
    .optional(),
})

export function loadRecords(requestBody: unknown): Response {
  const { dataSet } = LoadRecordsBody.parse(requestBody)
  const rows = ENTITY_ROWS[dataSet?.rootEntity ?? '']
  const fields = dataSet?.entity?.fieldset?.list?.split(',')
  if (!rows || !fields) return envelope('CRUDServiceProvider.loadRecords', '0')
  const entity = rows.map((row) =>
    Object.fromEntries(fields.map((name, index) => [`f${index}`, { $: row[name] ?? '' }])),
  )
  return envelope('CRUDServiceProvider.loadRecords', '1', {
    entities: {
      total: String(rows.length),
      hasMoreResult: 'false',
      offsetPage: '0',
      metadata: { fields: { field: fields.map((name) => ({ name })) } },
      entity: entity.length === 1 ? entity[0] : entity,
    },
  })
}

export function executeQuery(requestBody: unknown): Response {
  const { sql } = z.object({ sql: z.string() }).parse(requestBody)
  if (!/^SELECT COUNT\(\*\) AS N FROM TSIEMP$/i.test(sql.trim()))
    return envelope('DbExplorerSP.executeQuery', '0')
  return envelope('DbExplorerSP.executeQuery', '1', {
    fieldsMetadata: [{ name: 'N' }],
    rows: [[EMPRESAS.length]],
    burstLimit: false,
  })
}
