import type { CompanyId, ConnectionId, LakeTablesOfConnection } from '@conexus/hub-api'
import {
  getLakeTablesOfConnection,
  runLakeCopy,
  setLakeCopy,
  stopLakeCopyRun,
} from '@conexus/hub-api'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { useFollowRun } from '../../platform/follow-run.ts'
import { hubMutation, hubQuery, hubQueryPrefix } from '../../platform/hub.ts'

/** A connection's tables. `useLakeTables` is the one reader that follows a round. */
export function lakeTablesQuery(companyId: CompanyId, connectionId: ConnectionId) {
  return queryOptions(
    hubQuery(getLakeTablesOfConnection, {
      params: { companyId, connectionId },
    }),
  )
}

function isRunning(lake: LakeTablesOfConnection | undefined): boolean {
  return lake?.lastRun?.outcome === 'RUNNING'
}

const OWN_WRITES: ReadonlySet<unknown> = new Set([setLakeCopy.id, runLakeCopy.id])

/**
 * The same read, read again every 5 s while a round of its copy runs, and for a bounded time after
 * a Salvar, a Rodar agora or a Ligar of this browser: the re-read the write makes can come before
 * the Hub opens the round (web W12).
 */
export function useLakeTables(companyId: CompanyId, connectionId: ConnectionId) {
  const refetchInterval = useFollowRun(OWN_WRITES, isRunning)
  return useQuery({
    ...lakeTablesQuery(companyId, connectionId),
    refetchInterval,
  })
}

/** The reads of one connection's tables: what a Salvar, a Rodar agora or the end of a round makes stale. */
export function lakeTablesPrefix(companyId: CompanyId, connectionId: ConnectionId) {
  return hubQueryPrefix(getLakeTablesOfConnection, { companyId, connectionId })
}

export const sendLakeCopy = hubMutation(setLakeCopy)
export const sendLakeRun = hubMutation(runLakeCopy)
export const sendLakeStop = hubMutation(stopLakeCopyRun)
