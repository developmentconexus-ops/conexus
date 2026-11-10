import { z } from 'zod'
import { CompanyId, Next, Page } from './companies.ts'
import { ConnectorId } from './company-roles.ts'
import { ConnectionId } from './connectors.ts'
import type { FailureCode } from './failures.ts'
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

/** Why a run ended in error: the source's four failures, or the company's database. */
export const CopyRunFailureCode = z.enum([
  'COPY_SOURCE_REFUSED',
  'COPY_SOURCE_NEEDS_REAUTH',
  'COPY_SOURCE_UNREACHABLE',
  'COPY_SOURCE_UNREADABLE',
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
    z.object({ kind: z.literal('PARTIAL'), reason: z.enum(['CAP', 'STOPPED']) }),
    z.object({ kind: z.literal('ERROR'), code: CopyRunFailureCode }),
    z.object({ kind: z.literal('INTERRUPTED') }),
  ]),
  read: z.int().min(0),
  written: z.int().min(0),
})
export type CopyRun = z.infer<typeof CopyRun>

export const CopySummary = z.object({
  id: CopyId,
  // The table, `sync.<name>`.
  name: z.string(),
  // The label of what the definition came from (a template now).
  label: z.string(),
  connection: z.object({ id: ConnectionId, name: z.string(), connector: ConnectorId }),
  // None when the schedule is MISSING.
  interval: CopyInterval.nullable(),
  schedule: CopySchedule,
  // The open run, else the last.
  run: CopyRun.nullable(),
  // After the last complete pass.
  rows: z.int().min(0).nullable(),
  projects: z.array(z.object({ id: ProjectId, name: z.string() })),
  shown: z.object({
    query: z.string(),
    key: z.array(z.string()),
    // What a pass rereads: the rows changed since the last one, and the window; both none reads the whole source.
    changedSince: z.object({ column: z.string() }).nullable(),
    window: z.object({ column: z.string(), days: z.int() }).nullable(),
  }),
})
export type CopySummary = z.infer<typeof CopySummary>

export const CopyModelSummary = z.object({
  connector: ConnectorId,
  id: z.string(),
  label: z.string(),
})
export type CopyModelSummary = z.infer<typeof CopyModelSummary>

export const EnableCopy = z.object({
  connectionId: ConnectionId,
  model: z.string().max(40),
  interval: CopyInterval,
})
export type EnableCopy = z.infer<typeof EnableCopy>

const InCompany = z.object({ companyId: CompanyId })
const OfCopy = InCompany.extend({ copyId: CopyId })
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
  summary: 'Lists the company’s copies, each with its connection, schedule and last run.',
  access: 'session',
  method: 'GET',
  path: BASE,
  bodyLimit: 1024,
  input: { params: InCompany },
  success: { status: 200, body: z.object({ copies: z.array(CopySummary) }) },
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
  summary: `Turns a copy on from one of the company’s connections, keyed by ${ATTEMPT_KEY_HEADER}: its table in the company’s database and its schedule.`,
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
  ],
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
