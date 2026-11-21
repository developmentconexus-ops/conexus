import { randomUUID } from 'node:crypto'
import type {
  AgentId,
  CompanyId,
  ConnectionId,
  ConversationId,
  DataReadAgent,
  DataReadFilters,
  DataReadResult,
  OperationId,
  PersonId,
  ProjectId,
} from '@conexus/hub-api'
import { OUTCOMES_OF, REFUSED_BY_DATABASE } from '@conexus/hub-api'
import type { SQL } from 'drizzle-orm'
import {
  and,
  arrayContains,
  desc,
  eq,
  gte,
  inArray,
  lt,
  not,
  notInArray,
  or,
  sql,
} from 'drizzle-orm'
import { z } from 'zod'
import type { ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { after } from '../../platform/pages.ts'
import type { Consumer } from '../access/public.ts'
import type { DataDeps } from './deps.ts'
import { dataRead } from './tables.ts'

const DataReadId = z.uuid().brand('DataReadId')

export type Who = Readonly<{
  companyId: CompanyId
  personId: PersonId
  by: Consumer | 'app'
  projectId: ProjectId | null
  agentId: AgentId | null
  threadId: ConversationId | null
}>

/** One read, as the row keeps it: names, the query, the outcome, the count and the time; never a cell. */
export type ReadEntry = Who &
  Readonly<
    | {
        verb: 'SAMPLE'
        tables: readonly [string]
        query: null
        connectionId: null
        operation: null
      }
    | {
        verb: 'QUERY'
        tables: readonly string[]
        query: string
        connectionId: null
        operation: null
      }
    | {
        verb: 'LIVE'
        tables: readonly []
        query: null
        connectionId: ConnectionId
        operation: OperationId
      }
  > &
  Readonly<{
    outcome: string
    rows: number | null
    ms: number
    /** The read's own id when its caller names it, so a repeat leaves no second row (the edge's notice). */
    id?: string
  }>

type Recorded = 'RECORDED' | 'UNRECORDED'
export type RecordRead = (entry: ReadEntry) => Promise<Recorded>

const AGENT_OF = {
  assistant: 'ASSISTANT',
  builder: 'BUILDER',
  construtor: 'CONSTRUTOR',
  agent: 'AGENT',
  app: 'APP',
} as const satisfies Record<Consumer | 'app', DataReadAgent>

/**
 * The one writer of data.data_read: one insert in the Hub's database, never in the caller's
 * transaction; an id already written is the same read, recorded once.
 */
export function recordReadOf(deps: Pick<DataDeps, 'database' | 'log'>): RecordRead {
  return async (entry) => {
    const { companyId, personId } = entry
    try {
      await deps.database.command({ kind: 'COMPANY', companyId, personId }, (tx) =>
        tx
          .insert(dataRead)
          .values({
            id: DataReadId.parse(entry.id ?? randomUUID()),
            companyId,
            at: sql`statement_timestamp()`,
            personId,
            agent: AGENT_OF[entry.by],
            projectId: entry.projectId,
            agentId: entry.agentId,
            threadId: entry.threadId,
            verb: entry.verb,
            tables: [...entry.tables],
            connectionId: entry.connectionId,
            operation: entry.operation,
            query: entry.query,
            outcome: entry.outcome,
            rows: entry.rows,
            ms: entry.ms,
          })
          .onConflictDoNothing({ target: dataRead.id }),
      )
      return 'RECORDED'
    } catch (error) {
      if (!(error instanceof Failure) || error.code !== 'DATABASE_UNAVAILABLE') throw error
      deps.log.error({ companyId, verb: entry.verb, cause: error.code }, 'DATA_READ_UNRECORDED')
      return 'UNRECORDED'
    }
  }
}

/** The rows of one word: its outcomes, an app's SQLSTATE for `REFUSED`, and for `NOT_READ` the rest. */
function outcomeIs(result: DataReadResult): SQL | undefined {
  const byDatabase = sql`${dataRead.outcome} ~ ${REFUSED_BY_DATABASE}`
  switch (result) {
    case 'READ':
    case 'NOT_FOUND':
      return inArray(dataRead.outcome, [...OUTCOMES_OF[result]])
    case 'REFUSED':
      return or(inArray(dataRead.outcome, [...OUTCOMES_OF.REFUSED]), byDatabase)
    case 'NOT_READ':
      return and(notInArray(dataRead.outcome, Object.values(OUTCOMES_OF).flat()), not(byDatabase))
    default:
      return result satisfies never
  }
}

/** The company's rows the filters keep; `table` finds a query that read it among others. */
function kept(companyId: CompanyId, filters: DataReadFilters): SQL | undefined {
  return and(
    eq(dataRead.companyId, companyId),
    filters.person === undefined ? undefined : eq(dataRead.personId, filters.person),
    filters.agent === undefined ? undefined : eq(dataRead.agent, filters.agent),
    filters.table === undefined ? undefined : arrayContains(dataRead.tables, [filters.table]),
    filters.outcome === undefined ? undefined : outcomeIs(filters.outcome),
  )
}

export type StoredRead = typeof dataRead.$inferSelect

const NEWEST_FIRST = [desc(dataRead.at), desc(dataRead.id)]

/**
 * The filters' rows newest first, after the row `after` names by its hour and then its id, so two
 * reads of the same hour are neither repeated nor skipped; `limit` rows at most. Read in the caller's
 * transaction, which admitted the reader.
 */
export function pageOfReads(
  tx: ReadTx,
  input: {
    companyId: CompanyId
    filters: DataReadFilters
    after: string | undefined
    limit: number
  },
): Promise<StoredRead[]> {
  const { companyId } = input
  const anchor = after(
    sql`(${dataRead.at}, ${dataRead.id})`,
    input.after,
    (id) =>
      tx
        .select({ at: dataRead.at, id: dataRead.id })
        .from(dataRead)
        .where(and(eq(dataRead.id, id), eq(dataRead.companyId, companyId))),
    'DESC',
  )
  return tx
    .select()
    .from(dataRead)
    .where(and(kept(companyId, input.filters), anchor))
    .orderBy(...NEWEST_FIRST)
    .limit(input.limit)
}

/** The filters' rows in `[from, to)`, newest first, `limit` at most. */
export function periodOfReads(
  tx: ReadTx,
  input: { companyId: CompanyId; filters: DataReadFilters; from: Date; to: Date; limit: number },
): Promise<StoredRead[]> {
  const { companyId, from, to } = input
  return tx
    .select()
    .from(dataRead)
    .where(and(kept(companyId, input.filters), gte(dataRead.at, from), lt(dataRead.at, to)))
    .orderBy(...NEWEST_FIRST)
    .limit(input.limit)
}
