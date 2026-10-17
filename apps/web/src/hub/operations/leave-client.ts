import type { CompanyId } from '@conexus/hub-api'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { allClientsQueryKey, clientQuery } from './queries.ts'

/** What a client's page does once the client is gone, deleted now or before: leave, and read the list again (step 5). */
export function useLeaveClient(companyId: CompanyId) {
  const router = useRouter()
  const queryClient = useQueryClient()
  return async function leave(notice: 'deleted' | 'gone') {
    await queryClient.invalidateQueries({ queryKey: allClientsQueryKey, refetchType: 'all' })
    await router.navigate({ to: '/operations/clients', search: { notice } })
    queryClient.removeQueries({ queryKey: clientQuery(companyId).queryKey })
  }
}
