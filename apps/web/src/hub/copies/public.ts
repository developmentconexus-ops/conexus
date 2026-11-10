import type { CompanyId, CompanyMay } from '@conexus/hub-api'
import { CopyId } from '@conexus/hub-api'
import type { QueryClient } from '@tanstack/react-query'
import { notFound } from '@tanstack/react-router'
import { z } from 'zod'
import { idOrNotFound, readOrNotFound } from '../../platform/hub.ts'
import { copiesQuery, copyRunsQuery } from './queries.ts'

export { CopyDetail } from './copy-detail.tsx'
export { CopyList } from './copy-list.tsx'

/** The Cópias routes are for whoever manages copies; for anyone else the address is not found (web W34, S10). */
export function manageCopiesOrNotFound({ context }: { context: { may: CompanyMay } }) {
  if (!context.may.manageCopies) throw notFound()
}

/** The `$copyId` of the detail route: an id the contract would never issue is the not-found page. */
export const copyParams = {
  parse: (raw: { copyId: string }) => ({ copyId: idOrNotFound(CopyId, raw.copyId) }),
  stringify: (p: { copyId: CopyId }) => p,
}

/** The page of the runs a detail shows, in the address (web W18). */
export const CopyRunsSearch = z.object({ page: z.string().optional().catch(undefined) })

/** What the list reads before it opens, fresh (web W12). */
export function loadCopies(queryClient: QueryClient, companyId: CompanyId) {
  return readOrNotFound(queryClient.query(copiesQuery(companyId)))
}

/** What a detail reads before it opens: the copy with the runs of the page, fresh; a copy the Hub does not have is not found. */
export function loadCopyRuns(
  queryClient: QueryClient,
  open: { companyId: CompanyId; copyId: CopyId; page: string | undefined },
) {
  return readOrNotFound(queryClient.query(copyRunsQuery(open.companyId, open.copyId, open.page)))
}
