import type { Connector } from '@conexus/connectors'
import type { CompanyId, ConnectionId, PersonId } from '@conexus/hub-api'
import { ConnectorId, OperationId } from '@conexus/hub-api'
import type { Speaker } from '../identity/public.ts'
import { speakerOf } from '../identity/public.ts'

import type { Deps } from './rows.ts'

/** The person as the role the company holds them in now; none for someone who is no member. */
export async function personSpeaker(
  deps: Deps,
  companyId: CompanyId,
  personId: PersonId,
): Promise<Speaker | undefined> {
  return deps.database.read({ kind: 'COMPANY', companyId, personId }, (tx) =>
    speakerOf(tx, companyId, personId),
  )
}

type Listed = Readonly<{
  connectionId: ConnectionId
  connector: string
  reads: readonly Readonly<{ operation: string }>[]
  writes: readonly Readonly<{ operation: string }>[]
}>

/** The keys (`connection:operation`) of the reads the speaker may use, asked in one go. */
async function allowedKeys(
  deps: Deps,
  companyId: CompanyId,
  speaker: Speaker,
  connections: readonly Listed[],
): Promise<Set<string>> {
  const targets = connections.flatMap((each) =>
    [...each.reads, ...each.writes].map((read) => ({
      connectionId: each.connectionId,
      connectorId: ConnectorId.parse(each.connector),
      operationId: OperationId.parse(read.operation),
    })),
  )
  const answers = await deps.identity.mayUseEach(companyId, speaker, targets)
  return new Set(targets.filter((_, index) => answers[index]).map(keyOf))
}

/** Every read and write of the connections, each marked with whether the speaker may use it (`allowed`). */
export async function markedFor<T extends Listed>(
  deps: Deps,
  companyId: CompanyId,
  speaker: Speaker,
  connections: readonly T[],
) {
  const allowed = await allowedKeys(deps, companyId, speaker, connections)
  return connections.map((each) => {
    function marked<R extends { operation: string }>(read: R) {
      return { ...read, allowed: allowed.has(`${each.connectionId}:${read.operation}`) }
    }
    return { ...each, reads: each.reads.map(marked), writes: each.writes.map(marked) }
  })
}

/**
 * The connections with only the reads the speaker may use: the model is not told of the others. The
 * writes stay as the kit declares them, what tells a tool's class (code C26); no model is told of one.
 */
export async function visibleTo<T extends Listed>(
  deps: Deps,
  companyId: CompanyId,
  speaker: Speaker,
  connections: readonly T[],
): Promise<T[]> {
  const allowed = await allowedKeys(deps, companyId, speaker, connections)
  return connections.map((each) => ({
    ...each,
    reads: each.reads.filter((read) => allowed.has(`${each.connectionId}:${read.operation}`)),
  }))
}

function keyOf(target: { connectionId: ConnectionId; operationId: OperationId }): string {
  return `${target.connectionId}:${target.operationId}`
}

/**
 * The first read of the connection's free read door the speaker's role does not hold; none when it
 * holds them all. Proposing and turning on a proposal ask what `connector_read` asks of that door,
 * since the copy's own read speaks as a version outside the roles (Capacidade 2).
 */
export async function lackedDoorRead(
  deps: Pick<Deps, 'identity'>,
  companyId: CompanyId,
  speaker: Speaker,
  on: Readonly<{ connectionId: ConnectionId; connector: Connector }>,
) {
  const reads = Object.values(on.connector.readDoor ?? {})
  const answers = await deps.identity.mayUseEach(
    companyId,
    speaker,
    reads.map((read) => ({
      connectionId: on.connectionId,
      connectorId: ConnectorId.parse(on.connector.id),
      operationId: OperationId.parse(read.id),
    })),
  )
  return reads.find((_, index) => !answers[index])
}
