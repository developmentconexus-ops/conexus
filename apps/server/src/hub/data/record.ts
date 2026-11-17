import { randomUUID } from 'node:crypto'
import type {
  AgentId,
  CompanyId,
  ConnectionId,
  ConversationId,
  OperationId,
  PersonId,
  ProjectId,
} from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import { z } from 'zod'
import { Failure } from '../../platform/failure.ts'
import type { Consumer } from '../access/public.ts'
import type { DataDeps } from './deps.ts'
import type { DATA_READ_AGENTS } from './tables.ts'
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
  Readonly<{ outcome: string; rows: number | null; ms: number }>

type Recorded = 'RECORDED' | 'UNRECORDED'
export type RecordRead = (entry: ReadEntry) => Promise<Recorded>

type DataReadAgent = (typeof DATA_READ_AGENTS)[number]

const AGENT_OF = {
  assistant: 'ASSISTANT',
  builder: 'BUILDER',
  construtor: 'CONSTRUTOR',
  agent: 'AGENT',
  app: 'APP',
} as const satisfies Record<Consumer | 'app', DataReadAgent>

/** The one writer of data.data_read: one insert in the Hub's database, never in the caller's transaction. */
export function recordReadOf(deps: Pick<DataDeps, 'database' | 'log'>): RecordRead {
  return async (entry) => {
    const { companyId, personId } = entry
    try {
      await deps.database.command({ kind: 'COMPANY', companyId, personId }, (tx) =>
        tx.insert(dataRead).values({
          id: DataReadId.parse(randomUUID()),
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
        }),
      )
      return 'RECORDED'
    } catch (error) {
      if (!(error instanceof Failure) || error.code !== 'DATABASE_UNAVAILABLE') throw error
      deps.log.error({ companyId, verb: entry.verb, cause: error.code }, 'DATA_READ_UNRECORDED')
      return 'UNRECORDED'
    }
  }
}
