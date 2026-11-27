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
import { queryOptions, useQuery } from '@tanstack/react-query'
import { useFollowRun } from '../../platform/follow-run.ts'
import { hubMutation, hubQuery } from '../../platform/hub.ts'

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
  const refetchInterval = useFollowRun<TreatedTables>(OWN_WRITES, (data) =>
    isOpen(data?.lastRun ?? null),
  )
  return useQuery({ ...treatedTablesQuery(companyId), refetchInterval })
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
