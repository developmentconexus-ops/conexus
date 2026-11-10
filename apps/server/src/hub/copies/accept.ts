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

/** The copy row from the proposal's definition, with no template; a name a copy took meanwhile is `COPY_EXISTS`. */
async function insertedFrom(
  tx: CommandTx,
  input: Accepting,
  proposal: typeof copyProposal.$inferSelect,
  bodyHash: string,
) {
  try {
    const [row] = await tx
      .insert(copy)
      .values({
        ...{ id: CopyId.parse(randomUUID()), companyId: input.companyId },
        ...{ connectorId: proposal.connectorId, connectionId: proposal.connectionId },
        ...{ name: proposal.name, label: proposal.label, model: null },
        ...{ definition: CopyDefinition.parse(proposal.definition), createdBy: input.personId },
        ...{ createdAt: sql`statement_timestamp()`, attemptKey: input.attemptKey, bodyHash },
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
 * proposal locked and OPEN (else `COPY_PROPOSAL_DECIDED`), the role of who turns it on holding the
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
  if (proposal.state !== 'OPEN') throw new Failure('COPY_PROPOSAL_DECIDED')
  const connectionId = ConnectionId.parse(proposal.connectionId)
  const of = { companyId: input.companyId, connectionId }
  const lacked = await lackedReadOf(deps, tx, {
    ...of,
    connectorId: ConnectorId.parse(proposal.connectorId),
    personId: input.personId,
  })
  if (lacked !== undefined)
    throw new Failure('NOT_IN_ROLE', {
      details: { connectionId, reason: 'READ_DOOR' },
      named: { operation: lacked },
    })
  const linked = await connectionForCopy(tx, of)
  if (linked === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'NO_CONNECTION' } })
  if (linked.kind !== 'ACTIVE') throw new Failure('COPY_CONNECTION_NOT_READY')
  const row = await insertedFrom(tx, input, proposal, bodyHash)
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
