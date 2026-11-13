import { randomUUID } from 'node:crypto'
import type { CopyProposalId } from '@conexus/hub-api'
import { ConnectionId, ConnectorId, CopyId, ProjectId } from '@conexus/hub-api'
import { and, asc, desc, eq, sql } from 'drizzle-orm'
import type { CommandTx } from '../../platform/database.ts'
import { violatedConstraint } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { AccountRef } from '../connectors/public.ts'
import {
  CopyDefinition,
  connectionForCopy,
  lackedReadOf,
  lackedSourceReadOf,
  withheldKinds,
} from '../connectors/public.ts'
import type { CopiesDeps, InCompany } from './store.ts'
import { parsedCopy } from './store.ts'
import { copy, copyProposal, copyProposalSource, copySource, projectCopy } from './tables.ts'

export type Accepting = InCompany & { proposalId: CopyProposalId; attemptKey: string }

/** The proposal, locked for the decision (data D22); one of another company is not found (S10). */
async function lockedProposal(tx: CommandTx, input: Accepting) {
  const [row] = await tx
    .select()
    .from(copyProposal)
    .where(and(eq(copyProposal.id, input.proposalId), eq(copyProposal.companyId, input.companyId)))
    .for('update')
  if (row === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'NO_PROPOSAL' } })
  return row
}

/** The row an earlier attempt with this key made, if any; the same key with another body is a conflict. */
export async function earlierAttempt(
  tx: CommandTx,
  input: InCompany & { attemptKey: string },
  bodyHash: string,
) {
  const [again] = await tx
    .select()
    .from(copy)
    .where(and(eq(copy.companyId, input.companyId), eq(copy.attemptKey, input.attemptKey)))
  if (again !== undefined && again.bodyHash !== bodyHash) throw new Failure('IDEMPOTENCY_CONFLICT')
  return again
}

/** One connection a new copy reads, with its account. */
type NewSource = Readonly<{ connectionId: ConnectionId; accountRef: AccountRef | null }>

/** What a new copy row is made of, from a template or a proposal, with each source's account; the first is the copy's own connection. */
export type NewCopy = Readonly<{
  connectorId: ConnectorId
  sources: readonly [NewSource, ...NewSource[]]
  name: string
  label: string
  model: string | null
  definition: CopyDefinition
  bodyHash: string
}>

/** The new copy row under the attempt's key, and its sources in order; a name a copy took is `COPY_EXISTS`. */
export async function insertedCopy(
  tx: CommandTx,
  input: InCompany & { attemptKey: string },
  made: NewCopy,
) {
  try {
    const [row] = await tx
      .insert(copy)
      .values({
        ...{ id: CopyId.parse(randomUUID()), companyId: input.companyId },
        ...{ connectorId: made.connectorId, connectionId: made.sources[0].connectionId },
        ...{ name: made.name, label: made.label, model: made.model },
        ...{ definition: made.definition, createdBy: input.personId },
        ...{ createdAt: sql`statement_timestamp()`, attemptKey: input.attemptKey },
        bodyHash: made.bodyHash,
      })
      .returning()
    if (row === undefined) throw new Failure('COPY_EXISTS')
    // Each source a microsecond after the one before: the run reads them in the order they were made.
    await tx.insert(copySource).values(
      made.sources.map((source, at) => ({
        ...{ companyId: input.companyId, copyId: row.id, connectorId: made.connectorId },
        ...{ connectionId: source.connectionId, accountRef: source.accountRef },
        createdAt: sql`statement_timestamp() + ${at} * interval '1 microsecond'`,
      })),
    )
    return row
  } catch (error) {
    if (violatedConstraint(error) === 'copy_company_id_name_key') throw new Failure('COPY_EXISTS')
    throw error
  }
}

/** The proposal's connections, its own first; one deleted since is no longer a source. */
async function proposalConnections(tx: CommandTx, proposal: typeof copyProposal.$inferSelect) {
  const rows = await tx
    .select({ connectionId: copyProposalSource.connectionId })
    .from(copyProposalSource)
    .where(eq(copyProposalSource.proposalId, proposal.id))
    .orderBy(
      desc(sql`${copyProposalSource.connectionId} = ${proposal.connectionId}`),
      asc(copyProposalSource.connectionId),
    )
  return rows.map((row) => ConnectionId.parse(row.connectionId))
}

/**
 * The role of who turns the proposal on, reading what it copies: version 1, the connection's read
 * door; version 2, the list read on each connection. `NOT_IN_ROLE` names the read.
 */
async function mayReadSources(
  deps: Pick<CopiesDeps, 'identity'>,
  tx: CommandTx,
  input: Accepting & {
    connectorId: ConnectorId
    definition: CopyDefinition
    connections: readonly ConnectionId[]
  },
) {
  const { companyId, personId, connectorId, definition, connections } = input
  const [first] = connections
  if (first === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'NO_CONNECTION' } })
  const lacked =
    definition.version === 1
      ? await lackedReadOf(deps, tx, { companyId, connectionId: first, connectorId, personId })
      : (
          await lackedSourceReadOf(deps, tx, {
            ...{ companyId, personId, connectorId, connections },
            operation: definition.source.operation,
          })
        )?.operation
  if (lacked !== undefined)
    throw new Failure('NOT_IN_ROLE', {
      details: { connectionId: first, reason: 'READ_DOOR' },
      named: { operation: lacked },
    })
}

/**
 * A copy never keeps a kind a copy is withheld (`withheldKinds`, the one rule of the step: a
 * document): a column whose declared path holds one is refused here, before the copy exists.
 */
