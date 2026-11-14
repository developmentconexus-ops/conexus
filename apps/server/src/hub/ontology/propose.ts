import { randomUUID } from 'node:crypto'
import type {
  CompanyId,
  ConceptProposed,
  ConversationId,
  PersonId,
  ProposedItem,
} from '@conexus/hub-api'
import { OntologyProposalId } from '@conexus/hub-api'
import { and, eq, max, sql } from 'drizzle-orm'
import type { CommandTx, Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { ConceptDoor } from '../connectors/public.ts'
import { contentOf, sameChange, targetOf } from './items.ts'
import type { Proved } from './proof.ts'
import { writeProofs } from './proof.ts'
import type { Kept, Outcome } from './rules.ts'
import { checked, inDictionary, refusal } from './rules.ts'
import { proposal, proposalItem, revision } from './tables.ts'
import type { Pending, World } from './world.ts'
import { contextOf, worldOf } from './world.ts'

export type ProposeInput = Readonly<{
  companyId: CompanyId
  personId: PersonId
  agent: 'builder' | 'assistant'
  /** The conversation whose open proposal the items join; none opens a proposal of their own. */
  conversationId: ConversationId | null
  demand: string
  items: readonly ProposedItem[]
  door: ConceptDoor
}>

/** The order the items are checked in: the sources of concepts that are no role, the roles' sources, then the rest. */
function rank(item: ProposedItem, world: World): number {
  if (item.kind !== 'SET_SOURCE') return 2
  return world.concepts.get(item.concept)?.base === undefined ? 0 : 1
}

/** Each item's outcome, in the input's order; the same change asked twice, here or pending, is ITEM_REPEATED. */
async function outcomesOf(
  input: ProposeInput,
  world: World,
  pending: readonly Pending[],
  dictionary: ReadonlySet<string>,
): Promise<Outcome[]> {
  const seen: Pending[] = [...pending]
  const results: Outcome[] = []
  // The sources first, a role's after its base: every other rule reads what they proved.
  const order = input.items
    .map((item, at) => ({ item, at }))
    .sort((a, b) => rank(a.item, world) - rank(b.item, world))
  for (const { item, at } of order) {
    const target = targetOf(item)
    const change = { kind: item.kind, target }
    if (seen.some((each) => sameChange({ kind: each.item.kind, target: each.target }, change))) {
      results[at] = refusal(target, 'ITEM_REPEATED')
      continue
    }
    const outcome = await checked(input.door, world, item, dictionary)
    if ('kept' in outcome) seen.push({ item, target, proofRunId: null })
    results[at] = outcome
  }
  return results
}

/** The outcomes split: the items kept, every refusal, and every proof that ran, a refused item's too. */
function sorted(results: readonly Outcome[]) {
  const kept: Kept[] = []
  const refused: ConceptProposed['refused'][number][] = []
  const proofs: Proved[] = []
  for (const each of results) {
    if ('refused' in each) refused.push(each.refused)
    else kept.push(each.kept)
    const proof = 'kept' in each ? each.kept.proof : each.proof
    if (proof !== undefined) proofs.push(proof)
  }
  return { kept, refused, proofs }
}

/** The conversation's open proposal, locked, or a new one; a call with no conversation always opens one. */
async function openProposal(tx: CommandTx, input: ProposeInput) {
  if (input.conversationId !== null) {
    const [open] = await tx
      .select({ id: proposal.id, baseRevision: proposal.baseRevision })
      .from(proposal)
      .where(and(eq(proposal.conversationId, input.conversationId), eq(proposal.state, 'OPEN')))
      .for('update')
    if (open !== undefined) return { ...open, id: OntologyProposalId.parse(open.id) }
  }
  const [current] = await tx.select({ number: max(revision.number) }).from(revision)
  const opened = {
    id: OntologyProposalId.parse(randomUUID()),
    baseRevision: current?.number ?? 0,
  }
  await tx.insert(proposal).values({
    ...{ ...opened, companyId: input.companyId, demand: input.demand },
    ...{ proposedBy: input.personId, agent: input.agent, conversationId: input.conversationId },
    ...{ createdAt: sql`statement_timestamp()`, state: 'OPEN' as const },
  })
  return opened
}

/** The proposal and its kept items with every proof that ran, numbered after the proposal's last item. */
async function written(
  tx: CommandTx,
  log: FailureLog,
  input: ProposeInput,
  split: ReturnType<typeof sorted>,
) {
  const { kept, proofs } = split
  const opened = await openProposal(tx, input)
  const [last] = await tx
    .select({ n: max(proposalItem.n) })
    .from(proposalItem)
    .where(eq(proposalItem.proposalId, opened.id))
  const first = (last?.n ?? 0) + 1
  const on = { companyId: input.companyId, connectionId: input.door.connectionId }
  await writeProofs(tx, log, on, proofs)
  if (kept.length > 0)
    await tx.insert(proposalItem).values(
      kept.map(({ item, target, proof }, at) => ({
        ...{ proposalId: opened.id, companyId: input.companyId, n: first + at },
        ...{ kind: item.kind, target, content: contentOf(item) },
        ...{ proofRunId: proof?.id ?? null, decision: 'PENDING' as const },
      })),
    )
  return { ...opened, first }
}

/**
 * `concept_propose` (A Ontologia da empresa, U3): each item checked by its rule, the sources proved
 * through the door with no transaction open (D22), then the conversation's open proposal and the
 * kept items with their proofs in one transaction, which locks the proposal so a second call of the
 * same conversation appends after it. A refused item never stops the others; nothing is approved here.
 */
export async function proposeConcepts(
  deps: { database: Database; log: FailureLog },
  input: ProposeInput,
): Promise<ConceptProposed> {
  const scope = { kind: 'COMPANY', companyId: input.companyId, personId: input.personId } as const
  const context = await deps.database.read(scope, (tx) => contextOf(tx, input.conversationId))
  const world = worldOf(context, input.items)
  const codes = input.items.filter((item) => item.kind === 'SET_CODE')
  const dictionary = await inDictionary(deps.database, input, codes)
  const split = sorted(await outcomesOf(input, world, context.pending, dictionary))
  const proposed = await deps.database.command(scope, (tx) => written(tx, deps.log, input, split))
  deps.log.info(
    { proposalId: proposed.id, items: split.kept.length, refused: split.refused.length },
    'ONTOLOGY_PROPOSED',
  )
  return {
    kind: 'PROPOSED',
    proposalId: proposed.id,
    baseRevision: proposed.baseRevision,
    items: split.kept.map(({ target, proof }, at) => ({
      n: proposed.first + at,
      target,
      ...(proof?.answer.kind === 'OK'
        ? {
            proof: {
              rows: proof.answer.rows,
              columns: proof.answer.shape.map((each) => each.column),
            },
          }
        : {}),
    })),
    refused: split.refused,
  }
}
