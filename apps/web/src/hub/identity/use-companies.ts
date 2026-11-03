import { useQuery } from '@tanstack/react-query'
import { companiesQuery } from './queries.ts'

/**
 * The person's companies for the frame: the head of the sidebar, the Central's head and the account
 * menu read the list through this one hook, and the route's own read stays fresh (web W8).
 */
export function useCompanies() {
  return useQuery({ ...companiesQuery(undefined), refetchOnMount: false })
}
