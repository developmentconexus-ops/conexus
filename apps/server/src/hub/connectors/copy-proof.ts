import type { CopyDefinitionV1 } from '@conexus/connectors'
import type { ConnectionId, OfProject, PersonId } from '@conexus/hub-api'
import { PROOF_PAGE_ROWS } from '@conexus/hub-api'
import { roleOfSpeaker } from '../identity/public.ts'
import type { CopyRefusal } from './copy-port.ts'
import { copyPage } from './copy-port.ts'
import type { OpenedConnection } from './executor.ts'
import type { NotInRole } from './read.ts'
import type { Deps } from './rows.ts'
import { lackedDoorRead, personSpeaker } from './speaking.ts'

/** One page of a proposed version 1 copy, counted: never a row (Capacidade 3). */
export type Proved = Readonly<{ kind: 'PROVED'; rows: number; more: boolean; counts: null }>

type ProofAnswer =
  | Proved
  | CopyRefusal
  | NotInRole
  | Readonly<{ kind: 'NOT_GRANTED' }>
  | Readonly<{ kind: 'CALLS_SPENT' }>

/** The day a proof's window starts: today less the window's days, as a run's pass would read it. */
function windowFromOf(definition: CopyDefinitionV1): string | null {
  if (definition.window === undefined) return null
  const from = new Date(Date.now() - definition.window.days * 86_400_000)
  return from.toISOString().slice(0, 10)
}

/**
 * The proof of a proposal (Capacidade 3): on the connection the Projeto may read (`opened`), whose
 * connector copies, the person's role holding the read door as `connector_read` asks, one of the
 * run's 50 calls, then one page through the copies' own read (`copyPage`, the one way to
 * `readThrough` for a copy, C26). The page's rows never leave here, only their count.
 */
export async function provedPage(
  deps: Deps,
  a: Readonly<{
    ids: OfProject
    opened: OpenedConnection | undefined
    connectionId: ConnectionId
    personId: PersonId
    definition: CopyDefinitionV1
    signal: AbortSignal
    spend: () => boolean
  }>,
): Promise<ProofAnswer> {
  const { ids, opened, connectionId } = a
  if (opened?.connector.copy === undefined || opened.connector.readDoor === undefined) {
    const reason = opened === undefined ? 'NOT_GRANTED_TO_PROJECT' : 'NO_COPY_READ'
    deps.log.info({ ...ids, connectionId, reason }, 'BUILDER_READ_REFUSED')
    return { kind: 'NOT_GRANTED' }
  }
  const speaker = await personSpeaker(deps, ids.companyId, a.personId)
  if (speaker === undefined) return { kind: 'NOT_GRANTED' }
  const lacked = await lackedDoorRead(deps, ids.companyId, speaker, {
    connectionId,
    connector: opened.connector,
  })
  if (lacked !== undefined) {
    const role = roleOfSpeaker(speaker)
    const about = { ...ids, connectionId, operation: lacked.id, reason: 'NOT_IN_ROLE' }
    deps.log.info({ ...about, ...(role === null ? {} : { role }) }, 'BUILDER_READ_REFUSED')
    return { kind: 'NOT_IN_ROLE', role, operation: lacked.id }
  }
  if (!a.spend()) return { kind: 'CALLS_SPENT' }
  const page = await copyPage(deps, {
    ...{ companyId: ids.companyId, connectionId, enabledBy: a.personId, signal: a.signal },
    input: {
      definition: a.definition,
      after: null,
      since: '1900-01-01',
      windowFrom: windowFromOf(a.definition),
      limit: PROOF_PAGE_ROWS,
    },
  })
  if (page.kind === 'NO_CONNECTION') return { kind: 'NOT_GRANTED' }
  if (page.kind === 'REFUSED') return page.refusal
  if (page.kind === 'IN_LINE') return { kind: 'DEADLINE' }
  return { kind: 'PROVED', rows: page.page.rows.length, more: page.page.more, counts: null }
}
