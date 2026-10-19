import type {
  CompanyId,
  ConversationEvent,
  ConversationId,
  ProjectId,
  readConversation,
} from '@conexus/hub-api'
import { CONVERSATION_HEARTBEAT_MS, streamConversation } from '@conexus/hub-api'
import type { QueryClient } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useEffectEvent, useReducer } from 'react'
import type { z } from 'zod'
import { HubFailure, hubEvents } from '../../platform/hub.ts'
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

/** The conversation read again, which shows what the stream cannot (the Builder's finished message). */
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
  // The answer leaves the stream's state only once the read holds it: never a gap, never both.
  if (event.type === 'turnEnd') await reread(hooks).catch(() => undefined)
  hooks.dispatch(event)
}

async function readOnce(hooks: Hooks, signal: AbortSignal, onEvent: () => void): Promise<void> {
  const stalled = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  function watch() {
    clearTimeout(timer)
    timer = setTimeout(() => stalled.abort(), STALL_MS)
  }
  watch()
  try {
    const events = hubEvents(streamConversation, hooks.ids, {
      signal: AbortSignal.any([signal, stalled.signal]),
      onActivity: watch,
    })
    for await (const event of events) {
      onEvent()
      await handle(event, hooks)
    }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Follows the conversation's stream until the screen leaves: a line that ends, breaks or goes quiet
 * is opened again after a pause, and the conversation is read again first, so the answer in
 * progress comes back with the stream's `turn` and what finished meanwhile with the read.
 */
async function follow(hooks: Hooks, signal: AbortSignal): Promise<void> {
  let pause = FIRST_RETRY_MS
  let again = false
  while (!signal.aborted) {
    try {
      if (again) await reread(hooks)
      again = true
      await readOnce(hooks, signal, () => {
        pause = FIRST_RETRY_MS
      })
    } catch (error) {
      if (signal.aborted) return
      if (error instanceof HubFailure && error.code === 'CONVERSATION_NOT_FOUND') {
        hooks.onGone()
        return
      }
      // A 401 shows in the read, whose failure the cache turns into the end of the session.
      if (error instanceof HubFailure && error.code === 'SESSION_REQUIRED') {
        await reread(hooks).catch(() => undefined)
        return
      }
    }
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
