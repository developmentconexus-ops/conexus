import type { CompanyId, Connection, ConnectorEntry } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  busyText,
  connectionsQuery,
  reauthText,
  stateBadge,
  unreachableText,
} from '../../hub/connectors/public.ts'
import type { ConnectorWords } from './tool-spec.ts'

/**
 * A connector's words from the catalog. The Assistant answers owners and administrators, who may
 * connect again, so the refusal never tells them to ask someone. A connector the catalog does not
 * hold (not read yet, or no longer offered) is named by its id and asked to connect again as an
 * authorization is.
 */
export function wordsOf(
  catalog: readonly Pick<ConnectorEntry, 'id' | 'name' | 'auth' | 'logo'>[],
  connections: readonly Pick<Connection, 'id' | 'connector'>[] = [],
): ConnectorWords {
  const named = new Map(catalog.map((one) => [one.id, one]))
  const linked = new Map<string, string>(connections.map((one) => [one.id, one.connector]))
  function name(connector: string): string {
    return named.get(connector)?.name ?? connector
  }
  return {
    name,
    logoOf: (connectionId) => named.get(linked.get(connectionId) ?? '')?.logo,
    logo: (connector) => named.get(connector)?.logo,
    badge: (connector, state) => stateBadge({ state }, named.get(connector)?.auth ?? 'oauth2_code'),
    refusal(connector, why) {
      const shown = connector === undefined ? 'sistema' : name(connector)
      switch (why.kind) {
        case 'REAUTH':
          return reauthText(
            shown,
            (connector === undefined ? undefined : named.get(connector)?.auth) ?? 'oauth2_code',
            true,
          )
        case 'BUSY':
          return busyText(shown, why.waitMs)
        case 'UNREACHABLE':
          return unreachableText(shown)
        default:
          return why satisfies never
      }
    },
  }
}

/**
 * The company's connector catalog as words, read once for every room: `words` keeps its identity
 * while the catalog does not change, so a room holding it does not redraw its rows.
 */
export function useConnectorWords(companyId: CompanyId) {
  const read = useQuery(connectionsQuery(companyId))
  const { connectors, connections } = read.data ?? {}
  const words = useMemo(
    () => wordsOf(connectors ?? [], connections ?? []),
    [connectors, connections],
  )
  return { words, read }
}
