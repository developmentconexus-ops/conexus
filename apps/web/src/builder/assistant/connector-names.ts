import type { CompanyId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { connectionsQuery } from '../../hub/connectors/public.ts'
import { sentenceOf } from '../../platform/hub.ts'

/**
 * The connectors' names as the person knows them ("Sankhya"), from their ids. `name` keeps its
 * identity while the catalog does not change, so a room holding it does not redraw its rows; until
 * the catalog is read it answers the id, and `failure` says why when the read failed.
 */
export function useConnectorCatalog(companyId: CompanyId) {
  const read = useQuery(connectionsQuery(companyId))
  const connectors = read.data?.connectors
  const name = useMemo(() => {
    const names = new Map((connectors ?? []).map((one) => [one.id, one.name]))
    return (connector: string) => names.get(connector) ?? connector
  }, [connectors])
  return { name, failure: read.isError ? sentenceOf(read.error) : undefined }
}
