import type { Connector } from '@conexus/connectors'
import { CONNECTORS } from '@conexus/connectors'

/** The kit's catalog with Mercado Livre's list reads changed as `change` says: the test's own connector. */
export function catalogWith(change: (connector: Connector) => Connector): readonly Connector[] {
  return CONNECTORS.map((connector) =>
    connector.id === 'mercado-livre' ? change(connector) : connector,
  )
}

/** Mercado Livre as a provider that counts its call limit by each account. */
export const BY_ACCOUNT = catalogWith((connector) => ({
  ...connector,
  callLimit: { countedBy: 'ACCOUNT' },
}))

/** Mercado Livre with `pedidos` read up to 100 rows by its offset. */
export const CEILED = catalogWith((connector) => ({
  ...connector,
  operations: connector.operations.map((operation) =>
    operation.id === 'pedidos' && operation.list?.paging.kind === 'OFFSET'
      ? {
          ...operation,
          list: { ...operation.list, paging: { ...operation.list.paging, ceiling: 100 } },
        }
      : operation,
  ),
}))
