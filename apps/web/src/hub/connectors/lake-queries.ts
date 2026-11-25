import type { CompanyId, ConnectionId, LakeTablesOfConnection } from '@conexus/hub-api'
import { getLakeTablesOfConnection, runLakeCopy, setLakeCopy } from '@conexus/hub-api'
import { queryOptions, useMutationState, useQuery } from '@tanstack/react-query'
import { hubMutation, hubQuery, hubQueryPrefix } from '../../platform/hub.ts'

const WHILE_RUNNING = 5_000
/** How long after the person's own request the section reads on: the Hub may open the round after the first re-read. */
const AFTER_REQUEST = 30_000

/** A connection's tables. `useLakeTables` is the one reader that follows a round. */
export function lakeTablesQuery(companyId: CompanyId, connectionId: ConnectionId) {
  return queryOptions(hubQuery(getLakeTablesOfConnection, { params: { companyId, connectionId } }))
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
  const sent = useMutationState({
    filters: { predicate: (one) => OWN_WRITES.has(one.options.mutationKey?.[0]) },
    select: (one) => one.state.submittedAt,
  })
  const lastSent = Math.max(0, ...sent)
  return useQuery({
    ...lakeTablesQuery(companyId, connectionId),
    refetchInterval: (query) =>
      isRunning(query.state.data) || Date.now() - lastSent < AFTER_REQUEST ? WHILE_RUNNING : false,
  })
}

/** The reads of one connection's tables: what a Salvar, a Rodar agora or the end of a round makes stale. */
export function lakeTablesPrefix(companyId: CompanyId, connectionId: ConnectionId) {
  return hubQueryPrefix(getLakeTablesOfConnection, { companyId, connectionId })
}

export const sendLakeCopy = hubMutation(setLakeCopy)
export const sendLakeRun = hubMutation(runLakeCopy)
