import type {
  AgentId,
  CompanyData,
  ConversationId,
  DataSources,
  ReadAnswer,
  ReadRequest,
} from '@conexus/hub-api'
import { companyData } from '@conexus/hub-api'
import type { Principal } from '../access/public.ts'
import { catalogOf } from './catalog.ts'
import type { DataDeps, TurnBinding } from './deps.ts'
import { funnelOf } from './funnel.ts'
import { liveOf } from './live.ts'
import type { ReadEntry, RecordRead, Who } from './record.ts'
import { recordReadOf } from './record.ts'

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
      return { ...base, ...SAMPLE, tables: [request.table], rows: null }
    case 'QUERY':
      return { ...base, ...QUERY, query: request.sql, tables: [], rows: null }
    case 'OPERATION':
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
  'NOT_GRANTED',
  'CALLS_SPENT',
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

/** The contract over `sources`, each read recorded as `principal` asked it in `context`: the Hub's own, and the conformance world's over its watched sources on the laws' clock. */
export function recordedData(
  deps: DataDeps,
  principal: Principal,
  context: DataContext,
  sources: DataSources,
  now: () => Date,
): CompanyData {
  const data = companyData({ sources, now })
  return recorded(data, recordReadOf(deps), whoOf(principal, context))
}

function whoOf(principal: Principal, context: DataContext): Who {
  const { place } = principal
  return {
    ...{ companyId: principal.companyId, personId: principal.personId, by: principal.consumer },
    ...{ projectId: place.kind === 'PROJECT' ? place.projectId : null },
    ...{ agentId: context.agentId ?? null, threadId: context.thread },
  }
}

const NOT_GRANTED = { kind: 'NOT_GRANTED' } as const

/** A live read and an act need a turn to spend: without one bound, neither reaches the system. */
export function sourcesFor(
  deps: DataDeps,
  principal: Principal,
  context: DataContext,
): DataSources {
  const { turn, thread } = context
  return {
    catalog: () => catalogOf(deps, principal),
    live: async (a) =>
      turn === undefined ? NOT_GRANTED : liveOf(deps, principal, { turn, thread }, a),
    funnel: async (a) => (turn === undefined ? NOT_GRANTED : funnelOf(deps, principal, turn, a)),
  }
}
