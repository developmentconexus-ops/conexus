import { z } from 'zod'
import { ConnectorId } from './company-roles.ts'
import { ConnectionId } from './connectors.ts'
import type { FailureCode } from './failures.ts'
import { ProjectId } from './library-ids.ts'

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
