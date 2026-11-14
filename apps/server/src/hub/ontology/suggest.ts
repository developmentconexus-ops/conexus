import { createHash, randomUUID } from 'node:crypto'
import type {
  CompanyId,
  FailureCode,
  ItemRefusal,
  PersonId,
  ProposedItem,
  Suggestion,
} from '@conexus/hub-api'
import { OntologyProposalId } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import type { CommandTx, Database } from '../../platform/database.ts'
import { violatedConstraint } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { ConceptDoor } from '../connectors/public.ts'
import type { IdentityPorts } from '../identity/public.ts'
import { currentRevision } from './decide.ts'
import { contentOf, sameChange, targetOf } from './items.ts'
import { checked } from './rules.ts'
import { proposal, proposalItem } from './tables.ts'
import type { World } from './world.ts'
import { contextOf, worldOf } from './world.ts'

export type Suggesting = Readonly<{
  companyId: CompanyId
  personId: PersonId
  attemptKey: string
  suggestion: Suggestion
}>
type Deps = Readonly<{ database: Database; identity: IdentityPorts; log: FailureLog }>

/** Each refusal of the U3 rules as the route answers it; the others cannot follow from these three kinds. */
const ANSWERED: Record<ItemRefusal, FailureCode> = {
  CODE_UNSEEN: 'CODE_UNSEEN',
  TARGET_UNKNOWN: 'TARGET_UNKNOWN',
  CONCEPT_INCOMPLETE: 'TARGET_UNKNOWN',
  NOT_IN_ROLE: 'NOT_IN_ROLE',
  PROOF_FAILED: 'PROOF_FAILED',
  ITEM_REPEATED: 'REQUEST_MALFORMED',
  FIELD_NOT_IN_PROOF: 'REQUEST_MALFORMED',
  RELATION_INVALID: 'REQUEST_MALFORMED',
  ROLE_NOT_SUBSET: 'REQUEST_MALFORMED',
  ROLE_KEY_MISMATCH: 'REQUEST_MALFORMED',
}

/**
 * The door of a person outside a conversation: the connectors give the Ontology none yet, so a new
 * code cannot be counted and answers as a connector with no concept read does (`PROOF_FAILED`).
 */
function unprovable(world: World, item: ProposedItem): ConceptDoor | undefined {
  const concept = item.kind === 'SET_CODE' ? item.concept : undefined
  const source =
    world.active.sources.find((each) => each.concept === concept) ?? world.active.sources[0]
  if (source === undefined) return undefined
  const failed = { kind: 'FAILED', reason: 'NO_DOOR' } as const
  return { connectionId: source.connectionId, prove: async () => failed, query: async () => failed }
}

/** Every item checked by its U3 rule; the first refusal answers the route, and nothing is written. */
async function checkedAll(world: World, items: readonly ProposedItem[]): Promise<void> {
  const seen: { kind: string; target: string }[] = []
  for (const item of items) {
    const change = { kind: item.kind, target: targetOf(item) }
    if (seen.some((each) => sameChange(each, change))) throw new Failure('REQUEST_MALFORMED')
    seen.push(change)
    const door = unprovable(world, item)
    if (door === undefined) throw new Failure('TARGET_UNKNOWN')
    const outcome = await checked(door, world, item, new Set())
    if ('refused' in outcome) {
      const code = ANSWERED[outcome.refused.reason]
      throw new Failure(code, {
        details: { target: change.target, reason: outcome.refused.reason },
        ...(code === 'NOT_IN_ROLE' ? { named: { operation: 'os conceitos da empresa' } } : {}),
      })
    }
  }
}

function hashOfBody(suggestion: Suggestion): string {
  return createHash('sha256').update(JSON.stringify(suggestion)).digest('hex')
}

/** The proposal an earlier attempt with this key made; the same key with another body is a conflict (C37). */
async function earlier(tx: CommandTx, input: Suggesting, bodyHash: string) {
  const [again] = await tx
    .select({ id: proposal.id, bodyHash: proposal.bodyHash })
    .from(proposal)
    .where(and(eq(proposal.companyId, input.companyId), eq(proposal.attemptKey, input.attemptKey)))
  if (again !== undefined && again.bodyHash !== bodyHash) throw new Failure('IDEMPOTENCY_CONFLICT')
  return again === undefined ? undefined : OntologyProposalId.parse(again.id)
}

async function written(deps: Deps, tx: CommandTx, input: Suggesting, bodyHash: string) {
  await deps.identity.admitMember({ tx, ...input, action: 'proposeConcepts' })
  const again = await earlier(tx, input, bodyHash)
  if (again !== undefined) return again
  const id = OntologyProposalId.parse(randomUUID())
  await tx.insert(proposal).values({
    ...{ id, companyId: input.companyId, demand: input.suggestion.why },
    ...{ proposedBy: input.personId, agent: null, conversationId: null },
    ...{ baseRevision: await currentRevision(tx), createdAt: sql`statement_timestamp()` },
    ...{ state: 'OPEN' as const, attemptKey: input.attemptKey, bodyHash },
  })
  await tx.insert(proposalItem).values(
    input.suggestion.items.map((item, at) => ({
      ...{ proposalId: id, companyId: input.companyId, n: at + 1, kind: item.kind },
      ...{ target: targetOf(item), content: contentOf(item), decision: 'PENDING' as const },
    })),
  )
  return id
}

/**
 * **Sugerir mudança** (A Ontologia da empresa, U4): any member proposes codes, labels and
 * deprecations, each checked by the U3 rules before any transaction opens (D22); then one proposal,
 * under the screen's attempt key, so the same key twice makes one (C37).
 */
export async function suggestConcepts(deps: Deps, input: Suggesting): Promise<OntologyProposalId> {
  const scope = { kind: 'COMPANY', companyId: input.companyId, personId: input.personId } as const
  const context = await deps.database.read(scope, async (tx) => {
    await deps.identity.admitMember({ tx, ...input, action: 'readCompany' })
    return contextOf(tx, null)
  })
  await checkedAll(worldOf(context, input.suggestion.items), input.suggestion.items)
  const bodyHash = hashOfBody(input.suggestion)
  let proposalId: OntologyProposalId
  try {
    proposalId = await deps.database.command(scope, (tx) => written(deps, tx, input, bodyHash))
  } catch (error) {
    // A second request with the key, at once: the first one's row answers it.
    if (violatedConstraint(error) !== 'proposal_company_id_attempt_key_key') throw error
    proposalId = await deps.database.command(scope, async (tx) => {
      const again = await earlier(tx, input, bodyHash)
      if (again === undefined) throw error
      return again
    })
  }
  deps.log.info({ proposalId, items: input.suggestion.items.length }, 'ONTOLOGY_SUGGESTED')
  return proposalId
}
