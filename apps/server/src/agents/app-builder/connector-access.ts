import { randomUUID } from 'node:crypto'
import { RunId } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import type {
  Asker,
  ConnectorAccess,
  ConnectorPort,
  GrantedConnection,
  NoteSave,
} from '../../harness/tools/public.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'

function runIn(who: Asker, requestContext: RequestContext): RunId {
  const runId = who.runIdOf(requestContext)
  if (runId === undefined) {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'CONNECTOR_TOOL_WITHOUT_RUN' } })
  }
  return runId
}

/** The Builder's access: its Projeto's granted connections through its door, counted by run. */
export function builderAccess(
  port: ConnectorPort,
  granted: readonly GrantedConnection[],
  who: Asker,
  log: FailureLog,
): { access: ConnectorAccess; save: NoteSave } {
  const access: ConnectorAccess = {
    connections: granted,
    log,
    read: (call, requestContext) =>
      port.read(who, {
        ...call,
        personId: who.personId,
        runId: runIn(who, requestContext),
      }),
    notes: (connectionId) => port.notes(who, connectionId),
    wording: { whose: "this Project's owner released" },
  }
  // The yes resumes the save before the run takes the Projeto again, so it counts as a run of its own.
  const save: NoteSave = (call, requestContext) =>
    port.saveNote(who, {
      ...call,
      personId: who.personId,
      runId: who.runIdOf(requestContext) ?? RunId.parse(randomUUID()),
    })
  return { access, save }
}
