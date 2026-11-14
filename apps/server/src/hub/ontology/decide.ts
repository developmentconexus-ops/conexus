import type {
  CompanyId,
  ConceptDecided,
  ConceptDecision,
  DecisionGap,
  OntologyProposalId,
  PersonId,
} from '@conexus/hub-api'
import { ConnectionId, fixedNameOf, ProofRunId } from '@conexus/hub-api'
import { and, eq, inArray, max, sql } from 'drizzle-orm'
import type { CommandTx, Database } from '../../platform/database.ts'
import { violatedConstraint } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { IdentityPorts } from '../identity/public.ts'
import type { ActiveSet } from './active.ts'
import { activeIn, applied, hashOf, incomplete } from './active.ts'
import { storedItem } from './items.ts'
import { proofRun, proposal, proposalItem, revision } from './tables.ts'
import {
  codeVersion,
  conceptVersion,
  fieldVersion,
  relationVersion,
  sourceVersion,
} from './versions/tables.ts'
import type { Approved } from './versions-of.ts'
import { versionsOf } from './versions-of.ts'

export type Deciding = Readonly<{
  companyId: CompanyId
  personId: PersonId
  proposalId: OntologyProposalId
  decision: ConceptDecision
}>
type Deps = Readonly<{ database: Database; identity: IdentityPorts; log: FailureLog }>

/** The refusal's label, in the phrase of `NOT_IN_ROLE`. */
const OPERATION = 'os conceitos da empresa'

/** The company's newest revision, or 0 before the first. */
export async function currentRevision(tx: Pick<CommandTx, 'select'>): Promise<number> {
  const [row] = await tx.select({ number: max(revision.number) }).from(revision)
  return row?.number ?? 0
}

/** The proposal, locked for the decision; one of another company is not found (S10). */
async function lockedProposal(tx: CommandTx, input: Deciding) {
  const [row] = await tx
    .select({ id: proposal.id, proposedBy: proposal.proposedBy })
    .from(proposal)
    .where(eq(proposal.id, input.proposalId))
    .for('update')
  if (row === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'NO_PROPOSAL' } })
  return row
}

/** The items the decision names, locked, each with its source's proof; one decided already is ITEM_DECIDED. */
async function pendingItems(tx: CommandTx, input: Deciding, numbers: readonly number[]) {
  const rows = await tx
    .select({
      n: proposalItem.n,
      kind: proposalItem.kind,
      content: proposalItem.content,
      target: proposalItem.target,
      decision: proposalItem.decision,
      proofRunId: proofRun.id,
      connectionId: proofRun.connectionId,
    })
    .from(proposalItem)
    .leftJoin(proofRun, eq(proofRun.id, proposalItem.proofRunId))
    .where(
      and(eq(proposalItem.proposalId, input.proposalId), inArray(proposalItem.n, [...numbers])),
    )
    .for('update', { of: proposalItem })
  if (rows.length !== numbers.length) throw new Failure('REQUEST_MALFORMED')
  if (rows.some((row) => row.decision !== 'PENDING')) throw new Failure('ITEM_DECIDED')
  return rows.map((row) => ({
    n: row.n,
    target: row.target,
    item: storedItem(row),
    proof:
      row.proofRunId === null || row.connectionId === null
        ? null
        : {
            id: ProofRunId.parse(row.proofRunId),
            connectionId: ConnectionId.parse(row.connectionId),
          },
  }))
}

/** Who decides at this revision: the owner the first one (L1's first revision), then whoever approves concepts. */
async function admitted(deps: Deps, tx: CommandTx, input: Deciding): Promise<number> {
  const proof = await deps.identity.admitMember({ tx, ...input, action: 'proposeConcepts' })
  const current = await currentRevision(tx)
  if (current === 0 && fixedNameOf(proof.role) !== 'owner')
    throw new Failure('FIRST_REVISION_OWNER')
  if (current > 0 && !deps.identity.allows(proof.role, 'approveConcepts'))
    throw new Failure('NOT_IN_ROLE', { named: { operation: OPERATION } })
  if (current !== input.decision.expectedRevision) throw new Failure('REVISION_STALE')
  return current
}

/** Each approval's gaps, marked on the item that changes the element or the one it needs. */
function gapsOf(
  next: ActiveSet,
  approved: readonly (Approved & { target: string })[],
): DecisionGap[] {
  const replacements = approved.flatMap(({ item, target }) =>
    item.kind === 'DEPRECATE' && item.replacedBy !== undefined
      ? [{ target, replacedBy: item.replacedBy }]
      : [],
  )
  return incomplete(next, replacements).map((gap) => ({
    n:
      approved.find((each) => each.target === gap.target)?.n ??
      approved.find((each) => each.target === gap.address)?.n ??
      null,
    ...gap,
  }))
}

