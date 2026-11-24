import { ASSISTANT_TOOL, ProposedApp } from '@conexus/hub-api'
import type { Message } from './messages.ts'

/** The words of the card's second button, which the person's message then says. */
export const CONTINUE_HERE = 'Continuar aqui'

const PROPOSING: readonly string[] = [ASSISTANT_TOOL.proposeApp, ASSISTANT_TOOL.proposeAppChange]

function wordsOf(message: Message): string {
  return message.parts
    .flatMap((part) => (part.type === 'text' ? part.text : []))
    .join('')
    .trim()
}

/** The calls of the Builder's message that proposed an app, in order. */
function proposalsIn(message: Message): string[] {
  return message.parts.flatMap((part) => {
    if (part.type !== 'tool-invocation') return []
    const call = part.toolInvocation
    const proposed =
      PROPOSING.includes(call.toolName) &&
      call.state === 'result' &&
      ProposedApp.safeParse(call.result).success
    return proposed ? [call.toolCallId] : []
  })
}

/**
 * The proposals of the conversation whose card offers no button (step 24.3.2, U3): one a later
 * proposal replaced, and one the person's **Continuar aqui** came after. Read from the messages
 * alone, as the plan card reads its own state from the stored result.
 */
export function closedProposals(messages: readonly Message[]): ReadonlySet<string> {
  const closed = new Set<string>()
  let open: string | undefined
  for (const message of messages) {
    if (message.role === 'person') {
      if (open !== undefined && wordsOf(message) === CONTINUE_HERE) {
        closed.add(open)
        open = undefined
      }
      continue
    }
    for (const toolCallId of proposalsIn(message)) {
      if (open !== undefined && open !== toolCallId) closed.add(open)
      open = toolCallId
    }
  }
  return closed
}
