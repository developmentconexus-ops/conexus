import { z } from 'zod'
import { CompanyId } from './companies.ts'
import { ConnectionId } from './connectors.ts'
import type { FailureCode } from './failures.ts'
import {
  Cardinality,
  ConceptKey,
  Demand,
  Deprecate,
  FieldType,
  OntologyProposalId,
  ProposedItem,
  RelationPairs,
  RenameLabel,
} from './ontology.ts'
import { defineOperation } from './operation.ts'

// The routes of Conhecimento (A Ontologia da empresa, U4): what every member reads of the company's
// concepts, the suggestion from the screen, and the decision on a proposal.

const BASE = '/api/companies/{companyId}/ontology'
const InCompany = z.object({ companyId: CompanyId })
const Instant = z.iso.datetime()
/** A person's name as the Hub keeps it; null when the person no longer exists. */
const Who = z.string().nullable()
export const ElementState = z.enum(['EXPERIMENTAL', 'ACTIVE', 'DEPRECATED'])

/** One approval, with who proposed and who approved it. */
export const RevisionView = z.object({
  number: z.int().positive(),
  hash: z.string(),
  proposedBy: Who,
  approvedBy: Who,
  approvedAt: Instant,
})
export type RevisionView = z.infer<typeof RevisionView>

export const ConceptView = z.object({
  key: z.string(),
  name: z.string(),
  plural: z.string(),
  description: z.string(),
  synonyms: z.array(z.string()),
  titleField: z.string(),
  keyFields: z.array(z.string()),
  /** The concept this one is a role of. */
  base: z.string().nullable(),
  state: ElementState,
  replacedBy: z.string().nullable(),
})
export type ConceptView = z.infer<typeof ConceptView>

/** A row of the list of concepts: the concept, how many fields and codes it has, and where it is read from. */
export const ConceptRow = ConceptView.extend({
  fields: z.int(),
  codes: z.int(),
  /** The name of the connection the concept is read from; null when it has no source or the connection left. */
  source: z.string().nullable(),
})
export type ConceptRow = z.infer<typeof ConceptRow>

export const FieldView = z.object({
  concept: z.string(),
  key: z.string(),
  name: z.string(),
  description: z.string(),
  type: FieldType,
  currency: z.string().nullable(),
  unit: z.string().nullable(),
  column: z.string(),
  state: ElementState,
})
export type FieldView = z.infer<typeof FieldView>

export const CodeView = z.object({
  concept: z.string(),
  field: z.string(),
  value: z.string(),
  label: z.string(),
  description: z.string().nullable(),
  origin: z.enum(['DICTIONARY', 'PERSON']),
  state: z.enum(['ACTIVE', 'DEPRECATED']),
})
export type CodeView = z.infer<typeof CodeView>

export const RelationView = z.object({
  key: z.string(),
  from: z.string(),
  to: z.string(),
  cardinality: Cardinality,
  pairs: RelationPairs,
  fromName: z.string(),
  toName: z.string(),
  through: z.string().nullable(),
  throughPairs: RelationPairs.nullable(),
  state: ElementState,
})
export type RelationView = z.infer<typeof RelationView>

/** What a proof saw: the rows counted and the columns, never a row. */
export const ProofView = z.object({
  outcome: z.enum(['OK', 'FAILED']),
  reason: z.string().nullable(),
  rows: z.int().nonnegative(),
  columns: z.array(z.string()),
  ranAt: Instant,
})
export type ProofView = z.infer<typeof ProofView>

/** Where a concept is read from: the connection, the query and its proof. */
export const SourceView = z.object({
  connectionId: ConnectionId,
  /** The connection by its name; null when it left the company. */
  connectionName: z.string().nullable(),
  sql: z.string(),
  proof: ProofView.nullable(),
})
export type SourceView = z.infer<typeof SourceView>

/** What Conhecimento opens on: the newest revision, the concepts, and who decides what waits. */
export const OntologyView = z.object({
  revision: RevisionView.nullable(),
  concepts: z.array(ConceptRow),
  toReview: z.int().nonnegative(),
  mayApprove: z.boolean(),
  /** Who the person waits for when they may not approve: the owner on the first revision. */
  awaits: z.enum(['OWNER', 'APPROVER']).nullable(),
})
export type OntologyView = z.infer<typeof OntologyView>

/** A concept's page: the concept, its fields, its codes, its relations and its source. */
export const ConceptPage = z.object({
  concept: ConceptView,
  fields: z.array(FieldView),
  codes: z.array(CodeView),
  relations: z.array(RelationView),
  source: SourceView.nullable(),
})
export type ConceptPage = z.infer<typeof ConceptPage>

/** The active element an item changes, as it is before the decision. */
export const ElementBefore = z.discriminatedUnion('kind', [
  ConceptView.extend({ kind: z.literal('CONCEPT') }),
  FieldView.extend({ kind: z.literal('FIELD') }),
  CodeView.extend({ kind: z.literal('CODE') }),
  RelationView.extend({ kind: z.literal('RELATION') }),
])
export type ElementBefore = z.infer<typeof ElementBefore>

export const ItemDecision = z.enum(['PENDING', 'APPROVED', 'REFUSED'])

/** One item of a proposal: the change (`item`, the after), the element before, its proof and its decision. */
export const ProposalItemView = z.object({
  n: z.int().positive(),
  target: z.string(),
  item: ProposedItem,
  before: ElementBefore.nullable(),
  /** What `target` is called in the person's words ("Documento › Tipo de operação 101"); null when no active element has that address. */
  targetName: z.string().nullable(),
  proof: ProofView.nullable(),
  /** The name of the connection the proof read through; null without a proof or when the connection left. */
  connectionName: z.string().nullable(),
  decision: ItemDecision,
  reason: z.string().nullable(),
  decidedBy: Who,
  decidedAt: Instant.nullable(),
})
export type ProposalItemView = z.infer<typeof ProposalItemView>

