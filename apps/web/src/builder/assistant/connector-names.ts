import type { CompanyId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { connectionsQuery } from '../../hub/connectors/public.ts'

/** The connector's name as the person knows it ("Sankhya"), from its id; the id itself until the catalog is read. */
export function useConnectorNames(companyId: CompanyId): (connector: string) => string {
  const names = new Map(
    (useQuery(connectionsQuery(companyId)).data?.connectors ?? []).map((one) => [one.id, one.name]),
  )
  return (connector) => names.get(connector) ?? connector
}
