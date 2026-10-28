import type { CompanyId } from '@conexus/hub-api'
import type { QueryClient } from '@tanstack/react-query'
import { projectsQuery } from '../../hub/projects/public.ts'
import { readOrNotFound } from '../../platform/hub.ts'
import { accountsQuery } from '../model-accounts/public.ts'

/** What `Start` reads, loaded by the route that shows it, so the box never suspends in its page. */
export function readStart(queryClient: QueryClient, companyId: CompanyId) {
  return readOrNotFound(
    Promise.all([
      queryClient.ensureQueryData(projectsQuery(companyId, undefined)),
      queryClient.ensureQueryData(accountsQuery(companyId)),
    ]),
  )
}
