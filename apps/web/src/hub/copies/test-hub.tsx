import type { Connection } from '@conexus/hub-api'
import { ConnectionId, LakeRun, LakeTableSummary, listConnections } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { render } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import type { hubServer } from '../../platform/test-hub.tsx'
import { PEDIDOS, projectsRead } from '../../platform/test-hub.tsx'
import { CATALOG } from './test-sources.ts'

const MATRIZ = ConnectionId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')

/** A connection of the company, as the connections list shows it: the Matriz of the Sankhya. */
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

const LAKE_TABLE_ID = '11111111-1111-4111-8111-111111111111'

/** A table of the lake as the Hub lists it: the Notas e pedidos of the Matriz, copied every 24 h, last round complete. */
export function lakeTable(fields: Record<string, unknown> = {}): LakeTableSummary {
  return LakeTableSummary.parse({
    id: LAKE_TABLE_ID,
    connection: { id: MATRIZ, name: 'Matriz', connector: 'sankhya' },
    name: 'sankhya_notas',
    label: 'Notas e pedidos',
    source: 'TGFCAB',
    mode: { kind: 'CHANGED', column: 'DTALTER', registry: false },
    interval: '24h',
    startDate: null,
    rows: 118402,
    columns: [
      { name: 'NUNOTA', type: 'inteiro', description: 'Chave da nota' },
      { name: 'DTALTER', type: 'data e hora', description: null },
    ],
    lastRun: lakeRun({}),
    next: '2026-11-03T13:00:00.000Z',
    ...fields,
  })
}

/** A round that ended complete, in the table's counts; `fields` turn it into any other outcome. */
export function lakeRun(fields: Record<string, unknown> = {}): LakeRun {
  return LakeRun.parse({
    id: '22222222-2222-4222-8222-222222222222',
    startedAt: '2026-11-02T13:00:00.000Z',
    endedAt: '2026-11-02T13:02:14.000Z',
    whole: false,
    outcome: 'COMPLETE',
    read: 118402,
    written: 118402,
    machine: null,
    stopping: false,
    stoppedBy: null,
    ...fields,
  })
}

/** What a test holds on the Hub of Dados: the connections, the lake's tables and each table's rounds, or another answer to a read. */
type Held = {
  connections?: Connection[]
  tables?: LakeTableSummary[]
  runs?: Record<string, LakeRun[]>
  answer?: () => Response | undefined
  lakeAnswer?: () => Response | undefined
  runsAnswer?: () => Response | undefined
}

const COMPANY_ROOT = `/companies/${COMPANY.id}`
export const LIST = `${COMPANY_ROOT}/data`

/** Opens `path` as a person of `role`: the session, the company, the Projetos and the connections. */
export function openData(
  server: ReturnType<typeof hubServer>,
  held: Held,
  path: string,
  role = 'owner',
  projects = [PEDIDOS],
) {
  server.use(
    http.get(
      `*/api/companies/${COMPANY.id}/connections`,
      () =>
        held.answer?.() ??
        HttpResponse.json({
          connectors: CATALOG,
          connections: held.connections ?? [connection()],
          mayManage: true,
        }),
    ),
    http.get(
      `*/api/companies/${COMPANY.id}/lake-tables`,
      () => held.lakeAnswer?.() ?? HttpResponse.json(held.tables ?? []),
    ),
    http.get(
      `*/api/companies/${COMPANY.id}/lake-tables/:tableId/runs`,
      ({ params }) =>
        held.runsAnswer?.() ?? HttpResponse.json(held.runs?.[String(params.tableId)] ?? []),
    ),
    ...projectsRead({ projects, databaseReady: true, mayDelete: false, role }),
  )
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [path] }))} />)
}
