import type { ConnectorAnswer, Connectors } from '@conexus/app-contract'
import type { AppSessionToken, HostLabel } from '@conexus/hub-api'
import { CALL_DEADLINE_MS } from '@conexus/hub-api'
import type { HubPort } from './hub.ts'

/** What the dispatcher binds one call's connectors to; the app reads none of it. */
export type ConnectorsProps = Readonly<{
  host: HostLabel
  session: AppSessionToken
  endsAt: number
}>

const DEADLINE: ConnectorAnswer = { kind: 'DEADLINE' }
const UNREACHABLE: ConnectorAnswer = { kind: 'UNREACHABLE' }

/** The dispatcher's log line of a Hub that gave no usable answer, with the reason and no data (S41). */
function hubGaveNone(reason: string) {
  console.error(JSON.stringify({ level: 50, msg: 'CONNECTOR_HUB_NO_ANSWER', reason }))
}

/**
 * The app's `connectors` of one call (decision 0047): the session stays here and the Hub knows the
 * Projeto from it. A call after the click's deadline never reaches the Hub, and the Hub is given only
 * the time that remains.
 */
export function connectorsOf(hub: HubPort, { host, session, endsAt }: ConnectorsProps): Connectors {
  return {
    async call(connector, operation, input, connection) {
      const left = Math.min(Math.floor(endsAt - Date.now()), CALL_DEADLINE_MS)
      if (left < 1) return DEADLINE
      const answer = await hub.callAppConnector(
        { host, session, connector, operation, connection: connection ?? null, input },
        left,
      )
      if (answer.kind === 'DONE') return answer.value
      if (answer.kind === 'NO_ANSWER' && answer.reason === 'TIMEOUT') return DEADLINE
      hubGaveNone(answer.kind === 'REFUSED' ? answer.code : answer.reason)
      return UNREACHABLE
    },
    async connections(connector) {
      const answer = await hub.listAppConnections({ host, session, connector })
      if (answer.kind === 'DONE') return answer.value.names
      hubGaveNone(answer.kind === 'REFUSED' ? answer.code : answer.reason)
      return []
    },
  }
}
