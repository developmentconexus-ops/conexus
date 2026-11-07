import type { RoleConnectors } from '@conexus/hub-api'
import { ConnectorId, OperationId } from '@conexus/hub-api'
import { Failure } from '../../platform/failure.ts'
import type { RoleSet, Statements } from './roles.ts'

export function malformed(reason: string) {
  return new Failure('REQUEST_MALFORMED', { details: { reason } })
}

/**
 * The statements a role's connectors become. The library checks only that a resource exists, so
 * the connector and each operation are checked against the kit before it is called (code C23).
 */
export function statementsOf(set: RoleSet, connectors: RoleConnectors): Statements {
  const statements: Statements = {}
  for (const [connectorId, operations] of Object.entries(connectors)) {
    const connector = set.kit.find((one) => one.id === connectorId)
    if (connector === undefined) throw malformed('CONNECTOR_UNKNOWN')
    const known = new Set(connector.operations.map((operation) => operation.id))
    if (operations.some((operation) => !known.has(operation))) throw malformed('OPERATION_UNKNOWN')
    if (operations.length > 0) statements[connector.resource] = [...new Set(operations)]
  }
  return statements
}

/** The connectors a stored permission names, in the kit's order; its other statements are no connector's. */
export function connectorsOf(set: RoleSet, permission: Statements): RoleConnectors {
  const connectors: RoleConnectors = {}
  for (const connector of set.kit) {
    const held = new Set(permission[connector.resource])
    const operations = connector.operations.map(({ id }) => id).filter((id) => held.has(id))
    if (operations.length > 0)
      connectors[ConnectorId.parse(connector.id)] = operations.map((id) => OperationId.parse(id))
  }
  return connectors
}

/** The statements a company's own role holds: the member's base besides its connectors. */
export function customStatements(
  set: RoleSet,
  connectors: RoleConnectors,
  unattended: boolean,
): Statements {
  const base: Statements = Object.fromEntries(
    Object.entries(set.memberBase).map(([resource, actions]) => [resource, [...actions]]),
  )
  return {
    ...base,
    ...statementsOf(set, connectors),
    ...(unattended ? { agent: [...(base.agent ?? []), UNATTENDED_ACTION] } : {}),
  }
}

/** The action that publishes an agent whose write runs without asking (step 24.5, Papéis `D1`). */
export const UNATTENDED_ACTION = 'publishUnattendedWrite'
