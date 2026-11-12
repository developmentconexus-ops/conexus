import type { RoleConnectors, RoleView } from '@conexus/hub-api'
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

/**
 * The kinds of personal data a stored permission holds, in the kit's order. `sensivel` is never
 * held by a role (founder `D1`), so a stored one is not read.
 */
export function personalOf(set: RoleSet, permission: Statements): string[] {
  const held = new Set(permission.personal)
  return set.personalKinds.filter((kind) => kind !== SENSITIVE && held.has(kind))
}

/** The statements a role's personal kinds become; the unknown kind and `sensivel` are refused (code C23). */
export function personalStatements(set: RoleSet, kinds: readonly string[]): Statements {
  const known = new Set(set.personalKinds)
  if (kinds.some((kind) => kind === SENSITIVE || !known.has(kind)))
    throw malformed('PERSONAL_KIND_UNKNOWN')
  return kinds.length > 0 ? { personal: [...new Set(kinds)] } : {}
}

/** The statements a company's own role holds: the member's base besides its connectors. */
export function customStatements(set: RoleSet, connectors: RoleConnectors): Statements {
  const base: Statements = Object.fromEntries(
    Object.entries(set.memberBase).map(([resource, actions]) => [resource, [...actions]]),
  )
  return {
    ...base,
    ...statementsOf(set, connectors),
  }
}

const SENSITIVE = 'sensivel'

/** The action that publishes an agent whose write runs without asking (step 24.5, decision D1-a): the owner's and the administrator's, and the developer's when the company's row for it adds it. */
export const UNATTENDED_ACTION = 'publishUnattendedWrite'

function marksOf(view: RoleView | undefined) {
  return [...(view?.unattended === true ? [UNATTENDED_ACTION] : []), ...(view?.personal ?? [])]
}

/** The actions a change added or took, as ids (S41): the unattended mark and the personal kinds. */
export function actionsOf(before: RoleView | undefined, after: RoleView) {
  const was = new Set(marksOf(before))
  const now = new Set(marksOf(after))
  return {
    added: [...now].filter((id) => !was.has(id)),
    removed: [...was].filter((id) => !now.has(id)),
  }
}
