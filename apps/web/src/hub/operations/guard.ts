import type { QueryClient } from '@tanstack/react-query'
import { notFound } from '@tanstack/react-router'
import { companiesQuery } from '../identity/public.ts'

/**
 * Each address of the Central opens only for the operator. It only spares a trip: the Hub refuses
 * every read and write of the Central to anyone else.
 */
export async function operatorOnly({ context }: { context: { queryClient: QueryClient } }) {
  const companies = await context.queryClient.ensureQueryData(companiesQuery(undefined))
  if (!companies.mayOperate) throw notFound()
}
