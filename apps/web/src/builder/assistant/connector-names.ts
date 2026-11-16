import type { CompanyId } from '@conexus/hub-api'
import { sentenceOf } from '../../platform/hub.ts'
import { useConnectorWords } from '../conversation/public.ts'

/**
 * The connectors' names as the person knows them ("Sankhya"), from their ids, and the words of
 * their refusals. `words` keeps its identity while the catalog does not change, so a room holding
 * it does not redraw its rows; until the catalog is read it answers the id, and `failure` says why
 * when the read failed.
 */
export function useConnectorCatalog(companyId: CompanyId) {
  const { words, read } = useConnectorWords(companyId)
  const connectors = read.data?.connectors
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
    logo: words.logo,
    isDoor,
    failure: read.isError ? sentenceOf(read.error) : undefined,
  }
}
