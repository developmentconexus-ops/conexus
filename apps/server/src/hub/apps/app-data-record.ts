import type { AgentId, CompanyId, ConversationId, PersonId, ProjectId } from '@conexus/hub-api'
import type { AppRead, SqlStatement } from '../../platform/company-postgres.ts'

/**
 * What a read of the app's schema, by an agent or by the app itself, hands the Registry's writer:
 * the statement and the outcome, never a row.
 */
type AppReadLine = Readonly<{
  companyId: CompanyId
  personId: PersonId
  by: 'builder' | 'agent' | 'app'
  projectId: ProjectId
  agentId: AgentId | null
  threadId: ConversationId | null
  verb: 'QUERY'
  tables: readonly []
  query: string
  connectionId: null
  operation: null
  outcome: string
  rows: number | null
  ms: number
  /** The edge's id of the app's query, so its notice sent again leaves no second row. */
  id?: string
}>

export type RecordAppRead = (line: AppReadLine) => Promise<'RECORDED' | 'UNRECORDED'>

/** Who reads the app's data for the Registro: the Builder, or a saved agent in a conversation. */
export type AppReader = Readonly<{
  by: 'builder' | 'agent'
  companyId: CompanyId
  personId: PersonId
  projectId: ProjectId
  agentId?: AgentId
  thread: ConversationId | null
}>

/**
 * One agent read of the app's schema, leaving its line before the answer returns: a query with no
 * catalog tables. Without the line the rows do not return.
 */
export async function recordedAppRead(
  record: RecordAppRead,
  who: AppReader,
  statement: SqlStatement,
  read: () => Promise<AppRead>,
): Promise<AppRead> {
  const started = performance.now()
  const answer = await read()
  const written = await record({
    ...{ companyId: who.companyId, personId: who.personId, by: who.by },
    ...{ projectId: who.projectId, agentId: who.agentId ?? null, threadId: who.thread },
    ...{ verb: 'QUERY', tables: [], query: statement.text, connectionId: null, operation: null },
    ...{ outcome: answer.kind === 'ROWS' ? 'ROWS' : answer.code },
    ...{ rows: answer.kind === 'ROWS' ? answer.rows.length : null },
    ms: Math.round(performance.now() - started),
  })
  return written === 'RECORDED' ? answer : { kind: 'FAILED', code: 'APP_DATA_UNAVAILABLE' }
}
