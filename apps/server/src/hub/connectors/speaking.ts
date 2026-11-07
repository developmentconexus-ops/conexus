import { connectorOf } from '@conexus/connectors'
import type { CompanyId, ConnectionId, PersonId } from '@conexus/hub-api'
import { ConnectorId, OperationId } from '@conexus/hub-api'
import type { Speaker } from '../identity/public.ts'
import type { NotInRole } from './read.ts'
import type { Deps } from './rows.ts'

/** The notebook's proving read: the operation whose use the notebook follows (decision of criteria 12 and 20). */
const NOTEBOOK_OPERATION = 'consultar'

/** The person as the role the company holds them in now; none for someone who is no member. */
export async function personSpeaker(
  deps: Deps,
  companyId: CompanyId,
  personId: PersonId,
): Promise<Speaker | undefined> {
  const role = await deps.database.read({ kind: 'COMPANY', companyId, personId }, (tx) =>
    deps.identity.roleOf(tx, companyId, personId),
  )
  return role === undefined ? undefined : { kind: 'PERSON', personId, role }
}

type Listed = Readonly<{
  connectionId: ConnectionId
  connector: string
  reads: readonly Readonly<{ operation: string }>[]
}>

/** The connections with only the reads the speaker may use: the model is not told of the others. */
export async function visibleTo<T extends Listed>(
  deps: Deps,
  companyId: CompanyId,
  speaker: Speaker,
  connections: readonly T[],
): Promise<T[]> {
  const targets = connections.flatMap((each) =>
    each.reads.map((read) => ({
      connectionId: each.connectionId,
      connectorId: ConnectorId.parse(each.connector),
      operationId: OperationId.parse(read.operation),
    })),
  )
  const answers = await deps.identity.mayUseEach(companyId, speaker, targets)
  const allowed = new Set(targets.filter((_, index) => answers[index]).map(keyOf))
  return connections.map((each) => ({
    ...each,
    reads: each.reads.filter((read) => allowed.has(`${each.connectionId}:${read.operation}`)),
  }))
}

function keyOf(target: { connectionId: ConnectionId; operationId: OperationId }): string {
  return `${target.connectionId}:${target.operationId}`
}

/**
 * Whether the notebook of a connection may be read or written by the speaker: it follows the
 * connector's free query, since the notebook is proved by it. A connector without one has no
 * notebook to guard.
 */
export async function mayUseNotebook(
  deps: Deps,
  companyId: CompanyId,
  speaker: Speaker,
  on: Readonly<{ connectionId: ConnectionId; connector: string }>,
): Promise<NotInRole | undefined> {
  if (speaker.kind === 'VERSION') return undefined
  const connector = connectorOf(on.connector)
  if (connector?.readDoor?.[NOTEBOOK_OPERATION] === undefined) return undefined
  const allowed = await deps.identity.mayUse(companyId, speaker, {
    connectionId: on.connectionId,
    connectorId: ConnectorId.parse(on.connector),
    operationId: OperationId.parse(NOTEBOOK_OPERATION),
  })
  return allowed
    ? undefined
    : { kind: 'NOT_IN_ROLE', role: speaker.role, operation: NOTEBOOK_OPERATION }
}
