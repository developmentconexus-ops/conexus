import assert from 'node:assert/strict'
import type { Catalog, DataSources } from '@conexus/hub-api'
import { Catalog as CatalogShape, companyData } from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import { dataTools } from './tools.ts'

export const LOJA_A = '00000000-0000-4000-8000-0000000000a1'
export const LOJA_B = '00000000-0000-4000-8000-0000000000a2'

export const CATALOG: Catalog = CatalogShape.parse({
  kind: 'CATALOG',
  systems: [LOJA_A, LOJA_B].map((connection, index) => ({
    connection,
    connector: 'erp-falso',
    name: index === 0 ? 'Loja A' : 'Loja B',
    reads: [{ operation: 'listar', label: 'Listar', summary: 'Lista os itens.' }],
    actions: [],
  })),
})

type Reached = { catalog: number; signals: unknown[] }

/** The tools over a contract whose catalog is `catalog`; a live read or a write reaching its source fails the test. */
export function world(catalog: Catalog, over: Partial<DataSources> = {}) {
  const reached: Reached = { catalog: 0, signals: [] }
  const sources: DataSources = {
    async catalog({ signal }) {
      reached.catalog += 1
      reached.signals.push(signal)
      return catalog
    },
    async live() {
      throw new Error('no live read')
    },
    async funnel() {
      throw new Error('no write')
    },
    ...over,
  }
  const tools = dataTools({
    data: companyData({ sources, now: () => new Date('2026-11-14T12:00:00.000Z') }),
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
