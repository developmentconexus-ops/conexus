import { z } from 'zod'
import { CompanyId } from './companies.ts'
import { ConnectionId, LakeUnavailable } from './connectors.ts'
import { defineOperation } from './operation.ts'

export const LAKE_TABLE_NAME_PATTERN = /^[a-z][a-z0-9_]{0,59}$/
export const SOURCE_TABLE_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,59}$/

export const LakeRunId = z.uuid().brand('LakeRunId')
export type LakeRunId = z.infer<typeof LakeRunId>
export const LakeTableId = z.uuid().brand('LakeTableId')
export type LakeTableId = z.infer<typeof LakeTableId>
export const LakeTableName = z.string().regex(LAKE_TABLE_NAME_PATTERN).brand('LakeTableName')
export type LakeTableName = z.infer<typeof LakeTableName>
export const SourceTableId = z.string().regex(SOURCE_TABLE_ID_PATTERN).brand('SourceTableId')
export type SourceTableId = z.infer<typeof SourceTableId>

export const LAKE_INTERVALS = ['15m', '30m', '1h', '2h', '6h', '24h', 'MANUAL'] as const
export const LakeInterval = z.enum(LAKE_INTERVALS)
export type LakeInterval = z.infer<typeof LakeInterval>
/** Founder, 2026-11-23: "24 h, como a Nekt". */
export const LAKE_INTERVAL_DEFAULT = '24h' satisfies LakeInterval

export const LAKE_RUN_FAILURE_CODES = [
  'COPY_SOURCE_NEEDS_REAUTH',
  'COPY_SOURCE_REFUSED',
  'COPY_SOURCE_UNREACHABLE',
  'COPY_SOURCE_UNREADABLE',
  'COPY_LAKE_UNAVAILABLE',
  'COPY_TASK_LOST',
  'COPY_LAKE_WRITE_FAILED',
] as const
export const LakeRunFailureCode = z.enum(LAKE_RUN_FAILURE_CODES)
export type LakeRunFailureCode = z.infer<typeof LakeRunFailureCode>

export const SYSTEM_CODE_MAX = 64
export const SYSTEM_MESSAGE_MAX = 1000

export const SystemMessage = z.object({
  /** The HTTP status the system answered; null where the system is not an HTTP one (ECS's stop). */
  status: z.int().nullable(),
  code: z.string().max(SYSTEM_CODE_MAX).nullable(),
  message: z.string().max(SYSTEM_MESSAGE_MAX).nullable(),
})
export type SystemMessage = z.infer<typeof SystemMessage>

/** What the task's machine spent in a round, measured by the task itself; one for the whole round, never a table's. */
export const LakeRunMachine = z.object({
  allocated: z.object({ vcpu: z.number().positive(), memoryMib: z.int().positive() }),
  peak: z.object({ vcpu: z.number().min(0), memoryMib: z.int().min(0) }),
  /** One sample every `everySeconds` from the round's start, as `[vcpu, memoryMib]`. */
  everySeconds: z.int().min(5),
  samples: z.array(z.tuple([z.number().min(0), z.int().min(0)])).max(360),
})
export type LakeRunMachine = z.infer<typeof LakeRunMachine>

const LakeRunBase = {
  id: LakeRunId,
  startedAt: z.iso.datetime(),
  /** On a table's runs: the table's own, from `lake_table_run` (T.39). */
  whole: z.boolean(),
}
const LakeRunCounts = {
  endedAt: z.iso.datetime(),
  read: z.int().min(0),
  written: z.int().min(0),
  /** Null: the round was not measured (the task died, or the endpoint was not there). */
  machine: LakeRunMachine.nullable(),
}
export const LakeRun = z.discriminatedUnion('outcome', [
  z.object({ ...LakeRunBase, outcome: z.literal('RUNNING') }),
  z.object({ ...LakeRunBase, ...LakeRunCounts, outcome: z.literal('COMPLETE') }),
  z.object({
    ...LakeRunBase,
    ...LakeRunCounts,
    outcome: z.literal('ERROR'),
    code: LakeRunFailureCode,
    failedTable: LakeTableName.nullable(),
    system: SystemMessage.nullable(),
  }),
  z.object({ ...LakeRunBase, ...LakeRunCounts, outcome: z.literal('INTERRUPTED') }),
])
export type LakeRun = z.infer<typeof LakeRun>

const LakeMode = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('CHANGED'), column: z.string(), registry: z.boolean() }),
  z.object({ kind: z.literal('WINDOW'), column: z.string() }),
  z.object({ kind: z.literal('FULL') }),
])

export const LakeTablesOfConnection = z.object({
  lake: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('READY') }),
    z.object({ kind: z.literal('NOT_READY') }),
    z.object({
      kind: z.literal('UNAVAILABLE'),
      reason: LakeUnavailable,
    }),
  ]),
  interval: LakeInterval.nullable(),
  /** The copy's; null: the whole history. */
  startDate: z.iso.date().nullable(),
  tables: z.array(
    z.object({
      source: SourceTableId,
      label: z.string(),
      description: z.string().nullable(),
      group: z.string(),
      mode: LakeMode,
      columns: z.int().min(0).nullable(),
      /** The start date limits this table (`startDateLimits`). */
      limited: z.boolean(),
      copy: z.discriminatedUnion('kind', [
        // The kit's name, or with the connection's name when taken (T.16).
        z.object({ kind: z.literal('UNMARKED'), suggested: LakeTableName }),
        // The name is fixed once marked.
        z.object({ kind: z.literal('MARKED'), name: LakeTableName, lastRun: LakeRun.nullable() }),
      ]),
    }),
  ),
  lastRun: LakeRun.nullable(),
})
export type LakeTablesOfConnection = z.infer<typeof LakeTablesOfConnection>

