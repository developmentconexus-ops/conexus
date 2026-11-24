import type { Connection } from '@conexus/hub-api'
import { ConnectionId, listConnections } from '@conexus/hub-api'
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

/** What a test holds on the Hub of Dados: the company's connections, or another answer to their read. */
type Held = { connections?: Connection[]; answer?: () => Response | undefined }

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
    ...projectsRead({ projects, databaseReady: true, mayDelete: false, role }),
  )
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [path] }))} />)
}