function mayKeepPersonal(
  deps: Pick<CopiesDeps, 'connectors'>,
  input: { connectorId: ConnectorId; definition: CopyDefinition },
) {
  const { connectorId, definition } = input
  if (definition.version === 1) return
  const withheld = withheldKinds('copy')
  const refused = [...deps.connectors().personalColumns(connectorId, definition).values()].find(
    (kind) => withheld.includes(kind),
  )
  if (refused !== undefined)
    throw new Failure('COPY_PERSONAL_NOT_KEPT', { details: { connectorId, kind: refused } })
}

/** Each connection ACTIVE, with its account, in the proposal's order. */
async function activeSources(
  tx: CommandTx,
  companyId: InCompany['companyId'],
  connections: readonly ConnectionId[],
) {
  const sources: { connectionId: ConnectionId; accountRef: AccountRef | null }[] = []
  for (const connectionId of connections) {
    const linked = await connectionForCopy(tx, { companyId, connectionId })
    if (linked === undefined)
      throw new Failure('NOT_FOUND', { details: { reason: 'NO_CONNECTION' } })
    if (linked.kind !== 'ACTIVE') throw new Failure('COPY_CONNECTION_NOT_READY')
    sources.push({ connectionId, accountRef: linked.accountRef })
  }
  const [first, ...rest] = sources
  if (first === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'NO_CONNECTION' } })
  return [first, ...rest] as const
}

/**
 * Ligar a proposal, inside the Hub's transaction that admitted `manageCopies` (Capacidade 3; O Sync
 * de qualquer conector, U4): the proposal locked and OPEN (else the copy this attempt's key made, or
 * `COPY_PROPOSAL_DECIDED`), the role of who turns it on reading what it copies on each connection
 * (else `NOT_IN_ROLE` with the read's name), each connection ACTIVE, the copy with the proposal's
 * definition and no template, one source per connection, the proposal ACCEPTED with it, and the
 * release to the proposal's Projeto. The `GRANT` follows outside, with Ligar's own steps.
 */
export async function acceptedIn(
  deps: Pick<CopiesDeps, 'identity' | 'connectors'>,
  tx: CommandTx,
  input: Accepting,
  bodyHash: string,
) {
  const proposal = await lockedProposal(tx, input)
  if (proposal.state !== 'OPEN') {
    // Two requests with one key: the one that waited for the lock finds the copy the other made (code C37).
    const again = await earlierAttempt(tx, input, bodyHash)
    if (again === undefined) throw new Failure('COPY_PROPOSAL_DECIDED')
    return { copy: parsedCopy(again), projectId: ProjectId.parse(proposal.projectId) }
  }
  const connectorId = ConnectorId.parse(proposal.connectorId)
  const definition = CopyDefinition.parse(proposal.definition)
  const connections = await proposalConnections(tx, proposal)
  await mayReadSources(deps, tx, { ...input, connectorId, definition, connections })
  mayKeepPersonal(deps, { connectorId, definition })
  const sources = await activeSources(tx, input.companyId, connections)
  const row = await insertedCopy(tx, input, {
    ...{ connectorId, sources, name: proposal.name, label: proposal.label },
    ...{ model: null, bodyHash, definition },
  })
  await tx
    .update(copyProposal)
    .set({ state: 'ACCEPTED', copyId: row.id })
    .where(eq(copyProposal.id, proposal.id))
  const projectId = ProjectId.parse(proposal.projectId)
  await tx
    .insert(projectCopy)
    .values({
      ...{ companyId: input.companyId, projectId, copyId: row.id },
      ...{ grantedBy: input.personId, grantedAt: sql`statement_timestamp()` },
    })
    .onConflictDoNothing()
  return { copy: parsedCopy(row), projectId }
}

/** The Projeto the proposal an earlier attempt accepted was made in: the retry repeats its release. */
export async function acceptedProjectOf(tx: CommandTx, input: Accepting) {
  const proposal = await lockedProposal(tx, input)
  return ProjectId.parse(proposal.projectId)
}

/**
 * Dispensar (Capacidade 3): an open proposal becomes DISMISSED, one dismissed already answers the
 * same, and one turned on is `COPY_PROPOSAL_DECIDED`. Admits `manageCopies`.
 */
export async function dismissProposal(
  deps: Pick<CopiesDeps, 'database' | 'identity' | 'log'>,
  input: InCompany & { proposalId: CopyProposalId },
): Promise<void> {
  const scope = { kind: 'COMPANY', companyId: input.companyId, personId: input.personId } as const
  const fresh = await deps.database.command(scope, async (tx) => {
    await deps.identity.admitMember({ tx, ...input, action: 'manageCopies' })
    const dismissed = await tx
      .update(copyProposal)
      .set({ state: 'DISMISSED' })
      .where(
        and(
          eq(copyProposal.id, input.proposalId),
          eq(copyProposal.companyId, input.companyId),
          eq(copyProposal.state, 'OPEN'),
        ),
      )
      .returning({ id: copyProposal.id })
    if (dismissed.length > 0) return true
    const [row] = await tx
      .select({ state: copyProposal.state })
      .from(copyProposal)
      .where(
        and(eq(copyProposal.id, input.proposalId), eq(copyProposal.companyId, input.companyId)),
      )
    if (row === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'NO_PROPOSAL' } })
    if (row.state === 'ACCEPTED') throw new Failure('COPY_PROPOSAL_DECIDED')
    return false
  })
  if (fresh) {
    const { companyId, proposalId } = input
    deps.log.info({ companyId, proposalId }, 'COPY_PROPOSAL_DISMISSED')
  }
}
