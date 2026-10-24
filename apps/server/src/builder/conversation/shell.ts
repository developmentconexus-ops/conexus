import { ToolCallId } from '@conexus/hub-api'
import type { AgentControllerEvent } from '@mastra/core/agent-controller'
import type { Live } from './live.ts'
import { tell } from './tell.ts'
import { logOf } from './turn-state.ts'
import { cutTail, wireEvent, wireShell } from './wire.ts'

/** A running command's lines are said at most this often; all of them once more when it exits. */
const SAID_EVERY_MS = 1000

/** A command's output, kept to its last lines: said while it runs, and once more when it exits. */
export function onShellEvent(
  live: Live,
  event: Extract<AgentControllerEvent, { type: 'shell_output' | 'command_exit' }>,
): void {
  const turn = logOf(live.state)
  if (turn === undefined) return
  const exited = event.type === 'command_exit'
  if (!exited && Date.now() - (turn.shells.get(event.toolCallId) ?? 0) < SAID_EVERY_MS) return
  if (exited) turn.shells.delete(event.toolCallId)
  else turn.shells.set(event.toolCallId, Date.now())
  const output = live.session.displayState.get().activeTools.get(event.toolCallId)?.shellOutput
  const heard = cutTail(output ?? '', false)
  const stream = event.type === 'shell_output' ? event.stream : 'stdout'
  tell(
    live,
    turn,
    wireShell({ toolCallId: ToolCallId.parse(event.toolCallId), tail: heard, stream }),
  )
  const wired = wireEvent(event)
  if (exited && wired !== undefined) tell(live, turn, wired)
}
