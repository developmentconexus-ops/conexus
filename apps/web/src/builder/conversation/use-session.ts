import type { CompanyId, ConversationId } from '@conexus/hub-api'
import { BUILDER_CONTROLLER, PreviewData } from '@conexus/hub-api'
import type { AgentControllerEvent, KnownAgentControllerEvent } from '@mastra/client-js'
import { isKnownAgentControllerEvent, MastraClientError } from '@mastra/client-js'
import type { QueryClient } from '@tanstack/react-query'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useEffectEvent, useMemo, useReducer, useState } from 'react'
import { failureOfProblem } from '../../platform/hub.ts'
import { previewChanged } from '../preview/public.ts'
import { sourceChanged } from '../source/public.ts'
import type { SessionRead } from './queries.ts'
import { sessionReadQuery } from './queries.ts'
import type { BuilderSession, Place } from './session.ts'
import { sessionOf } from './session.ts'
import type { Action } from './session-state.ts'
import { OPENED, session } from './session-state.ts'

type Ids = { companyId: CompanyId; conversationId: ConversationId } & Place

const FIRST_RETRY_MS = 1000
const LAST_RETRY_MS = 15_000

/** The messages a read brings, and the step by which reaching the top widens it (Factory `INITIAL_THREAD_MESSAGE_LIMIT`). */
const TRANSCRIPT_PAGE = 100

/** The transcript Mastra's route serves: the server does not replay what the stream missed. */
function transcriptKey(conversationId: ConversationId) {
  return ['builder', 'transcript', conversationId] as const
}

type Hooks = {
  queryClient: QueryClient
  ids: Ids
  builder: BuilderSession
  dispatch: (action: Action) => void
  onGone: () => void
  onEnded: () => void
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(done, ms)
    signal.addEventListener('abort', done, { once: true })
    function done() {
      clearTimeout(timer)
      resolve()
    }
  })
}

/** The transcript read again, as the Factory UI does after a gap (`useAgentControllerConnection.ts`). */
function reread(hooks: Hooks): void {
  void hooks.queryClient.invalidateQueries({ queryKey: transcriptKey(hooks.ids.conversationId) })
}

/**
 * The session state's tasks: the event is written into the read, as the Factory UI does
 * (`useAgentControllerConnection.ts:127-157`, Mastra 1.78). A read in flight that predates it is
 * cancelled first, as TanStack Query's optimistic-updates guide does (`cancelQueries`, then `setQueryData`).
 */
function tasksHeard(hooks: Hooks, tasks: SessionRead['tasks']): void {
  const { queryClient, ids } = hooks
  const { queryKey } = sessionReadQuery(ids.conversationId, ids.controller)
  void queryClient.cancelQueries({ queryKey }).then(() => {
    queryClient.setQueryData<SessionRead>(queryKey, (read) => read && { ...read, tasks })
  })
}

/** A reconnect: events sent while the stream was down are gone, so the session state is read again (`:106-118`). */
function resync(hooks: Hooks): void {
  reread(hooks)
  void hooks.queryClient.invalidateQueries({
    queryKey: sessionReadQuery(hooks.ids.conversationId, hooks.ids.controller).queryKey,
  })
}

/** A version the run saved changes the Projeto's files: their reads are asked again. */
function savesVersion(event: KnownAgentControllerEvent): boolean {
  return (
    event.type === 'message_start' &&
    event.message.content.parts.some((part) => part.type === 'data-conexus-version')
  )
}

/** The run put its version on the app: the Prévia loads it. */
function readiesPreview(event: KnownAgentControllerEvent): boolean {
  return (
    event.type === 'message_start' &&
    event.message.content.parts.some(
      (part) =>
        part.type === 'data-conexus-preview' &&
        PreviewData.safeParse(part.data).data?.state === 'ready',
    )
  )
}

function heard(hooks: Hooks, event: AgentControllerEvent): void {
  if (!isKnownAgentControllerEvent(event)) return
  hooks.dispatch({ type: 'event', event })
  if (event.type === 'task_updated') tasksHeard(hooks, event.tasks)
  const { ids, queryClient } = hooks
  // Only the Builder's runs change a Projeto's files and Prévia.
  if (ids.controller === BUILDER_CONTROLLER) {
    const { companyId, projectId } = ids
    if (savesVersion(event)) void sourceChanged(queryClient, { companyId, projectId })
    if (readiesPreview(event)) void previewChanged(queryClient, { companyId, projectId })
  }
  // Mastra saves an errored run's messages a moment after its end: the read catches them up.
  if (event.type === 'agent_end') reread(hooks)
}

