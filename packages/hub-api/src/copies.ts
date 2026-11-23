import { z } from 'zod'
import { CompanyId, Next, Page } from './companies.ts'
import { ConnectorId } from './company-roles.ts'
import { CopyShown, CopySource, CopySystemMessage } from './copy-shown.ts'
import type { FailureCode } from './failures.ts'
import { ProjectId } from './library-ids.ts'
import { defineOperation } from './operation.ts'

/** A copy of the company's data, kept in its own database (Capacidade 2). */
export const CopyId = z.uuid().brand('CopyId')
export type CopyId = z.infer<typeof CopyId>

/** One run of a copy: what it read and wrote, and how it ended. */
export const CopyRunId = z.uuid().brand('CopyRunId')
export type CopyRunId = z.infer<typeof CopyRunId>

/** How often a copy runs: 15 minutes at least (founder, 2026-11-09). */
export const CopyInterval = z.enum(['15m', '30m', '1h', '2h', '6h', '24h'])
export type CopyInterval = z.infer<typeof CopyInterval>
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
    z.object({
      kind: z.literal('ERROR'),
      code: CopyRunFailureCode,
      system: CopySystemMessage.nullable(),
    }),
    z.object({ kind: z.literal('INTERRUPTED') }),
  ]),
  read: z.int().min(0),
  written: z.int().min(0),
  whole: z.boolean(), // the run began each source from nothing
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

const InCompany = z.object({ companyId: CompanyId })
const OfCopy = InCompany.extend({ copyId: CopyId })
const OfRelease = InCompany.extend({ projectId: ProjectId, copyId: CopyId })
const BASE = '/api/companies/{companyId}/copies'
export const READ_FAILURES = [
  'NOT_FOUND',
  'SESSION_REQUIRED',
  'DATABASE_UNAVAILABLE',
] as const satisfies readonly FailureCode[]
const ONE_FAILURES = [...READ_FAILURES, 'COPY_NOT_FOUND'] as const

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
          copy: z.object({
            connector: ConnectorId,
            id: CopyId,
            label: z.string(),
            name: z.string(),
          }),
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
