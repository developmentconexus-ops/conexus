import type { Connection, ConnectorEntry } from '@conexus/hub-api'
import { busyText, reauthText, unreachableText } from '../../hub/connectors/public.ts'
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
