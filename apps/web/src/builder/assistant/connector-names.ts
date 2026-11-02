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
  const words = useMemo(() => wordsOf(connectors ?? []), [connectors])
  return { words, name: words.name, failure: read.isError ? sentenceOf(read.error) : undefined }
}
