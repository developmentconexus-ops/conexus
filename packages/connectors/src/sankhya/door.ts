import { z } from 'zod'
import { defineReadDoor } from '../kernel/definition.ts'
import type { ProviderRequest } from '../kernel/operation.ts'
import { defineOperation } from '../kernel/operation.ts'
import { gatewayAnswer } from './answers.ts'
import { isOneReadStatement, isReadCondition } from './read-only-sql.ts'

const GATEWAY_PATH = '/gateway/v1/mge/service.sbr'
const LOAD_RECORDS = 'CRUDServiceProvider.loadRecords'
const EXECUTE_QUERY = 'DbExplorerSP.executeQuery'

function gatewayRequest(serviceName: string, requestBody: unknown): ProviderRequest {
  return {
    method: 'POST',
    path: GATEWAY_PATH,
    query: { serviceName, outputType: 'json' },
    body: { serviceName, requestBody },
  }
}

/** Sankhya sends a list with one element as the element itself. */
function listOf<T extends z.ZodType>(item: T) {
  return z
    .union([z.array(item), item])
    .optional()
    .transform((value) => (value === undefined ? [] : Array.isArray(value) ? value : [value]))
}

const Cell = z.looseObject({ $: z.unknown().optional() })

const LoadedRecords = z
  .object({
    entities: z.looseObject({
      metadata: z
        .looseObject({
          fields: z.looseObject({ field: listOf(z.looseObject({ name: z.string() })) }),
        })
        .optional(),
      entity: listOf(z.record(z.string(), Cell)),
      hasMoreResult: z.union([z.string(), z.boolean()]).optional(),
    }),
  })
  .transform(({ entities }) => {
    const names = (entities.metadata?.fields.field ?? []).map(({ name }) => name)
    const linhas = entities.entity.map((cells) =>
      Object.fromEntries(
        names.map((name, index): [string, string | null] => {
          const value = cells[`f${index}`]?.$
          return [name, value === undefined || value === null ? null : String(value)]
        }),
      ),
    )
    return { linhas, temMais: entities.hasMoreResult === true || entities.hasMoreResult === 'true' }
  })

const Loaded = z.object({
  linhas: z.array(z.record(z.string(), z.string().nullable())),
  temMais: z.boolean(),
})

const CarregarInput = z.object({
  entidade: z.string().regex(/^[A-Z][A-Za-z]{1,60}$/),
  campos: z
    .array(z.string().regex(/^[A-Z][A-Z0-9_]{0,59}$/))
    .min(1)
    .max(50),
  criterio: z
    .object({
      expressao: z.string().max(2000).refine(isReadCondition),
      parametros: z.array(z.object({ valor: z.string(), tipo: z.enum(['I', 'S', 'D']) })),
    })
    .optional(),
  pagina: z.number().int().min(0),
})

const carregar = defineOperation({
  id: 'carregar',
  class: 'read' as const,
  idempotent: true,
  summary:
    'Lê registros de uma entidade do dicionário do Sankhya (loadRecords), uma página por chamada.',
  label: 'Leitura genérica',
  input: CarregarInput,
  output: Loaded,
  probe: (): z.infer<typeof CarregarInput> => ({
    entidade: 'Empresa',
    campos: ['CODEMP'],
    pagina: 0,
  }),
  request: ({ entidade, campos, criterio, pagina }) =>
    gatewayRequest(LOAD_RECORDS, {
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

/** One read statement: the only text `consultar` takes, so a request cannot be built from another (code C23). */
const ReadSql = z.string().min(1).max(8000).refine(isOneReadStatement).brand('ReadSql')

const QueriedRows = z
  .object({
    fieldsMetadata: z.array(z.looseObject({ name: z.string() })),
    rows: z.array(z.array(z.unknown())),
    burstLimit: z.boolean().optional(),
  })
  .transform(({ fieldsMetadata, rows, burstLimit }) => ({
    linhas: rows.map((row) =>
      Object.fromEntries(fieldsMetadata.map(({ name }, index) => [name, row[index] ?? null])),
    ),
    completo: burstLimit !== true,
  }))

const Queried = z.object({
  linhas: z.array(z.record(z.string(), z.unknown())),
  completo: z.boolean(),
})

const consultar = defineOperation({
  id: 'consultar',
  class: 'read' as const,
  idempotent: true,
  summary:
    'Roda uma consulta SQL de leitura (SELECT ou WITH, uma só) no Sankhya (DbExplorerSP.executeQuery).',
  label: 'Consulta',
  input: z.object({ sql: ReadSql }),
  output: Queried,
  probe: () => ({ sql: ReadSql.parse('SELECT COUNT(*) AS N FROM TSIEMP') }),
  request: ({ sql }) => gatewayRequest(EXECUTE_QUERY, { sql }),
  answer: (answer) => gatewayAnswer(answer, QueriedRows),
})

/** The two ways to read what each company has of its own; nothing else leaves the kit through the gateway. */
export const sankhyaDoor = defineReadDoor({ consultar, carregar })