export const ProposalView = z.object({
  id: OntologyProposalId,
  demand: z.string(),
  proposedBy: Who,
  agent: z.enum(['builder', 'assistant']).nullable(),
  createdAt: Instant,
  baseRevision: z.int().nonnegative(),
  state: z.enum(['OPEN', 'CLOSED']),
  items: z.array(ProposalItemView),
})
export type ProposalView = z.infer<typeof ProposalView>

/** One entry of Histórico: the revision and the demand of the proposal it approved. */
export const RevisionEntry = RevisionView.extend({
  proposalId: OntologyProposalId,
  demand: z.string(),
})
export type RevisionEntry = z.infer<typeof RevisionEntry>

/** What **Sugerir mudança** sends: a new label and explanation, or a deprecation. A new code waits for the connector's door. */
export const SuggestedItem = z.discriminatedUnion('kind', [RenameLabel, Deprecate])
export type SuggestedItem = z.infer<typeof SuggestedItem>
export const Suggestion = z.object({ why: Demand, items: z.array(SuggestedItem).min(1).max(10) })
export type Suggestion = z.infer<typeof Suggestion>

/** The decision on a proposal's items, against the revision the person saw. */
export const ConceptDecision = z
  .object({
    approved: z.array(z.int().positive()).max(200),
    refused: z
      .array(z.object({ n: z.int().positive(), reason: z.string().min(1).max(500) }))
      .max(200),
    expectedRevision: z.int().nonnegative(),
  })
  .refine((body) => body.approved.length + body.refused.length > 0, 'at least one item')
export type ConceptDecision = z.infer<typeof ConceptDecision>
export const ConceptDecided = z.object({ revision: z.int().positive().nullable() })
export type ConceptDecided = z.infer<typeof ConceptDecided>

const READS = [
  'NOT_FOUND',
  'SESSION_REQUIRED',
  'DATABASE_UNAVAILABLE',
] as const satisfies readonly FailureCode[]

export const getOntology = defineOperation({
  id: 'getOntology',
  summary:
    "Shows the company's concepts as the newest revision left them, how many items wait for a decision, and whether the person decides them.",
  access: 'session',
  method: 'GET',
  path: BASE,
  bodyLimit: 1024,
  input: { params: InCompany },
  success: { status: 200, body: OntologyView },
  failures: READS,
})

export const getOntologyConcept = defineOperation({
  id: 'getOntologyConcept',
  summary: 'Shows one concept with its fields, codes, relations and source.',
  access: 'session',
  method: 'GET',
  path: `${BASE}/concepts/{concept}`,
  bodyLimit: 1024,
  input: { params: InCompany.extend({ concept: ConceptKey }) },
  success: { status: 200, body: ConceptPage },
  failures: [...READS, 'CONCEPT_UNKNOWN'],
})

export const listOntologyProposals = defineOperation({
  id: 'listOntologyProposals',
  summary: 'Lists the proposals, newest first, each item with what it changes and its decision.',
  access: 'session',
  method: 'GET',
  path: `${BASE}/proposals`,
  bodyLimit: 1024,
  input: {
    params: InCompany,
    query: z.object({ state: z.enum(['OPEN', 'CLOSED']).optional() }),
  },
  success: { status: 200, body: z.object({ proposals: z.array(ProposalView) }) },
  failures: READS,
})

export const listOntologyRevisions = defineOperation({
  id: 'listOntologyRevisions',
  summary: 'Lists the revisions, newest first, with who proposed and who approved each.',
  access: 'session',
  method: 'GET',
  path: `${BASE}/revisions`,
  bodyLimit: 1024,
  input: { params: InCompany },
  success: { status: 200, body: z.object({ revisions: z.array(RevisionEntry) }) },
  failures: READS,
})

export const suggestConcepts = defineOperation({
  id: 'suggestConcepts',
  summary: "Proposes a change of the company's codes or labels, which waits for a decision.",
  access: 'session',
  method: 'POST',
  path: `${BASE}/proposals`,
  bodyLimit: 32 * 1024,
  input: { params: InCompany, body: Suggestion },
  attemptKey: true,
  success: { status: 201, body: z.object({ proposalId: OntologyProposalId }) },
  failures: [
    ...READS,
    'REQUEST_MALFORMED',
    'IDEMPOTENCY_CONFLICT',
    'TARGET_UNKNOWN',
    'NOT_IN_ROLE',
  ],
})

export const decideOntologyProposal = defineOperation({
  id: 'decideOntologyProposal',
  summary:
    "Approves and refuses a proposal's items; the approved ones become the company's next revision.",
  access: 'session',
  method: 'POST',
  path: `${BASE}/proposals/{proposalId}/decisions`,
  bodyLimit: 32 * 1024,
  input: { params: InCompany.extend({ proposalId: OntologyProposalId }), body: ConceptDecision },
  success: { status: 200, body: ConceptDecided },
  failures: [
    ...READS,
    'REQUEST_MALFORMED',
    'FIRST_REVISION_OWNER',
    'NOT_IN_ROLE',
    'REVISION_STALE',
    'DECISION_INCOMPLETE',
    'ITEM_DECIDED',
    'TARGET_UNKNOWN',
  ],
})
