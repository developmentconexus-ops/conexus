import { z } from 'zod'
import { CompanyId, Next, Page } from './companies.ts'
import { ConnectorId } from './company-roles.ts'
import { ConnectionId } from './connectors.ts'
import { CopyShown, CopySource } from './copy-shown.ts'
import type { FailureCode } from './failures.ts'
import { PersonId } from './identity.ts'
import { ProjectId } from './library-ids.ts'
import { ATTEMPT_KEY_HEADER, defineOperation } from './operation.ts'

/** A copy of the company's data, kept in its own database (Capacidade 2). */
export const CopyId = z.uuid().brand('CopyId')
export type CopyId = z.infer<typeof CopyId>

/** One run of a copy: what it read and wrote, and how it ended. */
export const CopyRunId = z.uuid().brand('CopyRunId')
export type CopyRunId = z.infer<typeof CopyRunId>

/** How often a copy runs: 15 minutes at least (founder, 2026-11-09). */
export const CopyInterval = z.enum(['15m', '30m', '1h', '2h', '6h', '24h'])
export type CopyInterval = z.infer<typeof CopyInterval>
export const COPY_INTERVAL_DEFAULT = '30m' satisfies CopyInterval

/** What the clock holds for a copy: its next run, paused, or no schedule at all. */
export const CopySchedule = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('ACTIVE'), nextRunAt: z.iso.datetime() }),
  z.object({ kind: z.literal('PAUSED') }),
  z.object({ kind: z.literal('MISSING') }),
])
export type CopySchedule = z.infer<typeof CopySchedule>

/** Why a run ended in error: the source's failures, its read's ceiling, or the company's database. */
export const CopyRunFailureCode = z.enum([
  'COPY_SOURCE_REFUSED',
  'COPY_SOURCE_NEEDS_REAUTH',
  'COPY_SOURCE_UNREACHABLE',
  'COPY_SOURCE_UNREADABLE',
  'COPY_SOURCE_CEILING',
  'COPY_DATABASE_UNAVAILABLE',
] as const satisfies readonly FailureCode[])
export type CopyRunFailureCode = z.infer<typeof CopyRunFailureCode>

export const CopyRun = z.object({
  id: CopyRunId,
  startedAt: z.iso.datetime(),
  endedAt: z.iso.datetime().nullable(),
  outcome: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('RUNNING') }),
    z.object({ kind: z.literal('COMPLETE') }),
    // WAIT: the provider asked to wait; the next run goes on from where the source stopped.
    z.object({ kind: z.literal('PARTIAL'), reason: z.enum(['CAP', 'STOPPED', 'WAIT']) }),
    z.object({ kind: z.literal('ERROR'), code: CopyRunFailureCode }),
    z.object({ kind: z.literal('INTERRUPTED') }),
  ]),
  read: z.int().min(0),
  written: z.int().min(0),
})
export type CopyRun = z.infer<typeof CopyRun>

/** What a pass rereads: the whole source, the rows changed within a window of days, or only the rows changed. */
export const CopyMode = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('WHOLE') }),
  z.object({ kind: z.literal('WINDOW'), days: z.int().min(1) }),
  z.object({ kind: z.literal('CHANGES') }),
])
export type CopyMode = z.infer<typeof CopyMode>

export const CopySummary = z.object({
  id: CopyId,
  // The table, `sync.<name>`.
  name: z.string(),
  // The label of what the definition came from: a template, or the Builder's proposal.
  label: z.string(),
  // Each connection the copy reads, in the order its sources were made.
  sources: z.array(CopySource).min(1),
  // None when the schedule is MISSING.
  interval: CopyInterval.nullable(),
  schedule: CopySchedule,
  // The open run, else the last.
  run: CopyRun.nullable(),
  // After the last complete pass.
  rows: z.int().min(0).nullable(),
  // How a pass reads the source, from the definition alone.
  mode: CopyMode,
  projects: z.array(z.object({ id: ProjectId, name: z.string() })),
  shown: CopyShown,
})
export type CopySummary = z.infer<typeof CopySummary>

export const CopyModelSummary = z.object({
  connector: ConnectorId,
  id: z.string(),
  label: z.string(),
})
export type CopyModelSummary = z.infer<typeof CopyModelSummary>

/** A copy the Builder proposed in a Projeto's conversation, until a person turns it on or dismisses it (Capacidade 3). */
export const CopyProposalId = z.uuid().brand('CopyProposalId')
export type CopyProposalId = z.infer<typeof CopyProposalId>

/** Ligar from one of the connector's templates. */
export const EnableCopyFromModel = z.object({
  from: z.literal('MODEL'),
  connectionId: ConnectionId,
  model: z.string().max(40),
  interval: CopyInterval,
})
export type EnableCopyFromModel = z.infer<typeof EnableCopyFromModel>

