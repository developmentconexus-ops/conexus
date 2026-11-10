import type { CompanyId, CopyId } from '@conexus/hub-api'
import {
  changeCopyInterval,
  enableCopy,
  listCopies,
  listCopyModels,
  listCopyRuns,
  pauseCopy,
  resumeCopy,
  runCopy,
} from '@conexus/hub-api'
import { queryOptions } from '@tanstack/react-query'
import { hubMutation, hubQuery } from '../../platform/hub.ts'

const WHILE_RUNNING = 5_000

/** The company's copies, read again every 5 s while one of them runs (Mastra's Studio does the same). */
export function copiesQuery(companyId: CompanyId) {
  return queryOptions({
    ...hubQuery(listCopies, { params: { companyId } }),
    refetchInterval: (query) =>
      query.state.data?.copies.some((copy) => copy.run?.outcome.kind === 'RUNNING')
        ? WHILE_RUNNING
        : false,
  })
}

/** The models the company's connectors offer to copy. */
export function copyModelsQuery(companyId: CompanyId) {
  return hubQuery(listCopyModels, { params: { companyId } })
}

/** The runs of one copy, newest first, a page at a time, with the copy itself; read again while one runs. */
export function copyRunsQuery(companyId: CompanyId, copyId: CopyId, page: string | undefined) {
  return queryOptions({
    ...hubQuery(listCopyRuns, { params: { companyId, copyId }, query: { page } }),
    refetchInterval: (query) =>
      query.state.data?.runs.some((run) => run.outcome.kind === 'RUNNING') ? WHILE_RUNNING : false,
  })
}

export const sendCopyEnable = hubMutation(enableCopy)
export const sendCopyPause = hubMutation(pauseCopy)
export const sendCopyResume = hubMutation(resumeCopy)
export const sendCopyInterval = hubMutation(changeCopyInterval)
export const sendCopyRun = hubMutation(runCopy)
