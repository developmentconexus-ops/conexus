import { CONNECTORS } from '@conexus/connectors'
import { operationsOf } from './catalog-subjects.ts'

/**
 * What the kit offers a company's roles: each connector's resource and its operations, the door's
 * reads included, by the ids the kit gives them. The kit owns the list (code C26); the server's
 * start hands it to the identity, which never imports the kit (security S36).
 */
export function roleKit() {
  return CONNECTORS.map((connector) => ({
    id: connector.id,
    resource: `connector_${connector.id}`,
    operations: operationsOf(connector).map((operation) => ({
      id: operation.id,
      class: operation.class,
    })),
  }))
}
