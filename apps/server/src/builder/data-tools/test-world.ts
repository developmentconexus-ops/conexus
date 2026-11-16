import assert from 'node:assert/strict'
import type { Catalog, DataSources } from '@conexus/hub-api'
import { Catalog as CatalogShape, companyData } from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import { dataTools } from './public.ts'

export const LOJA_A = '00000000-0000-4000-8000-0000000000a1'
export const LOJA_B = '00000000-0000-4000-8000-0000000000a2'

const RUN = {
  id: '00000000-0000-4000-8000-0000000000b1',
  startedAt: '2026-11-14T11:00:00.000Z',
  endedAt: '2026-11-14T11:05:00.000Z',
  read: 10,
  written: 10,
  whole: false,
}

const SOURCE = { kind: 'QUERY', query: 'select 1' } as const

function named(connection: string, name: string, state = 'ACTIVE') {
  return { kind: 'NAMED', connection: { id: connection, name, connector: 'erp-falso' }, state }
}
const A = named(LOJA_A, 'Loja A')
const B = named(LOJA_B, 'Loja B')
const NOT_GIVEN = { kind: 'NOT_GIVEN', connector: 'erp-falso' }

function table(name: string, sources: unknown[], lastRun: unknown) {
  return {
    name,
    label: name.toUpperCase(),
    description: `A tabela ${name}.`,
    columns: [{ name: 'numero', type: 'bigint', description: null, inactiveSince: null }],
    kept: { kind: 'COPY', sources, source: SOURCE, lastRun },
  }
}

function catalogOf(tables: ReturnType<typeof table>[]): Catalog {
  return CatalogShape.parse({
    kind: 'CATALOG',
    systems: [LOJA_A, LOJA_B].map((connection, index) => ({
      connection,
      connector: 'erp-falso',
      name: index === 0 ? 'Loja A' : 'Loja B',
      liveOnly: false,
      reads: [{ operation: 'listar', label: 'Listar', summary: 'Lista os itens.' }],
      actions: [],
    })),
    tables,
  })
}

export const CATALOG = catalogOf([
  table('vendas', [A], {
    ...RUN,
    outcome: { kind: 'ERROR', code: 'COPY_DATABASE_UNAVAILABLE' },
  }),
  table('clientes', [A], null),
  table('juntas', [A, B], { ...RUN, outcome: { kind: 'COMPLETE' } }),
])

export const WAITING = catalogOf([
  table('esperando', [named(LOJA_A, 'Loja A', 'NEEDS_REAUTH')], null),
])
export const UNNAMED = catalogOf([table('livre', [NOT_GIVEN], null)])
export const MIXED = catalogOf([table('mista', [A, NOT_GIVEN], null)])

type Reached = { catalog: number; rows: string[]; query: string[]; signals: unknown[] }

export function world(
  catalog: Catalog,
  over: Partial<DataSources> = {},
  scoped: (requestContext: RequestContext) => boolean = () => true,
) {
  const reached: Reached = { catalog: 0, rows: [], query: [], signals: [] }
  const sources: DataSources = {
    async catalog({ signal }) {
      reached.catalog += 1
      reached.signals.push(signal)
      return catalog
    },
    async rows({ table: kept, signal }) {
      reached.rows.push(kept.name)
      reached.signals.push(signal)
      return {
        kind: 'ROWS',
        rows: Array.from({ length: 200 }, (_, index) => ({ numero: index })),
        complete: false,
      }
    },
    async live() {
      throw new Error('no live read')
    },
    async query({ sql, signal }) {
      reached.query.push(sql)
      reached.signals.push(signal)
      const used = /juntas/.test(sql)
        ? ['vendas', 'juntas']
        : catalog.tables.map(({ name }) => name).filter((name) => sql.includes(name))
      return { kind: 'ROWS', columns: ['n'], rows: [[3]], complete: true, used }
    },
    async funnel() {
      throw new Error('no write')
    },
    ...over,
  }
  const tools = dataTools({
    dataOf: async (requestContext) =>
      scoped(requestContext)
        ? companyData({ sources, now: () => new Date('2026-11-14T12:00:00.000Z') })
        : undefined,
  })
  return { tools, reached }
}

export function runOn(set: object, name: string, input: object, context: object = {}) {
  return Object(set)[name].execute(input, { requestContext: new RequestContext(), ...context })
}

export function thrown(promise: Promise<unknown>) {
  return promise.then(
    () => assert.fail('a recusa voltou como resultado'),
    (error: Error) => JSON.parse(error.message),
  )
}
