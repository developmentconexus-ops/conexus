import type { CompanyId, ConversationId } from '@conexus/hub-api'
import { useState } from 'react'
import { pageStorage } from '../../platform/storage.ts'
import type { MessageFile, Outgoing } from './attachments.ts'

/** Storage only mirrors the text: where the browser refuses it, the draft still holds. */
const mirror = pageStorage('session')
/** A conversation's draft, or the one of a company's Início. */
export type DraftKey = ConversationId | `start:${CompanyId}`

const texts = new Map<DraftKey, string>()
/** Files stay in the page's memory: storage holds ~5 MB, and a reload drops them, as in Factory. */
const files = new Map<DraftKey, readonly MessageFile[]>()

const NONE: readonly MessageFile[] = []

function keyOf(key: DraftKey) {
  return `conexus-draft:${key}`
}

function heldOf(key: DraftKey): Outgoing {
  return {
    content: texts.get(key) ?? mirror.getItem(keyOf(key)) ?? '',
    files: files.get(key) ?? NONE,
  }
}

/**
 * The unsent text and files of a conversation, or of Início's box, kept for this browser tab so a
 * switch of conversation or a visit elsewhere loses nothing. A send takes them out at its start, so the message sent never comes
 * back to the box after a switch (#167), and a refused send gives them back.
 */
export function useDraft(key: DraftKey) {
  const [held, setHeld] = useState(() => ({ key, ...heldOf(key) }))
  const now = held.key === key ? held : { key, ...heldOf(key) }

  // Written at once and not by an effect: a send can end after the composer unmounted.
  function hold(next: Outgoing) {
    texts.set(key, next.content)
    mirror.setItem(keyOf(key), next.content)
    files.set(key, next.files)
    setHeld({ key, ...next })
  }

  return {
    text: now.content,
    files: now.files,
    change: (text: string) => hold({ content: text, files: heldOf(key).files }),
    /** Adds a line to the text, once: a line already in the box is not repeated. */
    append: (line: string) => {
      const box = heldOf(key)
      if (box.content.includes(line)) return
      hold({ content: box.content === '' ? line : `${box.content}\n${line}`, files: box.files })
    },
    /** Evaluated on the draft as it is when written: a file's read can end after the box changed. */
    setFiles: (update: (files: readonly MessageFile[]) => readonly MessageFile[]) => {
      const box = heldOf(key)
      hold({ content: box.content, files: update(box.files) })
    },
    take: (): Outgoing => {
      const taken = heldOf(key)
      hold({ content: '', files: NONE })
      return taken
    },
    restore: (outgoing: Outgoing) => {
      const box = heldOf(key)
      if (box.content === '' && box.files.length === 0) hold(outgoing)
    },
  }
}

export type Draft = ReturnType<typeof useDraft>
