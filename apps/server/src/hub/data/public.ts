import type { AgentId, CompanyData, ConversationId, DataSources, PersonId } from '@conexus/hub-api'
import { companyData } from '@conexus/hub-api'
import type { Principal } from '../access/public.ts'
import type { TurnKey } from '../connectors/public.ts'
import type { Speaker } from '../identity/public.ts'
import { catalogOf } from './catalog.ts'
import type { DataDeps } from './deps.ts'
import { queryOf } from './query.ts'
import { rowsOf } from './rows.ts'

export type { DataDeps } from './deps.ts'

type ReadBy = Readonly<{
  agent: 'ASSISTANT' | 'BUILDER' | 'AGENT' | 'APP'
  agentId?: AgentId
  threadId?: ConversationId
}>

type TurnBinding = Readonly<{ turn: TurnKey }> &
  (
    | Readonly<{ speaker: Readonly<{ kind: 'PERSON'; personId: PersonId }> }>
    | Readonly<{
        speaker: Extract<Speaker, { kind: 'VERSION' }>
        agentId: AgentId
        number: number
      }>
  )

export type DataContext = Readonly<{ by?: ReadBy; turn?: TurnBinding }>

/** The access contract bound to who asks and where, as the access door's principal. */
export function createCompanyData(
  deps: DataDeps,
): (principal: Principal, context?: DataContext) => CompanyData {
  return (principal, context) =>
    companyData({ sources: sourcesFor(deps, principal, context), now: () => new Date() })
}

function sourcesFor(deps: DataDeps, principal: Principal, _context?: DataContext): DataSources {
  return {
    catalog: () => catalogOf(deps, principal),
    rows: ({ table, signal }) => rowsOf(deps, principal, { table, signal }),
    live: async () => ({ kind: 'NOT_GRANTED' }),
    query: (a) => queryOf(deps, principal, a),
    funnel: async () => ({ kind: 'NOT_GRANTED' }),
  }
}
