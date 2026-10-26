import type { ConversationId } from '@conexus/hub-api'
import { useState } from 'react'
import { pageStorage } from '../../platform/storage.ts'
import type { MessageFile, Outgoing } from './attachments.ts'

const texts = pageStorage('session')
/** Files stay in the page's memory: storage holds ~5 MB, and a reload drops them, as in Factory. */
const files = new Map<ConversationId, readonly MessageFile[]>()

const NONE: readonly MessageFile[] = []

function keyOf(conversationId: ConversationId) {
  return `conexus-draft:${conversationId}`
}

function heldOf(conversationId: ConversationId): Outgoing {
  return {
    content: texts.getItem(keyOf(conversationId)) ?? '',
    files: files.get(conversationId) ?? NONE,
  }
}

/**
 * The unsent text and files of a conversation, kept for this browser tab so a switch of
 * conversation loses nothing. A send takes them out at its start, so the message sent never comes
 * back to the box after a switch (#167), and a refused send gives them back.
 */
export function useDraft(conversationId: ConversationId) {
  const [held, setHeld] = useState(() => ({ conversationId, ...heldOf(conversationId) }))
  const now =
    held.conversationId === conversationId ? held : { conversationId, ...heldOf(conversationId) }

  // Written at once and not by an effect: a send can end after the composer unmounted.
  function hold(next: Outgoing) {
    texts.setItem(keyOf(conversationId), next.content)
    files.set(conversationId, next.files)
    setHeld({ conversationId, ...next })
  }

  return {
    text: now.content,
    files: now.files,
    change: (text: string) => hold({ content: text, files: heldOf(conversationId).files }),
    /** Evaluated on the draft as it is when written: a file's read can end after the box changed. */
    setFiles: (update: (files: readonly MessageFile[]) => readonly MessageFile[]) => {
      const box = heldOf(conversationId)
      hold({ content: box.content, files: update(box.files) })
    },
    take: (): Outgoing => {
      const taken = heldOf(conversationId)
      hold({ content: '', files: NONE })
      return taken
    },
    restore: (outgoing: Outgoing) => {
      const box = heldOf(conversationId)
      if (box.content === '' && box.files.length === 0) hold(outgoing)
    },
  }
}

export type Draft = ReturnType<typeof useDraft>
