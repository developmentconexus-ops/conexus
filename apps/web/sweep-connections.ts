import { Connection, listConnections } from '@conexus/hub-api'
import type { Replies } from './layout-harness.ts'
import { ok } from './layout-harness.ts'

const SANKHYA = {
  id: 'sankhya',
  name: 'Sankhya',
  version: '1.0.0',
  fields: [
    { name: 'clientId', label: 'Client ID', maxLength: 200 },
    { name: 'clientSecret', label: 'Client Secret', maxLength: 200 },
    { name: 'xToken', label: 'X-Token', maxLength: 4096 },
  ],
}

export function connectionOf(fields: Record<string, unknown> = {}) {
  return Connection.parse({
    id: '00000000-0000-4000-8000-000000000001',
    connector: 'sankhya',
    connectorVersion: '1.0.0',
    state: 'NEW',
    linkedBy: { id: 'person-ana', name: 'Ana Lima' },
    linkedAt: '2026-10-29T12:00:00.000Z',
    testedAt: null,
    ...fields,
  })
}

/** The company's connections, which the rail preloads on focus: the Sankhya linked or not. */
export function connectionsPage(
  id: string,
  mayManage: boolean,
  connections: ReturnType<typeof connectionOf>[] = [],
): Replies {
  return {
    [`GET /api/companies/${id}/connections`]: ok(listConnections, {
      connectors: [SANKHYA],
      connections,
      mayManage,
    }),
  }
}