/** The most tables one connection's copy marks. */
export const LAKE_COPY_TABLES_MAX = 60

/** The longest text of a table's source or name the wire carries; the Hub refuses a longer one as a bad name (422) or an undeclared table (422). */
const TABLE_TEXT_MAX = 120

export const SetLakeCopy = z.object({
  // Both are plain text here: a name off the pattern is 422 `COPY_NAME_INVALID` and a source the kit
  // does not declare is 422 `COPY_TABLE_NOT_DECLARED`, which only the Hub's checks answer (criterion 38).
  tables: z
    .array(
      z.object({ source: z.string().max(TABLE_TEXT_MAX), name: z.string().max(TABLE_TEXT_MAX) }),
    )
    .max(LAKE_COPY_TABLES_MAX),
  interval: LakeInterval,
  /** Null: the whole history. After today: 422 `COPY_START_DATE_INVALID`. Saving never starts a run (T.45). */
  startDate: z.iso.date().nullable(),
})
export type SetLakeCopy = z.infer<typeof SetLakeCopy>

/** `whole: true` is Ler de novo desde a data, whole only where `startDateLimits` (T.45). */
export const RunLakeCopy = z.object({ whole: z.boolean().default(false) })
export type RunLakeCopy = z.infer<typeof RunLakeCopy>

/** `already`: a run was open, so the call wrote nothing (200); otherwise the run was queued (202). */
export const RunLakeCopyAnswer = z.object({ already: z.boolean() })
export type RunLakeCopyAnswer = z.infer<typeof RunLakeCopyAnswer>

export const LakeTableSummary = z.object({
  id: LakeTableId,
  connection: z.object({ id: ConnectionId, name: z.string(), connector: z.string() }),
  name: LakeTableName,
  label: z.string(),
  source: SourceTableId,
  mode: LakeMode,
  interval: LakeInterval,
  /** Null when the date does not limit the table. */
  startDate: z.iso.date().nullable(),
  rows: z.int().min(0).nullable(),
  columns: z.array(
    z.object({ name: z.string(), type: z.string(), description: z.string().nullable() }),
  ),
  lastRun: LakeRun.nullable(),
  next: z.iso.datetime().nullable(),
})
export type LakeTableSummary = z.infer<typeof LakeTableSummary>

const InCompany = z.object({ companyId: CompanyId })
const OfConnection = InCompany.extend({ connectionId: ConnectionId })
const OfTable = InCompany.extend({ tableId: LakeTableId })

// The permission refusal and the connection the viewer does not read answer `NOT_FOUND` (S10).
const READ = ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'] as const

export const getLakeTablesOfConnection = defineOperation({
  id: 'getLakeTablesOfConnection',
  summary:
    "Lists a connection's tables the kit declares, with the lake copy's marks, interval, start date and last run.",
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/connections/{connectionId}/lake-tables',
  bodyLimit: 1024,
  input: { params: OfConnection },
  success: { status: 200, body: LakeTablesOfConnection },
  failures: READ,
})

export const setLakeCopy = defineOperation({
  id: 'setLakeCopy',
  summary:
    'Sets which tables of a connection the lake copies, under which names, how often and from which date; saving never starts a run.',
  access: 'session',
  method: 'PUT',
  path: '/api/companies/{companyId}/connections/{connectionId}/lake-copy',
  bodyLimit: 16 * 1024,
  input: { params: OfConnection, body: SetLakeCopy },
  success: { status: 200, body: LakeTablesOfConnection },
  failures: [
    ...READ,
    'COPY_LAKE_NOT_READY',
    'COPY_RUN_OPEN',
    'COPY_NAME_TAKEN',
    'COPY_NAME_FIXED',
    'COPY_TABLE_NOT_DECLARED',
    'COPY_NAME_INVALID',
    'COPY_START_DATE_INVALID',
    'COPY_AWS_UNAVAILABLE',
  ],
})

export const runLakeCopy = defineOperation({
  id: 'runLakeCopy',
  summary:
    "Starts a run of a connection's lake copy now, also under MANUAL; with a run open it answers `already` and writes nothing.",
  access: 'session',
  method: 'POST',
  path: '/api/companies/{companyId}/connections/{connectionId}/lake-copy/run',
  bodyLimit: 1024,
  input: { params: OfConnection, body: RunLakeCopy },
  success: { status: 202, body: RunLakeCopyAnswer },
  alsoAnswers: [{ status: 200, body: RunLakeCopyAnswer }],
  failures: READ,
})

export const listLakeTables = defineOperation({
  id: 'listLakeTables',
  summary: "Lists the company's lake tables of the connections the viewer reads.",
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/lake-tables',
  bodyLimit: 1024,
  input: { params: InCompany },
  success: { status: 200, body: z.array(LakeTableSummary) },
  failures: READ,
})

export const listLakeTableRuns = defineOperation({
  id: 'listLakeTableRuns',
  summary: "Lists the runs of a connection's copy that carried one lake table, with its counts.",
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/lake-tables/{tableId}/runs',
  bodyLimit: 1024,
  input: { params: OfTable },
  success: { status: 200, body: z.array(LakeRun) },
  failures: READ,
})
