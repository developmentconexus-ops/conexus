import type { CompanyId, CopyId, CopyRun } from '@conexus/hub-api'
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
/** How long a run the person asked for is waited for before the list stops looking for it. */
const REQUEST_WINDOW_MS = 60_000

/** A Rodar agora or a Ligar: when it left, which copy, and the run that copy showed then (none for a new one). */
export type RunRequest = { at: number; copyId: string; before: string | null }

type Run = Pick<CopyRun, 'id' | 'outcome'> | null

function waitingFor(requests: RunRequest[], copyId: string, run: Run) {
  return requests.some(
    (one) =>
      one.copyId === copyId &&
      Date.now() - one.at < REQUEST_WINDOW_MS &&
      (run === null || run.id === one.before),
  )
}

/** Whether the run one request asked for is still owed or open: not in the list yet, or running, within the window. */
export function requestOpen(one: RunRequest, run: Run) {
  return (
    Date.now() - one.at < REQUEST_WINDOW_MS &&
    (run === null || run.id === one.before || run.outcome.kind === 'RUNNING')
  )
}

/**
 * The company's copies, read again every 5 s while one runs, and while a run the person asked for
 * has not appeared (the write's own re-read can come back before the Hub opened the run).
 */
export function copiesQuery(companyId: CompanyId, requests: RunRequest[] = []) {
  return queryOptions({
    ...hubQuery(listCopies, { params: { companyId } }),
    refetchInterval: (query) =>
      query.state.data?.copies.some(
        (copy) => copy.run?.outcome.kind === 'RUNNING' || waitingFor(requests, copy.id, copy.run),
      )
        ? WHILE_RUNNING
        : false,
  })
}

/** The models the company's connectors offer to copy. */
export function copyModelsQuery(companyId: CompanyId) {
  return hubQuery(listCopyModels, { params: { companyId } })
}

/** The runs of one copy, newest first, a page at a time, with the copy itself; read again while one runs or one asked for has not appeared. */
export function copyRunsQuery(
  companyId: CompanyId,
  copyId: CopyId,
  page: string | undefined,
  requests: RunRequest[] = [],
) {
  return queryOptions({
    ...hubQuery(listCopyRuns, { params: { companyId, copyId }, query: { page } }),
    refetchInterval: (query) =>
      query.state.data?.runs.some((run) => run.outcome.kind === 'RUNNING') ||
      (page === undefined && waitingFor(requests, copyId, query.state.data?.runs[0] ?? null))
        ? WHILE_RUNNING
        : false,
  })
}

export const sendCopyEnable = hubMutation(enableCopy)
export const sendCopyPause = hubMutation(pauseCopy)
export const sendCopyResume = hubMutation(resumeCopy)
export const sendCopyInterval = hubMutation(changeCopyInterval)
export const sendCopyRun = hubMutation(runCopy)
