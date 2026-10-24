import { MessageId } from '@conexus/hub-api'
import type { AgentControllerEvent } from '@mastra/core/agent-controller'
import { NOTICE_PART } from '../model-accounts/public.ts'
import type { Live } from './live.ts'
import { onShellEvent } from './shell.ts'
import { settleThinking, startThinking, tell, tellExtra } from './tell.ts'
import { endTurn } from './turn-end.ts'
import { logOf } from './turn-state.ts'
import { modelOf, wireEvent } from './wire.ts'

function onMessageEvent(live: Live, event: AgentControllerEvent): void {
  if (event.type === 'message_start' && event.message.role === 'signal') {
    // Only a message the person sent into the running turn is told: a waking message is already
    // the turn's question (`turn.after`).
    if (!live.pending.delete(event.message.id)) return
    const wired = wireEvent(event)
    const turn = logOf(live.state)
    if (wired !== undefined && turn !== undefined) tell(live, turn, wired)
    return
  }
  const turn = logOf(live.state)
  if (turn === undefined) return
  if (event.type === 'message_start' && event.message.role === 'assistant') {
    for (const [index, part] of event.message.content.parts.entries()) {
      if (part.type === 'reasoning') startThinking(turn, MessageId.parse(event.message.id), index)
    }
    const wired = wireEvent(event)
    if (wired !== undefined) tell(live, turn, wired)
    turn.model ??= modelOf(event.message)
    return
  }
  if (event.type !== 'message_update') return
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
  const turn = logOf(live.state)
  turn?.tally.heard(event)
  if (event.type === 'agent_end') {
    // Any end, a question or a plan included: the answer opens the next turn.
    endTurn(live)
  } else if (event.type === 'info') {
    // The notice the model queue says live (`notify`); Mastra saves the same one with the answer, so ours is not kept.
    if (turn !== undefined)
      tellExtra(live, turn, { type: NOTICE_PART, data: { text: event.message } })
  } else if (event.type === 'shell_output' || event.type === 'command_exit') {
    onShellEvent(live, event)
  } else if (event.type === 'message_start' || event.type === 'message_update') {
    onMessageEvent(live, event)
  } else if (turn !== undefined) {
    const wired = wireEvent(event)
    if (wired !== undefined) tell(live, turn, wired)
    if (wired?.type.startsWith('om_')) {
      const { omProgress, bufferingMessages, bufferingObservations } =
        live.session.displayState.get()
      const progress = { omProgress, bufferingMessages, bufferingObservations }
      tell(live, turn, { type: 'om_progress', ...progress })
    }
  }
}
