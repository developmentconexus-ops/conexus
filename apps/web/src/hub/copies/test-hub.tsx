import type { Connection, CopyRun, CopySample, CopySummary } from '@conexus/hub-api'
import {
  ConnectionId,
  ConnectorId,
  CopyId,
  CopyRunId,
  listConnections,
  listCopies,
  listCopyRuns,
} from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { render } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { vi } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import type { hubServer } from '../../platform/test-hub.tsx'
import { PEDIDOS, projectsRead, refusal } from '../../platform/test-hub.tsx'
import type { Readers } from './test-reads.tsx'
import { readersHandler, sampleHandler } from './test-reads.tsx'
import { CATALOG } from './test-sources.ts'

export const VENDAS = CopyId.parse('11111111-1111-4111-8111-111111111111')
export const CLIENTES = CopyId.parse('22222222-2222-4222-8222-222222222222')
export const PRODUTOS = CopyId.parse('44444444-4444-4444-8444-444444444444')
const MATRIZ = ConnectionId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
const SANKHYA = ConnectorId.parse('sankhya')
const RUN_ID = CopyRunId.parse('33333333-3333-4333-8333-333333333333')

const BASE = `*/api/companies/${COMPANY.id}`

/** A run as the Hub lists it: complete, 42 s, 1.204 rows read and written. */
export function copyRun(fields: Partial<CopyRun> = {}): CopyRun {
  return listCopyRuns.success.body.shape.runs.element.parse({
    id: RUN_ID,
    startedAt: '2026-11-02T10:00:00.000Z',
    endedAt: '2026-11-02T10:00:42.000Z',
    outcome: { kind: 'COMPLETE' },
    read: 1204,
    written: 1204,
    whole: false,
    ...fields,
  })
}

/** A copy as the Hub lists it: Vendas of the Matriz, every 30 minutes, last pass complete. */
export function copy(fields: Partial<CopySummary> = {}): CopySummary {
  return listCopies.success.body.shape.copies.element.parse({
    id: VENDAS,
    name: 'vendas',
    label: 'Vendas',
    sources: [{ connection: { id: MATRIZ, name: 'Matriz', connector: SANKHYA } }],
    interval: '30m',
    schedule: { kind: 'ACTIVE', nextRunAt: '2026-11-02T10:30:00.000Z' },
    run: copyRun(),
    rows: 118402,
    mode: { kind: 'WINDOW', days: 30 },
    projects: [{ id: PEDIDOS.id, name: 'Vendedores' }],
    shown: {
      source: { kind: 'QUERY', query: 'SELECT NUNOTA, CODPARC\nFROM TGFCAB' },
      key: ['NUNOTA'],
      changedSince: { column: 'DTALTER' },
      window: { column: 'DTNEG', days: 30 },
      description: null,
      columns: [],
    },
    ...fields,
  })
}

/** A connection of the company, as the connections list shows it. */
export function connection(fields: Partial<Connection> = {}): Connection {
  return listConnections.success.body.shape.connections.element.parse({
    id: MATRIZ,
    connector: 'sankhya',
    name: 'Matriz',
    connectorVersion: '1',
    state: 'ACTIVE',
    linkedBy: null,
    linkedAt: '2026-11-01T12:00:00.000Z',
    testedAt: null,
    testedBy: null,
    account: null,
    ...fields,
  })
}

/** What a test holds on the Hub of the copies. */
type Held = {
  copies: CopySummary[]
  runs?: CopyRun[]
  /** The runs of the page `NTA` that a `MORE` after the first points to. */
  later?: CopyRun[]
  connections?: Connection[]
  /** The five rows of a copy's sample. */
  sample?: CopySample
  readers?: Readers
  answers?: {
    list?: () => Response | undefined
    sample?: () => Response | undefined
  }
}

/** The runs of one copy: the first page, with a MORE when `later` is held, or that later page when asked for. */
function runsOf(held: Held, id: unknown, request: Request) {
  const found = held.copies.find((one) => one.id === id)
  if (found === undefined) return refusal('COPY_NOT_FOUND')
  if (new URL(request.url).searchParams.has('page')) {
    return HttpResponse.json({ copy: found, runs: held.later ?? [], next: { kind: 'END' } })
  }
  const next = held.later === undefined ? { kind: 'END' } : { kind: 'MORE', page: 'NTA' }
  return HttpResponse.json({ copy: found, runs: held.runs ?? [], next })
}

export function copiesHub(server: ReturnType<typeof hubServer>, held: Held) {
  server.use(
    http.get(
      `${BASE}/copies`,
      () => held.answers?.list?.() ?? HttpResponse.json({ copies: held.copies }),
    ),
    http.get(`${BASE}/connections`, () =>
      HttpResponse.json({
        connectors: CATALOG,
        connections: held.connections ?? [connection()],
        mayManage: true,
      }),
    ),
    sampleHandler(held),
    readersHandler(held.copies, held.readers),
    http.get(`${BASE}/copies/:id/runs`, ({ params, request }) => runsOf(held, params.id, request)),
  )
}

const COMPANY_ROOT = `/companies/${COMPANY.id}`
export const LIST = `${COMPANY_ROOT}/data`
export function detailOf(copyId: string) {
  return `${LIST}/${copyId}`
}

/** Opens `path` as a person of `role` on the Hub of `held`: the session, the company and the Projetos, then the copies. */
export function openCopies(
  server: ReturnType<typeof hubServer>,
  held: Parameters<typeof copiesHub>[1],
  path: string,
  role = 'owner',
  projects = [PEDIDOS],
) {
  copiesHub(server, held)
  server.use(...projectsRead({ projects, databaseReady: true, mayDelete: false, role }))
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [path] }))} />)
}

/** A phone: narrow, and a finger for a pointer, for the length of one test. */
export async function onPhone<T>(run: () => Promise<T>): Promise<T> {
  const phone = vi.spyOn(globalThis, 'matchMedia').mockImplementation((media: string) =>
    Object.assign(new EventTarget(), {
      matches: media.includes('767') || media.includes('coarse'),
      media,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    }),
  )
  try {
    return await run()
  } finally {
    phone.mockRestore()
  }
}
