import type { CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import { PreviewData } from '@conexus/hub-api'
import type { AgentControllerEvent, KnownAgentControllerEvent } from '@mastra/client-js'
import { isKnownAgentControllerEvent, MastraClientError } from '@mastra/client-js'
import type { QueryClient } from '@tanstack/react-query'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useEffectEvent, useMemo, useReducer } from 'react'
import { failureOfProblem } from '../../platform/hub.ts'
import { previewChanged } from '../preview/public.ts'
import { sourceChanged } from '../source/public.ts'
import type { SessionRead } from './queries.ts'
import { conversationQuery, sessionReadQuery } from './queries.ts'
import type { BuilderSession } from './session.ts'
import { sessionOf } from './session.ts'
import type { Action } from './session-state.ts'
import { OPENED, session } from './session-state.ts'

type Ids = { companyId: CompanyId; projectId: ProjectId; conversationId: ConversationId }

const FIRST_RETRY_MS = 1000
const LAST_RETRY_MS = 15_000

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
 * The session state's tasks, as the Factory UI keeps them (`useAgentControllerConnection.ts:127-157`):
 * the event is written into the read, and a read in flight that predates it is let go.
 */
function tasksHeard(hooks: Hooks, tasks: SessionRead['tasks']): void {
  const { queryClient, ids } = hooks
  const { queryKey } = sessionReadQuery(ids.conversationId)
  void queryClient.cancelQueries({ queryKey }).then(() => {
    queryClient.setQueryData<SessionRead>(queryKey, (read) => read && { ...read, tasks })
  })
}

/** A reconnect: events sent while the stream was down are gone, so the session state is read again (`:106-118`). */
function resync(hooks: Hooks): void {
  reread(hooks)
  void hooks.queryClient.invalidateQueries({
    queryKey: sessionReadQuery(hooks.ids.conversationId).queryKey,
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
  const { companyId, projectId } = hooks.ids
  if (savesVersion(event)) void sourceChanged(hooks.queryClient, { companyId, projectId })
  if (readiesPreview(event)) void previewChanged(hooks.queryClient, { companyId, projectId })
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
  const { companyId, projectId, conversationId } = hooks.ids
  await hooks.queryClient.invalidateQueries({
    queryKey: conversationQuery(companyId, projectId, conversationId).queryKey,
  })
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
export function useSession(ids: Ids, onGone: () => void) {
  const queryClient = useQueryClient()
  const [state, dispatch] = useReducer(session, OPENED)
  const gone = useEffectEvent(onGone)
  const { companyId, projectId, conversationId } = ids
  const builder = useMemo(() => sessionOf(conversationId), [conversationId])
  const transcript = useQuery({ queryKey: transcriptKey(conversationId), queryFn: builder.read })
  useEffect(() => {
    if (transcript.data !== undefined) dispatch({ type: 'loaded', messages: transcript.data })
  }, [transcript.data])
  useEffect(() => {
    const controller = new AbortController()
    const hooks = {
      queryClient,
      ids: { companyId, projectId, conversationId },
      builder,
      dispatch,
      onGone: gone,
    }
    void follow(hooks, controller.signal)
    return () => controller.abort()
  }, [queryClient, companyId, projectId, conversationId, builder])
  return { state, dispatch, builder }
}
