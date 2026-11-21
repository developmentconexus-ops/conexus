import type { AgentId, PersonId } from '@conexus/hub-api'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { Access } from '../access/public.ts'
import type { Connectors, TurnKey } from '../connectors/public.ts'
import type { CopyService } from '../copies/public.ts'
import type { IdentityPorts, PersonSpeaker, Speaker } from '../identity/public.ts'
import type { ProjectPorts } from '../projects/public.ts'

export type DataDeps = {
  database: Database
  identity: IdentityPorts
  log: FailureLog
  access: Access
  copies: () => CopyService['data']
  /** The Assistant's door, made after the data: a live read and an act go through it. */
  connectors: () => Pick<Connectors, 'assistant'>
  projects: ProjectPorts
}

/** The turn a live read or an act spends, as the write funnel names who speaks (write-record.ts WriteRequest): a person, or a saved agent's version. */
export type TurnBinding = Readonly<{ turn: TurnKey; approvedBy?: PersonId }> &
  (
    | Readonly<{ speaker: PersonSpeaker }>
    | Readonly<{ speaker: Extract<Speaker, { kind: 'AGENT' }>; agentId: AgentId; number: number }>
  )
