import type { ConversationId } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import type { HistoryState } from '@tanstack/react-router'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { useEffect, useEffectEvent, useRef } from 'react'
import { writeFailureText } from '../../platform/hub.ts'
import { pageStorage } from '../../platform/storage.ts'
import type { MessageFile, Outgoing } from './attachments.ts'
import { sendAssistantHandOff } from './queries.ts'
import { HANDOFF_UNCONFIRMED } from './text.ts'

/** The refusals of the model a new conversation would meet again: Início opens the Projeto with them. */
const MODEL_REFUSALS = ['MODEL_NO_ACCOUNT', 'MODEL_UNKNOWN', 'EFFORT_UNSUPPORTED'] as const
export type ModelRefusal = (typeof MODEL_REFUSALS)[number]

export function isModelRefusal(code: string): code is ModelRefusal {
  return MODEL_REFUSALS.some((one) => one === code)
}

const mirror = pageStorage('session')
/**
 * Files cross in the page's memory, not in history state: up to 28 MiB of data URLs (`LIMITS.total`)
 * exceed what a browser keeps in history (Factory `handoffFiles.ts`).
 */
const files = new Map<ConversationId, readonly MessageFile[]>()

/** Set as the page leaves, before the browser cuts the send in flight: that cut is no answer. */
let leaving = false
addEventListener('pagehide', () => {
  leaving = true
})
addEventListener('pageshow', () => {
  leaving = false
})

/** The request handed over in a navigation's state, only when it is addressed to this conversation. */
export function handoffTo(state: HistoryState, conversationId: string | undefined) {
  const { handoff } = state
  return handoff !== undefined && handoff.conversationId === conversationId ? handoff : undefined
}

function keyOf(conversationId: ConversationId) {
  return `conexus-handoff:${conversationId}`
}

/** Whether a reload cut the conversation's send short, leaving a request to give back. */
export function hasInterruptedHandoff(conversationId: ConversationId) {
  return mirror.getItem(keyOf(conversationId)) !== null
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
  on: { send: (outgoing: Outgoing) => Promise<void>; recover: (text: string) => void },
): void {
  const navigate = useNavigate()
  const handoff = useLocation({ select: (location) => handoffTo(location.state, conversationId) })
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
    // Kept only while the send has no answer: a reload aborts it on its way out. A refusal already
    // gave the words back to the box, so the copy protects nothing (card, failure table).
    void on.send(outgoing).then(() => {
      if (!leaving) mirror.removeItem(keyOf(conversationId))
    })
  }, [conversationId, handoff, navigate, on])
}

/** The touch's request to the hand-off route, as the card made it, for the conversation to repeat. */
export type AssistantHandOff = {
  conversationId: ConversationId
  request: Parameters<typeof sendAssistantHandOff.mutationFn>[0]
}

/** The Assistant's proposal a touch opened this conversation for, only when addressed to it. */
export function assistantHandOffTo(state: HistoryState, conversationId: string | undefined) {
  const handOff = state.assistantHandOff
  return handOff !== undefined && handOff.conversationId === conversationId ? handOff : undefined
}

/**
 * On the Builder's conversation a touch of **Criar app** or **Mandar ao Builder** opened (step
 * 24.3.2): once the screen follows the stream, asks the Hub to send the proposal, with the touch's
 * key. Mastra tells the signal only to those subscribed when it arrives and stores it with the run's
 * first step, so the screen subscribes before the send (Mastra's "subscribe before sending",
 * Factory `useHandoffPrompt`). The state leaves the history before the ask: a reload asks nothing,
 * and the card's next touch opens the conversation to ask again.
 */
export function useAssistantHandOff(
  conversationId: ConversationId,
  following: boolean,
  failed: (text: string) => void,
): void {
  const navigate = useNavigate()
  const handOff = useLocation({
    select: (location) => assistantHandOffTo(location.state, conversationId),
  })
  const { mutateAsync } = useMutation(sendAssistantHandOff)
  const asked = useRef(false)
  const refused = useEffectEvent(failed)

  useEffect(() => {
    if (!following || handOff === undefined || asked.current) return
    asked.current = true
    void navigate({ to: '.', search: (search) => search, replace: true, state: {} })
    const { request } = handOff
    mutateAsync({ ...request, body: { ...request.body, deliver: true } }).catch(
      (failure: unknown) => refused(writeFailureText(failure, HANDOFF_UNCONFIRMED)),
    )
  }, [following, handOff, mutateAsync, navigate])
}
