import type { AppRows, AppTables } from '@conexus/hub-api'
import { AppRows as RowsShape, AppTables as TablesShape } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { render } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, PEDIDOS, projectsRead, refusal } from '../../platform/test-hub.tsx'

export const server = hubServer()
export const PROJECT = `/companies/${COMPANY.id}/projects/${PEDIDOS.id}`
const API = `*/api/companies/${COMPANY.id}/projects/${PEDIDOS.id}`

export const TABLES: AppTables = TablesShape.parse({
  kind: 'TABLES',
  tables: [
    { schema: 'APP', name: 'anotacoes', rows: { kind: 'EXACT', rows: 37 } },
    { schema: 'APP', name: 'clientes', rows: { kind: 'EXACT', rows: 1284 } },
    { schema: 'APP', name: 'logs', rows: { kind: 'OVER' } },
    { schema: 'APP', name: 'metas', rows: { kind: 'EXACT', rows: 0 } },
    { schema: 'APP', name: 'sobras', rows: { kind: 'UNKNOWN' } },
  ],
})
export const LONG = 'x'.repeat(100)
const FIRST: AppRows = RowsShape.parse({
  columns: [{ name: 'id' }, { name: 'nome' }, { name: 'cidade' }],
  rows: [
    [
      { text: '1', cut: false },
      { text: 'Padaria Sol', cut: false },
      { text: LONG, cut: true },
    ],
    [{ text: '2', cut: false }, { text: 'Mercado Lua', cut: false }, null],
  ],
  next: { kind: 'MORE', page: 'NTA' },
})
const SECOND: AppRows = RowsShape.parse({
  columns: FIRST.columns,
  rows: [[{ text: '51', cut: false }, { text: 'Loja Mar', cut: false }, null]],
  next: { kind: 'END' },
})
export const EMPTY: AppRows = RowsShape.parse({
  columns: [{ name: 'id' }, { name: 'meta' }],
  rows: [],
  next: { kind: 'END' },
})

export const asked: { table: string; page: string | null }[] = []

export type View = {
  tables: () => Response | AppTables
  rows?: (table: string, page: string | null) => Response | AppRows | Promise<Response | AppRows>
  copyRows?: (
    table: string,
    page: string | null,
  ) => Response | AppRows | Promise<Response | AppRows>
}

function answer(value: Response | AppTables | AppRows) {
  return value instanceof Response ? value : HttpResponse.json(value)
}

export function open(path: string, view: View, role = 'owner') {
  asked.length = 0
  server.use(
    ...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: false, role }),
    http.get(`${API}/tables`, () => answer(view.tables())),
    http.get(`${API}/copy-tables/:table/rows`, async ({ params, request }) => {
      const table = String(params.table)
      const page = new URL(request.url).searchParams.get('page')
      asked.push({ table: `copia:${table}`, page })
      const rows = view.copyRows
      if (rows === undefined) return refusal('NOT_FOUND')
      return answer(await rows(table, page))
    }),
    http.get(`${API}/tables/:table/rows`, async ({ params, request }) => {
      const table = String(params.table)
      const page = new URL(request.url).searchParams.get('page')
      asked.push({ table, page })
      const rows = view.rows
      if (rows === undefined) return refusal('NOT_FOUND')
      return answer(await rows(table, page))
    }),
  )
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [path] }))} />)
}

export function rowsOf(table: string, page: string | null) {
  if (table === 'metas') return EMPTY
  if (table !== 'clientes') return refusal('NOT_FOUND')
  return page === null ? FIRST : SECOND
}
