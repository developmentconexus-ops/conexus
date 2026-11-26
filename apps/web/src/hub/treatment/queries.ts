import type { CompanyId, TreatedTables, TreatmentModelId } from '@conexus/hub-api'
import {
  approveTreatmentVersion,
  getTreatmentModel,
  listLakeTables,
  listTreatedTables,
  proposeTreatment,
  proposeTreatmentVersion,
  runTreatmentNow,
  stopTreatmentRun,
} from '@conexus/hub-api'
import { queryOptions, useMutationState, useQuery } from '@tanstack/react-query'
import { hubMutation, hubQuery } from '../../platform/hub.ts'

const WHILE_RUNNING = 5_000
/** How long after the person's own Tratar agora the screen reads on: the Hub may open the run after the first re-read. */
const AFTER_REQUEST = 30_000

export function isOpen(run: TreatedTables['lastRun']): run is NonNullable<typeof run> & {
  state: 'STARTING' | 'RUNNING'
} {
  return run?.state === 'STARTING' || run?.state === 'RUNNING'
}

/** The company's treated and business tables, with the lake's recipe and the last run. `useTreatedTables` is the one reader that follows a run. */
function treatedTablesQuery(companyId: CompanyId) {
  return queryOptions(hubQuery(listTreatedTables, { params: { companyId } }))
}

const OWN_WRITES: ReadonlySet<unknown> = new Set([runTreatmentNow.id])

/** The same read, read again every 5 s while a run is open, and for a bounded time after a Tratar agora of this browser (web W12). */
export function useTreatedTables(companyId: CompanyId) {
  const sent = useMutationState({
    filters: { predicate: (one) => OWN_WRITES.has(one.options.mutationKey?.[0]) },
    select: (one) => one.state.submittedAt,
  })
  const lastSent = Math.max(0, ...sent)
  return useQuery({
    ...treatedTablesQuery(companyId),
    refetchInterval: (query) =>
      isOpen(query.state.data?.lastRun ?? null) || Date.now() - lastSent < AFTER_REQUEST
        ? WHILE_RUNNING
        : false,
  })
}

export function treatmentModelQuery(companyId: CompanyId, modelId: TreatmentModelId) {
  return queryOptions(hubQuery(getTreatmentModel, { params: { companyId, modelId } }))
}

/** The lake's tables, to link a table the SQL reads from the copy to its page. */
export function copiedTablesQuery(companyId: CompanyId) {
  return queryOptions(hubQuery(listLakeTables, { params: { companyId } }))
}

export const sendTreatmentRun = hubMutation(runTreatmentNow)
export const sendTreatmentStop = hubMutation(stopTreatmentRun)
export const sendProposal = hubMutation(proposeTreatment)
export const sendVersion = hubMutation(proposeTreatmentVersion)
export const sendApproval = hubMutation(approveTreatmentVersion)
