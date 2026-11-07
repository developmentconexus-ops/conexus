import type { ConnectionId, ToolDataAnswer, ToolVersionId } from '@conexus/hub-api'
import { ToolCallKey } from '@conexus/hub-api'
import type { FailureLog } from '../../platform/failure.ts'
import type { AssistantConnectors, SessionScope, TurnKey } from './assistant-port.ts'

/**
 * One saved tool's call while the Hub waits for the edge, as the agent's turn holds it: the
 * conversation, the version and its connection and declared reads, read from the agent's version,
 * and the turn whose 50 reads it shares.
 */
export type LiveToolCall = Readonly<{
  scope: SessionScope
  toolVersionId: ToolVersionId
  connectionId: ConnectionId
  reads: readonly string[]
  turn: TurnKey
}>

type ToolRead = Readonly<{
  toolVersionId: ToolVersionId
  call: ToolCallKey
  operation: string
  input: unknown
  deadlineMs: number
}>

const NOT_DECLARED = { kind: 'NOT_DECLARED' } as const

/**
 * The reads of saved tools (step 24.4): the edge names only the call's key, which the Hub opened
 * before calling it, so a read is the open call's version's, of a read it declared, in the turn that
 * opened it, through the agents' own door and its count of 50 (security S10: any other is
 * `NOT_DECLARED` to the tool, the reason in the log).
 */
/** Why the call may not read, or nothing when the version declared the operation. */
function refusalOf(call: LiveToolCall | undefined, body: ToolRead): string | undefined {
  if (call === undefined) return 'NO_CALL'
  if (call.toolVersionId !== body.toolVersionId) return 'OTHER_VERSION'
  return call.reads.includes(body.operation) ? undefined : 'NOT_DECLARED'
}

/** What the Worker is told: a refusal by role reads as an operation the version did not declare. */
function toolAnswer(answered: Awaited<ReturnType<AssistantConnectors['read']>>): ToolDataAnswer {
  if (answered.kind === 'NOT_IN_ROLE') return NOT_DECLARED
  return answered.kind === 'OK' ? { kind: 'OK', value: answered.whole } : answered
}

export function createToolDoor(assistant: Pick<AssistantConnectors, 'read'>, log: FailureLog) {
  const live = new Map<ToolCallKey, LiveToolCall>()
  return {
    /** Opens a call, whose key the edge carries; `close` ends it once the edge answered. */
    open(call: LiveToolCall): { key: ToolCallKey; close(): void } {
      const key = ToolCallKey.parse(crypto.randomUUID())
      live.set(key, call)
      return { key, close: () => live.delete(key) }
    },

    async read(body: ToolRead): Promise<ToolDataAnswer> {
      const call = live.get(body.call)
      const refusal = refusalOf(call, body)
      if (call === undefined || refusal !== undefined) {
        log.info(
          { toolVersionId: body.toolVersionId, reason: refusal ?? 'NO_CALL' },
          'TOOL_READ_REFUSED',
        )
        return NOT_DECLARED
      }
      const answered = await assistant.read(call.scope, {
        connectionId: call.connectionId,
        operation: body.operation,
        input: body.input,
        turn: call.turn,
        signal: AbortSignal.timeout(body.deadlineMs),
      })
      return toolAnswer(answered)
    },
  }
}

export type ToolDoor = ReturnType<typeof createToolDoor>
