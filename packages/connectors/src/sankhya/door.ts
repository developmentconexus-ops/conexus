import { z } from 'zod'
import { defineReadDoor } from '../kernel/definition.ts'
import type { ProviderRequest } from '../kernel/operation.ts'
import { defineOperation } from '../kernel/operation.ts'
import { listOf } from '../kernel/rows.ts'
import { gatewayAnswer } from './answers.ts'
import { isOneReadStatement, isReadCondition } from './read-only-sql.ts'

/** A call to one of the gateway's services: the service is named in the query and in the body. */
function service(serviceName: string, requestBody: unknown): ProviderRequest {
  return {
    method: 'POST',
    path: '/gateway/v1/mge/service.sbr',
    query: { serviceName, outputType: 'json' },
    body: { serviceName, requestBody },
  }
}

/** One read statement, the only text a DbExplorer request is built from (code C23). */
const ReadSql = z.string().min(1).max(8000).refine(isOneReadStatement).brand('ReadSql')

/** What `DbExplorerSP.executeQuery` answers, each row keyed by its column; `completo` is false when Sankhya cut the list. */
export const QueriedRows = z
  .object({
    fieldsMetadata: z.array(z.looseObject({ name: z.string() })),
    rows: z.array(z.array(z.unknown())),
    burstLimit: z.boolean().optional(),
  })
  .transform(({ fieldsMetadata, rows, burstLimit }) => ({
    linhas: rows.map((row) =>
      Object.fromEntries(fieldsMetadata.map(({ name }, at) => [name, row[at] ?? null])),
    ),
    completo: burstLimit !== true,
  }))

/** The DbExplorer request of a statement, judged by the read filter whoever wrote it. */
export function queryRequest(sql: string): ProviderRequest {
  return service('DbExplorerSP.executeQuery', { sql: ReadSql.parse(sql) })
}

/** A table copy's page names each column it reads (TGFCAB has 449, measured by P3), past what an agent's query takes; the same read filter judges it. */
const PageSql = z.string().min(1).max(65_536).refine(isOneReadStatement).brand('PageSql')

export function pageQueryRequest(sql: string): ProviderRequest {
  return service('DbExplorerSP.executeQuery', { sql: PageSql.parse(sql) })
}

const consultar = defineOperation({
  id: 'consultar',
  class: 'read' as const,
  subject: 'porta',
  idempotent: true,
  summary:
    'Roda uma consulta SQL de leitura (SELECT ou WITH, uma só) no Sankhya (DbExplorerSP.executeQuery).',
  label: 'Consulta',
  input: z.object({ sql: ReadSql }),
  output: z.object({ linhas: z.array(z.record(z.string(), z.unknown())), completo: z.boolean() }),
  probe: () => ({ sql: ReadSql.parse('SELECT COUNT(*) AS N FROM TSIEMP') }),
  request: ({ sql }) => queryRequest(sql),
  answer: (answer) => gatewayAnswer(answer, QueriedRows),
})

const Cell = z.looseObject({ $: z.unknown().optional() })

/** What `loadRecords` answers: the field names in `metadata`, each row's cells as `f0`, `f1`… in that order, every value as text. */
const LoadedRecords = z
  .object({
    entities: z.looseObject({
      metadata: z
        .looseObject({
          fields: z.looseObject({ field: listOf(z.looseObject({ name: z.string() })).optional() }),
        })
        .optional(),
      entity: listOf(z.record(z.string(), Cell)).optional(),
      hasMoreResult: z.union([z.boolean(), z.string()]).optional(),
    }),
  })
  .transform(({ entities }) => {
    const names = (entities.metadata?.fields.field ?? []).map(({ name }) => name)
    const linhas = (entities.entity ?? []).map((cells) =>
      Object.fromEntries(
        names.map((name, at) => {
          const value = cells[`f${at}`]?.$
          return [name, value === undefined || value === null ? null : String(value)]
        }),
      ),
    )
    return { linhas, temMais: String(entities.hasMoreResult) === 'true' }
  })

const ParameterType = z.enum(['D', 'H', 'F', 'I', 'S'])

const CarregarInput = z.object({
  entidade: z.string().regex(/^[A-Z][A-Za-z]{1,60}$/),
  campos: z
    .array(z.string().regex(/^[A-Z][A-Z0-9_]{0,59}$/))
    .min(1)
    .max(50),
  criterio: z
    .object({
      expressao: z.string().max(2000).refine(isReadCondition),
      parametros: z.array(z.object({ valor: z.string(), tipo: ParameterType })),
    })
    .optional(),
  pagina: z.number().int().min(0),
})

const carregar = defineOperation({
  id: 'carregar',
  class: 'read' as const,
  subject: 'porta',
  idempotent: true,
  summary:
    'Lê registros de uma entidade do dicionário do Sankhya (loadRecords), uma página por chamada.',
  label: 'Leitura genérica',
  input: CarregarInput,
  output: z.object({
    linhas: z.array(z.record(z.string(), z.string().nullable())),
    temMais: z.boolean(),
  }),
  probe: (): z.infer<typeof CarregarInput> => ({
    entidade: 'Empresa',
    campos: ['CODEMP'],
    pagina: 0,
  }),
  request: ({ entidade, campos, criterio, pagina }) =>
    service('CRUDServiceProvider.loadRecords', {
      dataSet: {
        rootEntity: entidade,
        includePresentationFields: 'N',
        offsetPage: String(pagina),
        ...(criterio && {
          criteria: {
            expression: { $: criterio.expressao },
            parameter: criterio.parametros.map(({ valor, tipo }) => ({ $: valor, type: tipo })),
          },
        }),
        entity: { fieldset: { list: campos.join(',') } },
      },
    }),
  answer: (answer) => gatewayAnswer(answer, LoadedRecords),
})

/** The two ways to read what each company has of its own; nothing else reaches the gateway's services from the kit. */
export const sankhyaDoor = defineReadDoor({ consultar, carregar })
