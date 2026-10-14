import type { HubStatus, Start, Version } from '@conexus/hub-api'
import type { Database } from '../../platform/database.ts'
import type { StartRow } from './store.ts'
import { insertStart, lastStarts } from './store.ts'

function startOf(row: StartRow | undefined): Start {
  if (row === undefined) return { state: 'NONE' }
  return {
    state: 'RECORDED',
    version: row.version,
    startedAt: row.startedAt.toISOString(),
  }
}

export type Status = ReturnType<typeof createStatus>

export function createStatus(deps: { version: Version; database: Database }) {
  return Object.freeze({
    recordStart: () => deps.database.command((tx) => insertStart(tx, deps.version)),
    read: async (): Promise<HubStatus> => {
      const [last, previous] = await deps.database.read(lastStarts)
      return { version: deps.version, lastStart: startOf(last), previousStart: startOf(previous) }
    },
  })
}
