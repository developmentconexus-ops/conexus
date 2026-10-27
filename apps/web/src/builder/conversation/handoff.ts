import type { ConversationId } from '@conexus/hub-api'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { pageStorage } from '../../platform/storage.ts'
import type { MessageFile, Outgoing } from './attachments.ts'

/** The refusals of the model a new conversation would meet again: Início opens the Projeto with them. */
export const MODEL_REFUSALS = ['MODEL_NO_ACCOUNT', 'MODEL_UNKNOWN', 'EFFORT_UNSUPPORTED'] as const
export type ModelRefusal = (typeof MODEL_REFUSALS)[number]

const mirror = pageStorage('session')
/**
 * Files cross in the page's memory, not in history state: up to 28 MiB of data URLs (`LIMITS.total`)
 * exceed what a browser keeps in history (Factory `handoffFiles.ts`).
 */
const files = new Map<ConversationId, readonly MessageFile[]>()

function keyOf(conversationId: ConversationId) {
  return `conexus-handoff:${conversationId}`
}

export function stashHandoffFiles(conversationId: ConversationId, stashed: readonly MessageFile[]) {
  if (stashed.length > 0) files.set(conversationId, stashed)
  else files.delete(conversationId)
}

function takeHandoffFiles(conversationId: ConversationId): readonly MessageFile[] {
  const taken = files.get(conversationId) ?? []
  files.delete(conversationId)
  return taken
}

/**
 * On the conversation's screen: sends the request Início handed over, once, or after a reload in the
 * middle of that send gives its words back to the box. It never sends again by itself: Mastra may
 * have taken the message already (Factory `useHandoffPrompt.ts`). The two refs outlive the effect's
 * second run in strict mode.
 */
export function useHandoff(
  conversationId: ConversationId,
  on: { send: (outgoing: Outgoing) => Promise<boolean>; recover: (text: string) => void },
): void {
  const navigate = useNavigate()
  const handoff = useLocation({ select: (location) => location.state.handoff })
  const handedOff = useRef(false)
  const recovered = useRef(false)

  useEffect(() => {
    if (handedOff.current) return
    if (handoff === undefined) {
      if (recovered.current) return
      recovered.current = true
      const interrupted = mirror.getItem(keyOf(conversationId))
      if (interrupted === null) return
      mirror.removeItem(keyOf(conversationId))
      on.recover(interrupted)
      return
    }
    handedOff.current = true
    const outgoing = { content: handoff.content, files: takeHandoffFiles(conversationId) }
    mirror.setItem(keyOf(conversationId), outgoing.content)
    void navigate({ to: '.', search: (search) => search, replace: true, state: {} })
    // Kept unless the send is confirmed: a reload aborts it on its way out (Factory `useHandoffPrompt.ts`).
    void on.send(outgoing).then((sent) => sent && mirror.removeItem(keyOf(conversationId)))
  }, [conversationId, handoff, navigate, on])
}