/** A refusal that ends the following: the conversation gone, or the person's session ended. */
async function refused(hooks: Hooks, error: unknown): Promise<boolean> {
  const failure = error instanceof MastraClientError ? failureOfProblem(error.body) : undefined
  if (failure?.code === 'CONVERSATION_NOT_FOUND') {
    hooks.onGone()
    return true
  }
  if (failure?.code !== 'SESSION_REQUIRED') return false
  hooks.onEnded()
  return true
}

/**
 * Follows the session's stream until the screen leaves, as the Factory UI does
 * (`useAgentControllerConnection.ts`): Mastra's client opens it again after a drop, and each open
 * reads the transcript again. Opening it is retried here, after a pause, except for a conversation
 * gone or a session ended; Mastra's client says the same refusals of a reopening to `onError`.
 */
async function follow(hooks: Hooks, signal: AbortSignal): Promise<void> {
  // React mounts a screen twice in development: the first is let go before this turn ends.
  await Promise.resolve()
  let pause = FIRST_RETRY_MS
  while (!signal.aborted) {
    try {
      const subscription = await hooks.builder.session.subscribe({
        onEvent: (event) => heard(hooks, event),
        reconnect: true,
        onReconnect: () => resync(hooks),
        onError: (error) => void refused(hooks, error),
      })
      if (signal.aborted) return subscription.unsubscribe()
      signal.addEventListener('abort', () => subscription.unsubscribe(), { once: true })
      reread(hooks)
      return
    } catch (error) {
      if (signal.aborted || (await refused(hooks, error))) return
    }
    await sleep(pause, signal)
    pause = Math.min(pause * 2, LAST_RETRY_MS)
  }
}

/** The conversation's session: its state from Mastra's stream and its transcript, and its calls. */
export function useSession(
  ids: Ids,
  on: {
    /** The conversation is gone: the Hub says it does not exist. */
    gone: () => void
    /** The person's session ended: the caller reads again what it keeps of the conversation. */
    ended: () => void
  },
) {
  const queryClient = useQueryClient()
  const [state, dispatch] = useReducer(session, OPENED)
  const gone = useEffectEvent(on.gone)
  const ended = useEffectEvent(on.ended)
  const { conversationId, controller } = ids
  const builder = useMemo(() => sessionOf(conversationId, controller), [conversationId, controller])
  // The window of messages read grows by a page for each load of older messages; `Screen` remounts
  // with the conversation, so each conversation opens on the newest page.
  const [limit, setLimit] = useState(TRANSCRIPT_PAGE)
  const transcript = useQuery({
    queryKey: [...transcriptKey(conversationId), limit],
    queryFn: () => builder.read(limit),
    // The stream does not replay a gap: coming back to the tab does not read the window again
    // (Factory `refetchOnWindowFocus: false`); the stream's own reconnect does.
    refetchOnWindowFocus: false,
    // Widening the window keeps the messages on screen while the larger read arrives.
    placeholderData: keepPreviousData,
  })
  const older = {
    // A full window means older messages may exist (Factory `hasMore`); while a wider read is in
    // flight the window on screen is the narrower one, which is not full, so nothing more is asked.
    has: transcript.isSuccess && transcript.data.length >= limit,
    loading: transcript.isPlaceholderData,
    load: useCallback(() => setLimit((was) => was + TRANSCRIPT_PAGE), []),
  }
  useEffect(() => {
    if (transcript.data !== undefined) dispatch({ type: 'loaded', messages: transcript.data })
  }, [transcript.data])
  // `builder` is the conversation's identity (its id and its controller): the follow starts over
  // with it, and reads `ids` as the render that starts it has them.
  const currentIds = useEffectEvent(() => ids)
  useEffect(() => {
    const stop = new AbortController()
    const hooks = {
      queryClient,
      ids: currentIds(),
      builder,
      dispatch,
      onGone: gone,
      onEnded: ended,
    }
    void follow(hooks, stop.signal)
    return () => stop.abort()
  }, [queryClient, builder])
  return { state, dispatch, builder, older }
}
