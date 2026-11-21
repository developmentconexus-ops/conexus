import { z } from 'zod'
import { AgentId } from './agent-ids.ts'
import { CompanyId, Next, Page } from './companies.ts'
import { ConnectionId } from './connectors.ts'
import { ConversationId } from './conversations.ts'
import { PersonId } from './identity.ts'
import { ProjectId } from './library-ids.ts'
import { defineOperation } from './operation.ts'
import { OperationId } from './tools.ts'

/** The agents and the verbs of a read: the contract's, which the Hub's table checks too (code C26). */
export const DATA_READ_AGENTS = ['ASSISTANT', 'BUILDER', 'CONSTRUTOR', 'AGENT', 'APP'] as const
export const DATA_READ_VERBS = ['SAMPLE', 'QUERY', 'LIVE'] as const
export const DataReadAgent = z.enum(DATA_READ_AGENTS)
export type DataReadAgent = z.infer<typeof DataReadAgent>

/** The word a read's outcome takes on the screen and in the filter (founder, P3 (a)). */
export const DataReadResult = z.enum(['READ', 'NOT_FOUND', 'REFUSED', 'NOT_READ'])
export type DataReadResult = z.infer<typeof DataReadResult>

/**
 * The outcomes of each word but the last: what a read answered, a table outside the catalog, and a
 * query the role or the database refused. Every other outcome, an app's SQLSTATE among them, does
 * not read (code C26: the Hub filters and the screen names by this one table).
 */
export const OUTCOMES_OF = {
  READ: ['TABLE', 'QUERY', 'LIVE', 'OK', 'ROWS'],
  NOT_FOUND: ['NOT_IN_CATALOG'],
  REFUSED: ['NOT_IN_ROLE', 'QUERY_REFUSED'],
} as const satisfies Record<Exclude<DataReadResult, 'NOT_READ'>, readonly string[]>

const WORDS = ['READ', 'NOT_FOUND', 'REFUSED'] as const

/** The word of one outcome. */
export function resultOf(outcome: string): DataReadResult {
  const found = WORDS.find((word) => {
    const outcomes: readonly string[] = OUTCOMES_OF[word]
    return outcomes.includes(outcome)
  })
  return found ?? 'NOT_READ'
}

/** The most reads one export answers (founder, P8: "As 5.000 leituras mais novas."). */
export const DATA_READS_EXPORT_MAX = 5000
/** The longest period one export covers, as the ingestion platform's (founder, "Tudo A"). */
export const DATA_READS_EXPORT_DAYS = 31

/**
 * One read of the company's data as the Registro shows it: who, through which agent, where, what
 * was read, the query, the outcome, the count and the time. No field carries a row (criterion 76).
 * A Projeto deleted since keeps its id and has no name.
 */
export const DataReadEntry = z.object({
  id: z.uuid(),
  at: z.iso.datetime({ offset: true }),
  person: z.object({ id: PersonId, name: z.string() }),
  agent: DataReadAgent,
  project: z.object({ id: ProjectId, name: z.string().nullable() }).nullable(),
  agentId: AgentId.nullable(),
  threadId: ConversationId.nullable(),
  verb: z.enum(DATA_READ_VERBS),
  tables: z.array(z.string()),
  connection: ConnectionId.nullable(),
  operation: OperationId.nullable(),
  query: z.string().nullable(),
  outcome: z.string(),
  rows: z.int().nonnegative().nullable(),
  ms: z.int().nonnegative(),
})
export type DataReadEntry = z.infer<typeof DataReadEntry>

const InCompany = z.object({ companyId: CompanyId })

export const DataReadFilters = z.object({
  person: PersonId.optional(),
  agent: DataReadAgent.optional(),
  table: z.string().min(1).max(63).optional(),
  outcome: DataReadResult.optional(),
})
export type DataReadFilters = z.infer<typeof DataReadFilters>

const FAILURES = ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'] as const

export const listDataReads = defineOperation({
  id: 'listDataReads',
  summary:
    'Lists the reads of the company’s data, newest first, a page at a time, for an owner or an administrator.',
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/data-reads',
  bodyLimit: 1024,
  input: { params: InCompany, query: DataReadFilters.extend(Page.shape) },
  success: { status: 200, body: z.object({ reads: z.array(DataReadEntry), next: Next }) },
  failures: FAILURES,
})

/**
 * The period of an export: from one instant to another, the second left out, at most 31 days
 * (criterion 82). The screen sends the local midnights of its days (code C40).
 */
const Period = z.object({
  from: z.iso.datetime({ offset: true }),
  to: z.iso.datetime({ offset: true }),
})

const DAY_MS = 86_400_000

/** Whether `to` comes after `from` by at most 31 days. */
function withinExport(period: z.infer<typeof Period>): boolean {
  const span = Date.parse(period.to) - Date.parse(period.from)
  return span > 0 && span <= DATA_READS_EXPORT_DAYS * DAY_MS
}

export const exportDataReads = defineOperation({
  id: 'exportDataReads',
  summary:
    'Answers the reads of the filter in a period of at most 31 days, newest first, up to 5,000, for a file.',
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/data-reads/export',
  bodyLimit: 1024,
  input: { params: InCompany, query: DataReadFilters.extend(Period.shape).refine(withinExport) },
  success: {
    status: 200,
    body: z.object({
      reads: z.array(DataReadEntry).max(DATA_READS_EXPORT_MAX),
      complete: z.boolean(),
    }),
  },
  failures: FAILURES,
})
