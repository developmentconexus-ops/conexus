import type { InventoryView } from '@conexus/hub-api'
import { Connection, getConnection, getInventory, listConnections } from '@conexus/hub-api'
import type { Replies } from './layout-harness.ts'
import { ok } from './layout-harness.ts'
import { connectionOf as fixtureOf, SANKHYA } from './src/hub/connectors/fixtures.ts'

let made = 0

/** A connection of the company to the Sankhya, by its own stable id, linked by Ana Lima. */
export function connectionOf(fields: Record<string, unknown> = {}) {
  made += 1
  return Connection.parse({
    ...fixtureOf(),
    id: `00000000-0000-4000-8000-${String(made).padStart(12, '0')}`,
    linkedBy: { id: 'person-ana', name: 'Ana Lima' },
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

/** The inventory of a connection read once, complete: what its page shows under the summary. */
const READ: InventoryView = {
  inventory: {
    ...{ readAt: '2026-11-13T12:00:00.000Z', outcome: 'COMPLETE', reason: null },
    ...{ tables: 6, fields: 7, codes: 7, operations: 4 },
  },
  last: { outcome: 'COMPLETE', reason: null },
  running: false,
  mayRun: true,
}

/** One connection's page, with its inventory. */
export function connectionPage(id: string, connection: ReturnType<typeof connectionOf>): Replies {
  return {
    [`GET /api/companies/${id}/connections/${connection.id}`]: ok(getConnection, { connection }),
    [`GET /api/companies/${id}/ontology/inventories/${connection.id}`]: ok(getInventory, READ),
  }
}
