import type {
  CompanyId,
  ConceptPage,
  ElementBefore,
  OntologyView,
  PersonId,
  ProofView,
  ProposalView,
  RevisionEntry,
} from '@conexus/hub-api'
import {
  fixedNameOf,
  OntologyProposalId,
  PersonId as PersonIdSchema,
  ProofShape,
} from '@conexus/hub-api'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import type { Database, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { IdentityPorts } from '../identity/public.ts'
import type { ActiveSet, CodeRow, ConceptRow, FieldRow, RelationRow } from './active.ts'
import { ADDRESS, activeIn } from './active.ts'
import { currentRevision } from './decide.ts'
import { storedItem } from './items.ts'
import { proofRun, proposal, proposalItem, revision } from './tables.ts'

type Deps = Readonly<{ database: Database; identity: IdentityPorts }>
type Reader = Readonly<{ companyId: CompanyId; personId: PersonId }>

function scopeOf(input: Reader) {
  return { kind: 'COMPANY', companyId: input.companyId, personId: input.personId } as const
}

/** Every member reads the concepts (`readCompany`); the proof of the role says who may decide. */
async function readable(deps: Deps, input: Reader, tx: ReadTx) {
  return deps.identity.admitMember({ tx, ...input, action: 'readCompany' })
}

function conceptOf({ companyId: _, revision: __, ...row }: ConceptRow) {
  return row
}
function fieldOf({ companyId: _, revision: __, columnName, ...row }: FieldRow) {
  return { ...row, column: columnName }
}
function codeOf({ companyId: _, revision: __, ...row }: CodeRow) {
  return row
}
function relationOf({ companyId: _, revision: __, fromConcept, toConcept, ...row }: RelationRow) {
  return { ...row, from: fromConcept, to: toConcept }
}

type Names = Map<string, string | null>
async function namesOf(deps: Deps, tx: ReadTx, ids: readonly (string | null)[]): Promise<Names> {
  const unique = [...new Set(ids.flatMap((id) => (id === null ? [] : [id])))]
  const named = await Promise.all(
    unique.map(
      async (id) =>
        [id, (await deps.identity.personNameOf(tx, PersonIdSchema.parse(id))) ?? null] as const,
    ),
  )
  return new Map(named)
}

function nameIn(names: Names, id: string | null): string | null {
  return id === null ? null : (names.get(id) ?? null)
}

/** GET ${BASE}: the newest revision, the concepts, what waits and who decides it. */
export async function ontologyView(deps: Deps, input: Reader): Promise<OntologyView> {
  return deps.database.read(scopeOf(input), async (tx) => {
    const admitted = await readable(deps, input, tx)
    const current = await currentRevision(tx)
    const [newest] = await tx.select().from(revision).where(eq(revision.number, current))
    const active = await activeIn(tx)
    const waiting = await tx
      .select({ n: proposalItem.n })
      .from(proposalItem)
      .innerJoin(proposal, eq(proposal.id, proposalItem.proposalId))
      .where(and(eq(proposal.state, 'OPEN'), eq(proposalItem.decision, 'PENDING')))
    const mayApprove =
      current === 0
        ? fixedNameOf(admitted.role) === 'owner'
        : deps.identity.allows(admitted.role, 'approveConcepts')
    const names = await namesOf(deps, tx, [newest?.proposedBy ?? null, newest?.approvedBy ?? null])
    return {
      revision:
        newest === undefined
          ? null
          : {
              number: newest.number,
              hash: newest.hash,
              proposedBy: nameIn(names, newest.proposedBy),
              approvedBy: nameIn(names, newest.approvedBy),
              approvedAt: newest.approvedAt.toISOString(),
            },
      concepts: active.concepts.map((row) => ({
        ...conceptOf(row),
        fields: active.fields.filter((field) => field.concept === row.key).length,
        codes: active.codes.filter((code) => code.concept === row.key).length,
      })),
      toReview: waiting.length,
      mayApprove,
      awaits: mayApprove ? null : current === 0 ? 'OWNER' : 'APPROVER',
    }
  })
}

async function proofsOf(tx: ReadTx, ids: readonly string[]): Promise<Map<string, ProofView>> {
  if (ids.length === 0) return new Map()
  const rows = await tx
    .select()
    .from(proofRun)
    .where(inArray(proofRun.id, [...ids]))
  return new Map(
    rows.map((row) => [
      row.id,
      {
        ...{ outcome: row.outcome, reason: row.reason, rows: row.rows },
        columns: ProofShape.parse(row.shape).map((each) => each.column),
        ranAt: row.ranAt.toISOString(),
      },
    ]),
  )
}

/** GET ${BASE}/concepts/{concept}: one concept with its fields, codes, relations and source. */
export async function conceptPage(
  deps: Deps,
  input: Reader & { concept: string },
): Promise<ConceptPage> {
  return deps.database.read(scopeOf(input), async (tx) => {
    await readable(deps, input, tx)
    const active = await activeIn(tx)
    const concept = active.concepts.find((row) => row.key === input.concept)
    if (concept === undefined) throw new Failure('CONCEPT_UNKNOWN')
    const source = active.sources.find((row) => row.concept === concept.key)
    const proofs = await proofsOf(tx, source === undefined ? [] : [source.proofRunId])
    function touches(row: RelationRow) {
      return [row.fromConcept, row.toConcept, row.through].includes(concept?.key ?? null)
    }
    return {
      concept: conceptOf(concept),
      fields: active.fields.filter((row) => row.concept === concept.key).map(fieldOf),
      codes: active.codes.filter((row) => row.concept === concept.key).map(codeOf),
      relations: active.relations.filter(touches).map(relationOf),
      source:
        source === undefined
          ? null
          : {
              connectionId: source.connectionId,
              sql: source.read.sql,
              proof: proofs.get(source.proofRunId) ?? null,
            },
    }
  })
}

/** The active element an address names, before a decision changes it. */
function beforeOf(active: ActiveSet, address: string): ElementBefore | null {
  const concept = active.concepts.find((row) => ADDRESS.concepts(row) === address)
  if (concept !== undefined) return { kind: 'CONCEPT', ...conceptOf(concept) }
  const field = active.fields.find((row) => ADDRESS.fields(row) === address)
  if (field !== undefined) return { kind: 'FIELD', ...fieldOf(field) }
  const code = active.codes.find((row) => ADDRESS.codes(row) === address)
  if (code !== undefined) return { kind: 'CODE', ...codeOf(code) }
  const relation = active.relations.find((row) => ADDRESS.relations(row) === address)
  if (relation !== undefined) return { kind: 'RELATION', ...relationOf(relation) }
  return null
}

/** GET ${BASE}/proposals: the proposals, newest first, each item with its before, its after and its proof. */
export async function proposalsView(
  deps: Deps,
  input: Reader & { state?: 'OPEN' | 'CLOSED' | undefined },
): Promise<ProposalView[]> {
  return deps.database.read(scopeOf(input), async (tx) => {
    await readable(deps, input, tx)
    const proposals = await tx
      .select()
      .from(proposal)
      .where(input.state === undefined ? undefined : eq(proposal.state, input.state))
      .orderBy(desc(proposal.createdAt))
    const items = await tx
      .select()
      .from(proposalItem)
      .where(
        inArray(
          proposalItem.proposalId,
          proposals.map((each) => each.id),
        ),
      )
      .orderBy(asc(proposalItem.n))
    const active = await activeIn(tx)
    const proofs = await proofsOf(
      tx,
      items.flatMap((row) => (row.proofRunId === null ? [] : [row.proofRunId])),
    )
    const names = await namesOf(deps, tx, [
      ...proposals.map((each) => each.proposedBy),
      ...items.map((row) => row.decidedBy),
    ])
    return proposals.map((each) => ({
      ...{ id: OntologyProposalId.parse(each.id), demand: each.demand, agent: each.agent },
      ...{ proposedBy: nameIn(names, each.proposedBy), createdAt: each.createdAt.toISOString() },
      ...{ baseRevision: each.baseRevision, state: each.state },
      items: items
        .filter((row) => row.proposalId === each.id)
        .map((row) => ({
          ...{ n: row.n, target: row.target, item: storedItem(row) },
          before: beforeOf(active, row.target),
          proof: row.proofRunId === null ? null : (proofs.get(row.proofRunId) ?? null),
          ...{ decision: row.decision, reason: row.reason },
          ...{
            decidedBy: nameIn(names, row.decidedBy),
            decidedAt: row.decidedAt?.toISOString() ?? null,
          },
        })),
    }))
  })
}

/** GET ${BASE}/revisions: the revisions, newest first, with who proposed and who approved each. */
export async function revisionsView(deps: Deps, input: Reader): Promise<RevisionEntry[]> {
  return deps.database.read(scopeOf(input), async (tx) => {
    await readable(deps, input, tx)
    const rows = await tx
      .select({ revision, demand: proposal.demand })
      .from(revision)
      .innerJoin(proposal, eq(proposal.id, revision.proposalId))
      .orderBy(desc(revision.number))
    const names = await namesOf(
      deps,
      tx,
      rows.flatMap((row) => [row.revision.proposedBy, row.revision.approvedBy]),
    )
    return rows.map(({ revision: row, demand }) => ({
      ...{ number: row.number, hash: row.hash, demand },
      proposalId: OntologyProposalId.parse(row.proposalId),
      proposedBy: nameIn(names, row.proposedBy),
      approvedBy: nameIn(names, row.approvedBy),
      approvedAt: row.approvedAt.toISOString(),
    }))
  })
}
