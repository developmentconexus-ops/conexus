import type {
  AgentId,
  CompanyData,
  ConversationId,
  DataSources,
  PersonId,
  ReadAnswer,
  ReadRequest,
} from '@conexus/hub-api'
import { companyData } from '@conexus/hub-api'
import type { Principal } from '../access/public.ts'
import type { TurnKey } from '../connectors/public.ts'
import type { Speaker } from '../identity/public.ts'
import { catalogOf } from './catalog.ts'
import type { DataDeps } from './deps.ts'
import { queryOf } from './query.ts'
import type { ReadEntry, RecordRead, Who } from './record.ts'
import { recordReadOf } from './record.ts'
import { rowsOf } from './rows.ts'

export type { DataDeps } from './deps.ts'
export { recordReadOf as recordRead } from './record.ts'

type TurnBinding = Readonly<{ turn: TurnKey }> &
  (
    | Readonly<{ speaker: Readonly<{ kind: 'PERSON'; personId: PersonId }> }>
    | Readonly<{
        speaker: Extract<Speaker, { kind: 'VERSION' }>
        agentId: AgentId
        number: number
      }>
  )

export type DataContext = Readonly<{
  /** The conversation the run belongs to; none in the Construtor's test of a draft. */
  thread: ConversationId | null
  /** Set only for a saved agent. */
  agentId?: AgentId
  turn?: TurnBinding
}>

type Asked = Readonly<{ request: ReadRequest; answer: ReadAnswer; who: Who; ms: number }>

const SAMPLE = { verb: 'SAMPLE', query: null, connectionId: null, operation: null } as const
const LIVE = { verb: 'LIVE', query: null, tables: [], rows: null } as const
const QUERY = { verb: 'QUERY', connectionId: null, operation: null } as const

/** The row of a read, or none when another owner records it: a live read that reached the system is `readThrough`'s. */
function entryOf({ request, answer, who, ms }: Asked): ReadEntry | undefined {
  const base = { ...who, outcome: answer.kind, ms }
  switch (request.kind) {
    case 'TABLE':
      return {
        ...{ ...base, ...SAMPLE, tables: [request.table] },
        rows: answer.kind === 'TABLE' ? answer.rows.length : null,
      }
    case 'QUERY':
      return answer.kind === 'QUERY'
        ? {
            ...{ ...base, ...QUERY, query: request.sql },
            ...{ tables: answer.tables.map(({ table }) => table), rows: answer.rows.length },
          }
        : { ...base, ...QUERY, query: request.sql, tables: [], rows: null }
    case 'OPERATION':
      if (answer.kind === 'TABLE') {
        return { ...base, ...SAMPLE, tables: [answer.table], rows: answer.rows.length }
      }
      if (!BEFORE_THE_SYSTEM.includes(answer.kind)) return undefined
      return {
        ...{ ...base, ...LIVE },
        ...{ connectionId: request.connection, operation: request.operation },
      }
    default:
      return request satisfies never
  }
}

const BEFORE_THE_SYSTEM: readonly ReadAnswer['kind'][] = [
  'NOT_IN_CATALOG',
  'CATALOG_UNAVAILABLE',
  'TABLE_UNAVAILABLE',
]

/** A read leaves its row before its answer returns; without the row nothing returns. Describe and act pass untouched. */
function recorded(data: CompanyData, record: RecordRead, who: Who): CompanyData {
  return {
    ...data,
    async read(request) {
      const started = performance.now()
      const answer = await data.read(request)
      const entry = entryOf({ request, answer, who, ms: Math.round(performance.now() - started) })
      if (entry === undefined) return answer
      return (await record(entry)) === 'RECORDED' ? answer : { kind: 'TABLE_UNAVAILABLE' }
    },
  }
}

/** The access contract bound to who asks and where, as the access door's principal. */
export function createCompanyData(
  deps: DataDeps,
): (principal: Principal, context: DataContext) => CompanyData {
  const record = recordReadOf(deps)
  return (principal, context) =>
    recorded(
      companyData({ sources: sourcesFor(deps, principal), now: () => new Date() }),
      record,
      whoOf(principal, context),
    )
}

function whoOf(principal: Principal, context: DataContext): Who {
  const { place } = principal
  return {
    ...{ companyId: principal.companyId, personId: principal.personId, by: principal.consumer },
    ...{ projectId: place.kind === 'PROJECT' ? place.projectId : null },
    ...{ agentId: context.agentId ?? null, threadId: context.thread },
  }
}

function sourcesFor(deps: DataDeps, principal: Principal): DataSources {
  return {
    catalog: () => catalogOf(deps, principal),
    rows: ({ table, signal }) => rowsOf(deps, principal, { table, signal }),
    live: async () => ({ kind: 'NOT_GRANTED' }),
    query: (a) => queryOf(deps, principal, a),
    funnel: async () => ({ kind: 'NOT_GRANTED' }),
  }
}
