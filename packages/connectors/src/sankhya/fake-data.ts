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

/** A page of empresas above the executor's 2 MiB cap that the kit reads: only the cap can refuse it. */
export const OVERSIZE = {
  empresas: Array.from({ length: 15000 }, (_, index) => ({
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

/** The 404 every REST list sends for a page with no rows (measured 2026-10-30), naming the route's entity. */
export function nothingFound(entity: string): Response {
  return json(
    {
      statusCode: 404,
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: 'Recurso solicitado não foi encontrado!',
        details: `Nenhum registro da entidade ${entity} com o identificador informado!`,
      },
    },
    404,
  )
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
