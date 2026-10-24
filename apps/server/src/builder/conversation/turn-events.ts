import { MessageId } from '@conexus/hub-api'
import type { AgentControllerEvent } from '@mastra/core/agent-controller'
import { NOTICE_PART } from '../model-accounts/public.ts'
import type { Live } from './live.ts'
import { onShellEvent } from './shell.ts'
import { settleThinking, startThinking, tell, tellExtra } from './tell.ts'
import { endRun } from './turn-end.ts'
import { openTurn } from './turn-parts.ts'
import { modelOf, wireEvent } from './wire.ts'

function onMessageEvent(live: Live, event: AgentControllerEvent): void {
  if (event.type === 'message_start' && event.message.role === 'signal') {
    // Only a message the person sent into the running turn is told: a waking message is already
    // the turn's question (`turn.after`).
    if (!live.pending.delete(event.message.id)) return
    const wired = wireEvent(event)
    if (wired !== undefined) tell(live, openTurn(live), wired)
    return
  }
  if (event.type === 'message_start' && event.message.role === 'assistant') {
    const turn = openTurn(live)
    for (const [index, part] of event.message.content.parts.entries()) {
      if (part.type === 'reasoning') startThinking(turn, MessageId.parse(event.message.id), index)
    }
    const wired = wireEvent(event)
    if (wired !== undefined) tell(live, turn, wired)
    turn.model ??= modelOf(event.message)
    return
  }
  if (event.type !== 'message_update' || live.turn === undefined || live.turn.ended) return
  const turn = live.turn
  const { event: update } = event
  if (update.type === 'reasoning-delta')
    startThinking(turn, MessageId.parse(event.id), update.index)
  else settleThinking(live, turn)
  if (update.type === 'part' && update.part.type === 'reasoning') {
    startThinking(turn, MessageId.parse(event.id), update.index)
  }
  const wired = wireEvent(event)
  if (wired !== undefined) tell(live, turn, wired)
  if (update.type === 'part' && update.part.type === 'tool-invocation') {
    const { toolInvocation: call } = update.part
    if (call.state === 'output-error') turn.tally.failed(call.toolName)
  }
}

/** The controller's events as the stream says them (`wireEvent`), and what the turn keeps of them. */
export function onEvent(live: Live, event: AgentControllerEvent): void {
  live.turn?.tally.heard(event)
  if (event.type === 'agent_start') {
    openTurn(live)
    // The run Mastra starts carries the turn of the one before it: a message closed its card, or the
    // one before ended with input it never read.
    const runId = live.session.run.getRunId()
    if (live.carry?.run !== undefined && runId !== null) live.runs.set(runId, live.carry.run)
    live.carry = undefined
    live.ending = false
  } else if (event.type === 'agent_end') {
    // A run parked on a question or a plan is not over: its turn goes on once it is answered.
    if (event.reason !== 'suspended') endRun(live, event.reason)
  } else if (event.type === 'info') {
    // The notice the model queue says live (`notify`); Mastra saves the same one with the answer, so ours is not kept.
    tellExtra(live, openTurn(live), { type: NOTICE_PART, data: { text: event.message } })
  } else if (event.type === 'shell_output' || event.type === 'command_exit') {
    onShellEvent(live, event)
  } else if (event.type === 'message_start' || event.type === 'message_update') {
    onMessageEvent(live, event)
  } else if (live.turn !== undefined && !live.turn.ended) {
    const wired = wireEvent(event)
    if (wired !== undefined) tell(live, live.turn, wired)
    if (wired?.type.startsWith('om_')) {
      const { omProgress, bufferingMessages, bufferingObservations } =
        live.session.displayState.get()
      const progress = { omProgress, bufferingMessages, bufferingObservations }
      tell(live, live.turn, { type: 'om_progress', ...progress })
    }
    if (wired?.type === 'tool_suspended') live.turn.parked.add(wired.toolCallId)
  }
}
