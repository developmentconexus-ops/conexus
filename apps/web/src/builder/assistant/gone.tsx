import { NotFound } from '../../ui/states.tsx'
import { CONVERSATION_GONE } from './text.ts'

/** What a conversation's address shows once the Hub has no such conversation: a bell's old notification lands here. */
export function ConversationGone() {
  return <NotFound hint={CONVERSATION_GONE} />
}
