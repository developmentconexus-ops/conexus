import type { CompanyId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { connectionsQuery } from '../../hub/connectors/public.ts'
import { sentenceOf } from '../../platform/hub.ts'
import { wordsOf } from '../conversation/public.ts'

/**
 * The connectors' names as the person knows them ("Sankhya"), from their ids, and the words of
 * their refusals. `words` keeps its identity while the catalog does not change, so a room holding
 * it does not redraw its rows; until the catalog is read it answers the id, and `failure` says why
 * when the read failed.
 */
export function useConnectorCatalog(companyId: CompanyId) {
  const read = useQuery(connectionsQuery(companyId))
  const connectors = read.data?.connectors
  const connections = read.data?.connections
  const words = useMemo(
    () => wordsOf(connectors ?? [], connections ?? []),
    [connectors, connections],
  )
  /** The connector's logo, once the catalog is read. */
  function logo(connector: string): string | undefined {
    return connectors?.find((one) => one.id === connector)?.logo
  }
  /** Whether the operation is a read of what the company has of its own, the free query's kind. */
  function isDoor(connector: string, operation: string): boolean {
    return (
      connectors
        ?.find((one) => one.id === connector)
        ?.subjects.some((subject) =>
          subject.operations.some((one) => one.id === operation && one.door),
        ) ?? false
    )
  }
  return {
    words,
    name: words.name,
    logo,
    isDoor,
    failure: read.isError ? sentenceOf(read.error) : undefined,
  }
}
