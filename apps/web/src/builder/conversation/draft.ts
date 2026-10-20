import type { ConversationId } from '@conexus/hub-api'
import { useState } from 'react'
import { pageStorage } from '../../platform/storage.ts'

const drafts = pageStorage('session')

/** The unsent text of a conversation, kept for this browser tab so a switch of conversation loses nothing. */
export function useDraft(conversationId: ConversationId): [string, (text: string) => void] {
  const key = `conexus-draft:${conversationId}`
  const [text, setText] = useState(() => drafts.getItem(key) ?? '')
  function keep(next: string) {
    setText(next)
    drafts.setItem(key, next)
  }
  return [text, keep]
}
