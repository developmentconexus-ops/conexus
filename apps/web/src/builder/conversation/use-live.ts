import type {
  CompanyId,
  ConversationEvent,
  ConversationId,
  EventId,
  ProjectId,
  readConversation,
} from '@conexus/hub-api'
import { CONVERSATION_HEARTBEAT_MS, streamConversation } from '@conexus/hub-api'
import type { QueryClient } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useEffectEvent, useReducer } from 'react'
import type { z } from 'zod'
import { HubFailure, hubEvents } from '../../platform/hub.ts'
import { sourceChanged } from '../source/public.ts'
import type { Step } from './live.ts'
import { IDLE, live } from './live.ts'
import { allConversationsQueryKey, conversationQuery } from './queries.ts'

type Ids = { companyId: CompanyId; projectId: ProjectId; conversationId: ConversationId }
type Read = z.output<typeof readConversation.success.body>

/** Two missed heartbeats and a margin: a line quieter than this is dead, and is opened again. */
const STALL_MS = 2 * CONVERSATION_HEARTBEAT_MS + 5000
const FIRST_RETRY_MS = 1000
const LAST_RETRY_MS = 15_000

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

type Hooks = {
  queryClient: QueryClient
  ids: Ids
  dispatch: (step: Step) => void
  onGone: () => void
}

/** The conversation read again, which shows what the stream cannot (the Builder's saved message). */
function reread(hooks: Hooks): Promise<unknown> {
  const { companyId, projectId, conversationId } = hooks.ids
  return hooks.queryClient.fetchQuery({
    ...conversationQuery(companyId, projectId, conversationId),
    staleTime: 0,
  })
}

async function handle(event: ConversationEvent, hooks: Hooks): Promise<void> {
  const { companyId, projectId, conversationId } = hooks.ids
  if (event.type === 'title') {
    const key = conversationQuery(companyId, projectId, conversationId).queryKey
    hooks.queryClient.setQueryData<Read>(key, (old) =>
      old === undefined ? old : { conversation: { ...old.conversation, title: event.title } },
    )
    await hooks.queryClient.invalidateQueries({
      queryKey: allConversationsQueryKey(companyId, projectId),
    })
  }
  if (event.type === 'part' && event.part.type === 'version') {
    await sourceChanged(hooks.queryClient, { companyId, projectId })
  }
  // The ended answer stays on screen until the read holds it (`shownAnswer`), so it shows once.
  if (event.type === 'turnEnd') await reread(hooks)
  hooks.dispatch(event)
}

/**
 * One line of the stream. A line opened again sends the id of the last event read, then reads the
 * conversation: the read holds what finished in the gap, and the stream tells what the answer in
 * progress missed, or the whole answer again in its `turn`.
 */
async function readOnce(
  hooks: Hooks,
  options: {
    signal: AbortSignal
    again: boolean
    lastEventId: EventId | undefined
    onEvent: (id: EventId) => void
  },
): Promise<void> {
  const stalled = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  function watch() {
    clearTimeout(timer)
    timer = setTimeout(() => stalled.abort(), STALL_MS)
  }
  async function opened() {
    if (!options.again) return
    await reread(hooks)
    hooks.dispatch({ type: 'reconnected' })
  }
  watch()
  try {
    const events = hubEvents(streamConversation, hooks.ids, {
      signal: AbortSignal.any([options.signal, stalled.signal]),
      onActivity: watch,
      opened,
      ...(options.lastEventId === undefined ? {} : { lastEventId: options.lastEventId }),
    })
    for await (const { id, event } of events) {
      options.onEvent(id)
      await handle(event, hooks)
    }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Follows the conversation's stream until the screen leaves: a line that ends, breaks or goes quiet
 * is opened again after a pause. Every Hub failure is retried, except a conversation gone or a
 * session ended; anything else is a defect of the screen and is thrown.
 */
async function follow(hooks: Hooks, signal: AbortSignal): Promise<void> {
  let pause = FIRST_RETRY_MS
  let again = false
  let lastEventId: EventId | undefined
  while (!signal.aborted) {
    try {
      await readOnce(hooks, {
        signal,
        again,
        lastEventId,
        onEvent: (id) => {
          pause = FIRST_RETRY_MS
          lastEventId = id
        },
      })
    } catch (error) {
      if (signal.aborted) return
      if (!(error instanceof HubFailure)) throw error
      if (error.code === 'CONVERSATION_NOT_FOUND') {
        hooks.onGone()
        return
      }
      // A 401 shows in the read, whose failure the cache turns into the end of the session.
      if (error.code === 'SESSION_REQUIRED') {
        const { companyId, projectId, conversationId } = hooks.ids
        await hooks.queryClient.invalidateQueries({
          queryKey: conversationQuery(companyId, projectId, conversationId).queryKey,
        })
        return
      }
    }
    again = true
    await sleep(pause, signal)
    pause = Math.min(pause * 2, LAST_RETRY_MS)
  }
}

/** The answer in progress of a conversation, from its stream, and the way to say one was sent. */
export function useLive(ids: Ids, onGone: () => void) {
  const queryClient = useQueryClient()
  const [state, dispatch] = useReducer(live, IDLE)
  const gone = useEffectEvent(onGone)
  const { companyId, projectId, conversationId } = ids
  useEffect(() => {
    const controller = new AbortController()
    const hooks = {
      queryClient,
      ids: { companyId, projectId, conversationId },
      dispatch,
      onGone: gone,
    }
    void follow(hooks, controller.signal)
    return () => controller.abort()
  }, [queryClient, companyId, projectId, conversationId])
  return { state, dispatch }
}
