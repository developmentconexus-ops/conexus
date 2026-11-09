import type { Connector } from '@conexus/connectors'
import { CONNECTORS, connectorOf } from '@conexus/connectors'
import { operationsOf } from './catalog-subjects.ts'

/** Every operation the kit gives a connector: the read door's and the reads (`operationsOf`) and the writes. */
function kitOperationsOf(connector: Connector) {
  return [...operationsOf(connector), ...(connector.writes ?? [])]
}

/**
 * What the kit offers a company's roles: each connector's resource and its operations, the door's
 * reads and its writes included, by the ids the kit gives them. The kit owns the list (code C26); the server's
 * start hands it to the identity, which never imports the kit (security S36).
 */
export function roleKit() {
  return CONNECTORS.map((connector) => ({
    id: connector.id,
    resource: `connector_${connector.id}`,
    operations: kitOperationsOf(connector).map((operation) => ({
      id: operation.id,
      class: operation.class,
    })),
  }))
}

/** The fields of a write that only whoever configures the tool fixes (decision 0062); none for a read or an unknown operation. */
export function fixedFieldsOf(connector: string, operation: string): readonly string[] {
  const write = connectorOf(connector)?.writes?.find((each) => each.id === operation)
  return write?.fixed ?? []
}

/** What a person reads for a connector's operation, the read door's and the writes included; the id when the kit has none. */
export function operationLabel(connector: string, operation: string): string {
  const kit = connectorOf(connector)
  const found =
    kit === undefined ? undefined : kitOperationsOf(kit).find((each) => each.id === operation)
  return found?.label ?? operation
}

/** Whether the kit marks the operation as returning a list of rows (`many`): what a Para cada may loop over. */
export function returnsMany(connector: string, operation: string): boolean {
  const kit = connectorOf(connector)
  const found =
    kit === undefined ? undefined : kitOperationsOf(kit).find((each) => each.id === operation)
  return found?.many === true
}
