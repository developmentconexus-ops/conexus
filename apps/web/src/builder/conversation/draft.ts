import type { ConversationId } from '@conexus/hub-api'
import { useEffect, useState } from 'react'
import { pageStorage } from '../../platform/storage.ts'

const drafts = pageStorage('session')

function keyOf(conversationId: ConversationId) {
  return `conexus-draft:${conversationId}`
}

/**
 * The unsent text of a conversation, kept for this browser tab so a switch of conversation loses
 * nothing. `clear` empties it only when it still holds `sent`, the text a send took.
 */
export function useDraft(conversationId: ConversationId) {
  const key = keyOf(conversationId)
  const [held, setHeld] = useState({ key, text: drafts.getItem(key) ?? '' })
  const text = held.key === key ? held.text : (drafts.getItem(key) ?? '')
  useEffect(() => drafts.setItem(key, text), [key, text])
  return {
    text,
    change: (next: string) => setHeld({ key, text: next }),
    clear: (sent: string) => {
      // Storage is written here too: a send can end after the composer unmounted, and the effect
      // above no longer runs then.
      if (drafts.getItem(key) === sent) drafts.setItem(key, '')
      setHeld((now) => (now.key === key && now.text === sent ? { key, text: '' } : now))
    },
  }
}

export type Draft = ReturnType<typeof useDraft>
