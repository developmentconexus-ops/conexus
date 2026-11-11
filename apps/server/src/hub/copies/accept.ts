import { randomUUID } from 'node:crypto'
import type { CopyProposalId } from '@conexus/hub-api'
import { ConnectionId, ConnectorId, CopyId, ProjectId } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import type { CommandTx } from '../../platform/database.ts'
import { violatedConstraint } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { CopyDefinition, connectionForCopy, lackedReadOf } from '../connectors/public.ts'
import type { CopiesDeps, InCompany } from './store.ts'
import { parsedCopy } from './store.ts'
import { copy, copyProposal, projectCopy } from './tables.ts'

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

/** What a new copy row is made of, from a template or a proposal. */
export type NewCopy = Readonly<{
  connectorId: ConnectorId
  connectionId: ConnectionId
  name: string
  label: string
  model: string | null
  definition: CopyDefinition
  bodyHash: string
}>

/** The new copy row under the attempt's key; a name a copy took is `COPY_EXISTS`. */
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
        ...{ connectorId: made.connectorId, connectionId: made.connectionId },
        ...{ name: made.name, label: made.label, model: made.model },
        ...{ definition: made.definition, createdBy: input.personId },
        ...{ createdAt: sql`statement_timestamp()`, attemptKey: input.attemptKey },
        bodyHash: made.bodyHash,
      })
      .returning()
    if (row === undefined) throw new Failure('COPY_EXISTS')
    return row
  } catch (error) {
    if (violatedConstraint(error) === 'copy_company_id_name_key') throw new Failure('COPY_EXISTS')
    throw error
  }
}

/**
 * Ligar a proposal, inside the Hub's transaction that admitted `manageCopies` (Capacidade 3): the
 * proposal locked and OPEN (else the copy this attempt's key made, or `COPY_PROPOSAL_DECIDED`), the role of who turns it on holding the
 * connection's read door (else `NOT_IN_ROLE` with the read's name), the connection ACTIVE, the copy
 * with the proposal's definition and no template, the proposal ACCEPTED with it, and the release
 * to the proposal's Projeto. The `GRANT` follows outside, with Ligar's own steps.
 */
export async function acceptedIn(
  deps: Pick<CopiesDeps, 'identity'>,
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
  const connectionId = ConnectionId.parse(proposal.connectionId)
  const connectorId = ConnectorId.parse(proposal.connectorId)
  const of = { companyId: input.companyId, connectionId }
  const lacked = await lackedReadOf(deps, tx, { ...of, connectorId, personId: input.personId })
  if (lacked !== undefined)
    throw new Failure('NOT_IN_ROLE', {
      details: { connectionId, reason: 'READ_DOOR' },
      named: { operation: lacked },
    })
  const linked = await connectionForCopy(tx, of)
  if (linked === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'NO_CONNECTION' } })
  if (linked.kind !== 'ACTIVE') throw new Failure('COPY_CONNECTION_NOT_READY')
  const row = await insertedCopy(tx, input, {
    ...{ connectorId, connectionId, name: proposal.name, label: proposal.label },
    ...{ model: null, bodyHash },
    definition: CopyDefinition.parse(proposal.definition),
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
