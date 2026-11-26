import { ConnectionId } from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import type { ConnectorAccess, GrantedConnection } from './connector-tools.ts'

export const SANKHYA = ConnectionId.parse('11111111-1111-4111-8111-111111111111')
export const LOJA = ConnectionId.parse('22222222-2222-4222-8222-222222222222')

export function granted(
  connector: string,
  connectionId: ConnectionId,
  name = 'Matriz',
): GrantedConnection {
  return {
    connectionId,
    connector,
    name,
    perProject: 'many',
    skill: { name: `conexus-${connector}`, content: '', references: {} },
    reads: [{ operation: 'consultar', label: 'Consultas', summary: 'consulta', list: null }],
    writes: [],
    notes: [],
  }
}

export const QUIET = { info: () => undefined, error: () => undefined }

/** An access over `connections`, whose reads and notebook calls are recorded. */
export function accessOver(
  connections: ReturnType<typeof granted>[],
  over: Partial<ConnectorAccess> = {},
) {
  const reads: { connectionId: string; operation: string; input: unknown }[] = []
  const notes: string[] = []
  const access: ConnectorAccess = {
    connections,
    read: async (call) => {
      reads.push({ connectionId: call.connectionId, operation: call.operation, input: call.input })
      return { kind: 'OK', value: { linhas: [] }, complete: true, rows: 0, bytes: 14 }
    },
    log: QUIET,
    notes: async (connectionId) => {
      notes.push(connectionId)
      return {}
    },
    wording: { whose: 'x' },
    ...over,
  }
  return { access, reads, notes }
}

/** The context of a call the person answered Aprovar on the notebook's card. */
export const YES = { agent: { resumeData: { approved: true }, suspendPayload: {} } }

export function runOn(set: object, name: string, input: object, context: object = {}) {
  return Object(set)[name].execute(input, { requestContext: new RequestContext(), ...context })
}
