import type { Manifest } from '@conexus/app-contract'
import type { PersonId } from '@conexus/hub-api'
import { ConnectionId, ConnectorId, OperationId } from '@conexus/hub-api'
import { eq } from 'drizzle-orm'
import type { IdentityPorts } from '../identity/public.ts'
import { speakerOf } from '../identity/public.ts'
import { ungranted } from './grants.ts'
import { operationLabel } from './role-kit.ts'
import { projectConnection } from './tables.ts'

export type UngrantedBy = (
  tx: Parameters<typeof ungranted>[0],
  ids: Parameters<typeof ungranted>[1],
  declared: NonNullable<Manifest['connectors']>,
  by: PersonId,
) => Promise<
  readonly {
    connector: string
    operation: string | null
    reason: 'NOT_GRANTED' | 'NOT_IN_ROLE' | 'PERSONAL_NOT_IN_ROLE'
    /** The operation's label in the kit, which the refusal says to the person. */
    label?: string
    /** The personal kind the role of who publishes does not hold (`PERSONAL_NOT_IN_ROLE`). */
    kind?: string
  }[]
>

/**
 * What Publicar lacks for a version that declares reads: first what the Projeto does not grant,
 * then the first declared operation the role of who publishes does not hold (decision C1). The
 * version then runs as what it declares, whoever uses it.
 */
function refusedByRole(each: { connector: string; operation: string | null }) {
  const label = each.operation === null ? undefined : operationLabel(each.connector, each.operation)
  return { ...each, reason: 'NOT_IN_ROLE' as const, ...(label === undefined ? {} : { label }) }
}

export function ungrantedBy(
  identity: Pick<IdentityPorts, 'mayUseEach' | 'personalKinds'>,
): UngrantedBy {
  return async (tx, ids, declared, by) => {
    const lacking = await ungranted(tx, ids, declared)
    if (lacking.length > 0)
      return lacking.map((each) => ({ ...each, reason: 'NOT_GRANTED' as const }))
    const targets = declared.flatMap((one) =>
      one.operations.map((operation) => ({ connector: one.connector, operation })),
    )
    const speaker = await speakerOf(tx, ids.companyId, by)
    if (speaker === undefined) return targets.slice(0, 1).map(refusedByRole)
    const homes = await tx
      .select({ id: projectConnection.connectionId, connector: projectConnection.connectorId })
      .from(projectConnection)
      .where(eq(projectConnection.projectId, ids.projectId))
    const answers = await identity.mayUseEach(
      ids.companyId,
      speaker,
      targets.map((each) => ({
        connectionId: ConnectionId.parse(homes.find((row) => row.connector === each.connector)?.id),
        connectorId: ConnectorId.parse(each.connector),
        operationId: OperationId.parse(each.operation),
      })),
    )
    const refused = targets.filter((_, index) => !answers[index])
    if (refused.length > 0) return refused.slice(0, 1).map(refusedByRole)
    const held = new Set<string>(await identity.personalKinds(ids.companyId, speaker))
    const unheld = declared.flatMap((one) =>
      (one.personal ?? [])
        .filter((kind) => !held.has(kind))
        .map((kind) => ({ connector: one.connector, operation: null, kind })),
    )
    return unheld.slice(0, 1).map((each) => ({ ...each, reason: 'PERSONAL_NOT_IN_ROLE' as const }))
  }
}