async function written(tx: CommandTx, versions: ActiveSet): Promise<void> {
  if (versions.concepts.length > 0) await tx.insert(conceptVersion).values(versions.concepts)
  if (versions.fields.length > 0) await tx.insert(fieldVersion).values(versions.fields)
  if (versions.codes.length > 0) await tx.insert(codeVersion).values(versions.codes)
  if (versions.relations.length > 0) await tx.insert(relationVersion).values(versions.relations)
  if (versions.sources.length > 0) await tx.insert(sourceVersion).values(versions.sources)
}

/** The revision row; a second decision on the same base meets the first one's number (C38). */
async function insertRevision(
  tx: CommandTx,
  row: Omit<typeof revision.$inferInsert, 'approvedAt'>,
): Promise<void> {
  try {
    await tx.insert(revision).values({ ...row, approvedAt: sql`statement_timestamp()` })
  } catch (error) {
    if (violatedConstraint(error) === 'revision_pkey') throw new Failure('REVISION_STALE')
    throw error
  }
}

/** Each item's decision, and the proposal closed once none waits. */
async function markDecisions(tx: CommandTx, input: Deciding): Promise<void> {
  const decided = { decidedBy: input.personId, decidedAt: sql`statement_timestamp()` }
  const of = eq(proposalItem.proposalId, input.proposalId)
  const { approved, refused } = input.decision
  if (approved.length > 0)
    await tx
      .update(proposalItem)
      .set({ decision: 'APPROVED', ...decided })
      .where(and(of, inArray(proposalItem.n, approved)))
  for (const { n, reason } of refused)
    await tx
      .update(proposalItem)
      .set({ decision: 'REFUSED', reason, ...decided })
      .where(and(of, eq(proposalItem.n, n)))
  const [waiting] = await tx
    .select({ n: proposalItem.n })
    .from(proposalItem)
    .where(and(of, eq(proposalItem.decision, 'PENDING')))
    .limit(1)
  if (waiting === undefined)
    await tx.update(proposal).set({ state: 'CLOSED' }).where(eq(proposal.id, input.proposalId))
}

async function decideIn(deps: Deps, tx: CommandTx, input: Deciding): Promise<ConceptDecided> {
  const current = await admitted(deps, tx, input)
  const { proposedBy } = await lockedProposal(tx, input)
  const { approved, refused } = input.decision
  const numbers = [...approved, ...refused.map((each) => each.n)]
  if (new Set(numbers).size !== numbers.length) throw new Failure('REQUEST_MALFORMED')
  const items = await pendingItems(tx, input, numbers)
  const chosen = new Set(approved)
  const approvedItems = items.filter((each) => chosen.has(each.n)).sort((a, b) => a.n - b.n)
  const active = await activeIn(tx)
  const at = { companyId: input.companyId, revision: current + 1 }
  const versions = versionsOf(active, approvedItems, at)
  const next = applied(active, versions)
  const gaps = gapsOf(next, approvedItems)
  if (gaps.length > 0) throw new Failure('DECISION_INCOMPLETE', { named: { gaps } })
  const changes = Object.values(versions).some((list) => list.length > 0)
  if (changes) {
    await insertRevision(tx, {
      ...{ companyId: input.companyId, number: at.revision, proposalId: input.proposalId },
      ...{ proposedBy, approvedBy: input.personId },
      hash: hashOf(next),
    })
    await written(tx, versions)
  }
  await markDecisions(tx, input)
  return { revision: changes ? at.revision : null }
}

/**
 * The decision on a proposal's items (A Ontologia da empresa, U4), in one transaction: who decides,
 * the revision the person saw, the items still pending, the set the approvals leave closed, then the
 * revision, its versions and each item's decision. Any refusal undoes the whole transaction.
 */
export async function decideProposal(deps: Deps, input: Deciding): Promise<ConceptDecided> {
  const scope = { kind: 'COMPANY', companyId: input.companyId, personId: input.personId } as const
  const decided = await deps.database.command(scope, (tx) => decideIn(deps, tx, input))
  deps.log.info(
    {
      proposalId: input.proposalId,
      revision: decided.revision ?? 0,
      approved: input.decision.approved.length,
      refused: input.decision.refused.length,
    },
    'ONTOLOGY_DECIDED',
  )
  return decided
}
