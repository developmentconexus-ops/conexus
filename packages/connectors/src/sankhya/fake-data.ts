import { z } from 'zod'

// Invented values only (S40).
export const CREDENTIAL = Object.freeze({
  clientId: 'fake-client-id-0001',
  clientSecret: 'fake-client-secret-0001',
  xToken: 'fake-x-token-0001',
})

export const EMPRESAS = [
  { codigoEmpresa: 1, nomeFantasia: 'Empresa Alfa', razaoSocial: 'Alfa Comercial Ltda' },
  { codigoEmpresa: 2, nomeFantasia: 'Empresa Beta', razaoSocial: 'Beta Distribuidora Ltda' },
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
export function paged<T>(
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

export function retornoErro(message: string): Response {
  return json({ code: 'INVALID_PARAMETER', message, details: [] }, 400)
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
