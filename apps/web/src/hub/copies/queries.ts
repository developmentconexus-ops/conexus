import type { CompanyId, CopyId } from '@conexus/hub-api'
import {
  listCopies,
  listCopyReaders,
  listCopyRuns,
  sampleCopy,
  setRoleCopies,
} from '@conexus/hub-api'
import { queryOptions } from '@tanstack/react-query'
import { hubMutation, hubQuery } from '../../platform/hub.ts'

const WHILE_RUNNING = 5_000

export function copiesQuery(companyId: CompanyId) {
  return queryOptions({
    ...hubQuery(listCopies, { params: { companyId } }),
    refetchInterval: (query) =>
      query.state.data?.copies.some((copy) => copy.run?.outcome.kind === 'RUNNING')
        ? WHILE_RUNNING
        : false,
  })
}

/** For each copy the person reads, the roles that read it and how many people hold each. */
export function copyReadersQuery(companyId: CompanyId) {
  return hubQuery(listCopyReaders, { params: { companyId } })
}

export function copyRunsQuery(companyId: CompanyId, copyId: CopyId, page: string | undefined) {
  return queryOptions({
    ...hubQuery(listCopyRuns, { params: { companyId, copyId }, query: { page } }),
    refetchInterval: (query) =>
      query.state.data?.runs.some((run) => run.outcome.kind === 'RUNNING') ? WHILE_RUNNING : false,
  })
}

/** The first rows of a copy's table, for whoever may read them. */
export function copySampleQuery(companyId: CompanyId, copyId: CopyId) {
  return hubQuery(sampleCopy, { params: { companyId, copyId } })
}

/** Salvar of an open role: the whole list of copies it reads. */
export const sendRoleCopies = hubMutation(setRoleCopies)