/** What a copy is turned on from: a template of the connection's connector, or the Builder's proposal. */
export const EnableCopy = z.discriminatedUnion('from', [
  EnableCopyFromModel,
  z.object({ from: z.literal('PROPOSAL'), proposalId: CopyProposalId, interval: CopyInterval }),
])
export type EnableCopy = z.infer<typeof EnableCopy>

/** Where a proposal stands: open until a person turns it on (ACCEPTED) or dismisses it. */
export const CopyProposalState = z.enum(['OPEN', 'ACCEPTED', 'DISMISSED'])
export type CopyProposalState = z.infer<typeof CopyProposalState>

export const CopyProposalSummary = z.object({
  id: CopyProposalId,
  // The table it would make, `sync.<name>`.
  name: z.string(),
  label: z.string(),
  // Each connection the proposal reads; one deleted since is left out.
  sources: z.array(CopySource),
  project: z.object({ id: ProjectId, name: z.string() }),
  shown: CopyShown,
  // The same words as a copy's own row, from the definition alone.
  mode: CopyMode,
  // The proof: its rows, never one of them, whether more followed, and the calls a whole pass
  // spends over every connection (null when a read does not tell its total).
  proved: z.object({ rows: z.int().min(0), more: z.boolean(), calls: z.int().min(0).nullable() }),
  proposedBy: z.object({ id: PersonId, name: z.string() }),
  state: CopyProposalState,
})
export type CopyProposalSummary = z.infer<typeof CopyProposalSummary>

/** The most proposals one list may name by id (the conversation's cards). */
export const PROPOSALS_NAMED_MAX = 20

const InCompany = z.object({ companyId: CompanyId })
const OfCopy = InCompany.extend({ copyId: CopyId })
const OfProposal = InCompany.extend({ proposalId: CopyProposalId })
/** Up to 20 proposals by id, comma-separated: each comes back whatever its state. */
const NamedProposals = z.object({
  proposalId: z
    .string()
    .transform((list) => list.split(','))
    .pipe(z.array(CopyProposalId).max(PROPOSALS_NAMED_MAX))
    .optional(),
})
const OfRelease = InCompany.extend({ projectId: ProjectId, copyId: CopyId })
const BASE = '/api/companies/{companyId}/copies'
const READ_FAILURES = [
  'NOT_FOUND',
  'SESSION_REQUIRED',
  'DATABASE_UNAVAILABLE',
] as const satisfies readonly FailureCode[]
const ONE_FAILURES = [...READ_FAILURES, 'COPY_NOT_FOUND'] as const
const Copy = z.object({ copy: CopySummary })

export const listCopies = defineOperation({
  id: 'listCopies',
  summary:
    'Lists the company’s copies, each with its connection, schedule and last run, and the open proposals, with those named by id whatever their state.',
  access: 'session',
  method: 'GET',
  path: BASE,
  bodyLimit: 1024,
  input: { params: InCompany, query: NamedProposals },
  success: {
    status: 200,
    body: z.object({ copies: z.array(CopySummary), proposals: z.array(CopyProposalSummary) }),
  },
  failures: READ_FAILURES,
})

export const listCopyModels = defineOperation({
  id: 'listCopyModels',
  summary: 'Lists the copy models the connectors offer.',
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/copy-models',
  bodyLimit: 1024,
  input: { params: InCompany },
  success: { status: 200, body: z.object({ models: z.array(CopyModelSummary) }) },
  failures: READ_FAILURES,
})

export const enableCopy = defineOperation({
  id: 'enableCopy',
  summary: `Turns a copy on from a template of one of the company’s connections, or from the Builder’s proposal (released to its Projeto), keyed by ${ATTEMPT_KEY_HEADER}: its table in the company’s database and its schedule.`,
  access: 'session',
  method: 'POST',
  path: BASE,
  bodyLimit: 1024,
  input: { params: InCompany, body: EnableCopy },
  attemptKey: true,
  success: { status: 201, body: Copy },
  failures: [
    ...READ_FAILURES,
    ...(['IDEMPOTENCY_CONFLICT', 'COPY_EXISTS', 'COPY_MODEL_UNKNOWN'] as const),
    ...(['COPY_CONNECTION_NOT_READY', 'COPY_DATABASE_UNAVAILABLE', 'HUB_UPDATING'] as const),
    ...(['COPY_PROPOSAL_DECIDED', 'NOT_IN_ROLE', 'COPY_PERSONAL_NOT_KEPT'] as const),
  ],
})

export const dismissCopyProposal = defineOperation({
  id: 'dismissCopyProposal',
  summary: 'Dismisses an open copy proposal; one dismissed already answers the same.',
  access: 'session',
  method: 'POST',
  path: '/api/companies/{companyId}/copy-proposals/{proposalId}/dismiss',
  bodyLimit: 1024,
  input: { params: OfProposal },
  success: { status: 200, body: z.object({}) },
  failures: [...READ_FAILURES, 'COPY_PROPOSAL_DECIDED'],
})

export const pauseCopy = defineOperation({
  id: 'pauseCopy',
  summary: 'Pauses a copy: it does not run at its next times.',
  access: 'session',
  method: 'POST',
  path: `${BASE}/{copyId}/pause`,
  bodyLimit: 1024,
  input: { params: OfCopy },
  success: { status: 200, body: Copy },
  failures: ONE_FAILURES,
})

export const resumeCopy = defineOperation({
  id: 'resumeCopy',
  summary: 'Resumes a paused copy; one with no schedule gets the default interval.',
  access: 'session',
  method: 'POST',
  path: `${BASE}/{copyId}/resume`,
  bodyLimit: 1024,
  input: { params: OfCopy },
  success: { status: 200, body: Copy },
  failures: [...ONE_FAILURES, 'HUB_UPDATING'],
})

export const changeCopyInterval = defineOperation({
  id: 'changeCopyInterval',
  summary: 'Changes how often a copy runs; a paused copy stays paused.',
  access: 'session',
  method: 'PATCH',
  path: `${BASE}/{copyId}`,
  bodyLimit: 1024,
  input: { params: OfCopy, body: z.object({ interval: CopyInterval }) },
  success: { status: 200, body: Copy },
  failures: [...ONE_FAILURES, 'HUB_UPDATING'],
})

export const runCopy = defineOperation({
  id: 'runCopy',
  summary: 'Runs a copy now, paused or not, unless a run of it is running.',
  access: 'session',
  method: 'POST',
  path: `${BASE}/{copyId}/run`,
  bodyLimit: 1024,
  input: { params: OfCopy },
  success: { status: 202, body: z.object({}) },
  failures: [...ONE_FAILURES, 'COPY_RUNNING', 'HUB_UPDATING'],
})

export const deleteCopy = defineOperation({
  id: 'deleteCopy',
  summary:
    "Deletes a copy with its table: the apps' read taken back first, then the copy ended alone; doing it again answers the same.",
  access: 'session',
  method: 'DELETE',
  path: `${BASE}/{copyId}`,
  bodyLimit: 1024,
  input: { params: OfCopy },
  // tablesLeft: the table the company's database did not drop yet; the copy is gone all the same,
  // and the next Apagar, Desligar or Ligar drops it.
  success: { status: 200, body: z.object({ tablesLeft: z.array(z.string()) }) },
  // COPY_DATABASE_UNAVAILABLE: the company's database did not answer before anything changed.
  failures: [...READ_FAILURES, 'COPY_DATABASE_UNAVAILABLE'],
})

export const listCopyRuns = defineOperation({
  id: 'listCopyRuns',
  summary: 'Lists the runs of a copy, newest first, 20 to a page.',
  access: 'session',
  method: 'GET',
  path: `${BASE}/{copyId}/runs`,
  bodyLimit: 1024,
  input: { params: OfCopy, query: Page },
  success: {
    status: 200,
    body: z.object({ copy: CopySummary, runs: z.array(CopyRun), next: Next }),
  },
  failures: ONE_FAILURES,
})

const RELEASE_BASE = '/api/companies/{companyId}/projects/{projectId}/copies'
const RELEASE_FAILURES = [
  ...ONE_FAILURES,
  'COPY_DATABASE_UNAVAILABLE',
] as const satisfies readonly FailureCode[]

export const listProjectCopies = defineOperation({
  id: 'listProjectCopies',
  summary: 'Lists the company’s copies and whether each is released to the Projeto.',
  access: 'session',
  method: 'GET',
  path: RELEASE_BASE,
  bodyLimit: 1024,
  input: { params: InCompany.extend({ projectId: ProjectId }) },
  success: {
    status: 200,
    body: z.object({
      copies: z.array(
        z.object({
          copy: CopyModelSummary.extend({ id: CopyId, name: z.string() }),
          granted: z.boolean(),
        }),
      ),
    }),
  },
  failures: READ_FAILURES,
})

export const grantProjectCopy = defineOperation({
  id: 'grantProjectCopy',
  summary: 'Releases a copy to a Projeto: its app’s logins may read the copy’s table.',
  access: 'session',
  method: 'PUT',
  path: `${RELEASE_BASE}/{copyId}`,
  bodyLimit: 1024,
  input: { params: OfRelease },
  success: { status: 200, body: z.object({ granted: z.literal(true) }) },
  failures: RELEASE_FAILURES,
})

export const revokeProjectCopy = defineOperation({
  id: 'revokeProjectCopy',
  summary: 'Takes a copy back from a Projeto.',
  access: 'session',
  method: 'DELETE',
  path: `${RELEASE_BASE}/{copyId}`,
  bodyLimit: 1024,
  input: { params: OfRelease },
  success: { status: 200, body: z.object({ granted: z.literal(false) }) },
  failures: RELEASE_FAILURES,
})
