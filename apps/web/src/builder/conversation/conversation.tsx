import type { ConversationId } from '@conexus/hub-api'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { keepsAttemptKey, useAttemptKey } from '../../platform/attempt-key.ts'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { PageTitle } from '../../ui/list.tsx'
import { NotFound } from '../../ui/states.tsx'
import { accountsQuery } from '../model-accounts/public.ts'
import { Composer } from './composer.tsx'
import { hasText } from './live.ts'
import { ModelChoice, NoAccount, usableProviders } from './model-choice.tsx'
import { allConversationsQueryKey, conversationQuery, sendMessage, sendStop } from './queries.ts'
import { FAILED, THINKING, titleOf, UNCONFIRMED_SEND } from './text.ts'
import { Transcript } from './transcript.tsx'
import { useLive } from './use-live.ts'

const route = getRouteApi(
  '/_app/companies/$companyId/projects/$projectId/conversations_/$conversationId',
)

/**
 * One conversation: the model, the transcript with the answer arriving, and the field. The stream
 * is ours (security S39: the Hub has no Mastra route), read by `use-live.ts`.
 */
export function Conversation() {
  const { companyId, projectId, conversationId } = route.useParams()
  return <Screen companyId={companyId} projectId={projectId} conversationId={conversationId} />
}

function Screen(props: {
  companyId: Parameters<typeof conversationQuery>[0]
  projectId: Parameters<typeof conversationQuery>[1]
  conversationId: ConversationId
}) {
  const { companyId, projectId, conversationId } = props
  const queryClient = useQueryClient()
  const { conversation } = useSuspenseQuery(
    conversationQuery(companyId, projectId, conversationId),
  ).data
  const accounts = useSuspenseQuery(accountsQuery(companyId)).data
  const usable = usableProviders(accounts)
  const [gone, setGone] = useState(false)
  const [error, setError] = useState<string>()
  const field = useRef<HTMLTextAreaElement>(null)
  const attempt = useAttemptKey()
  const post = useMutation({ ...sendMessage, meta: { keepCache: true } })
  const stop = useMutation({ ...sendStop, meta: { keepCache: true } })
  const params = { companyId, projectId, conversationId }
  const { state, dispatch } = useLive(params, () => {
    void queryClient.invalidateQueries({ queryKey: allConversationsQueryKey(companyId, projectId) })
    setGone(true)
  })

  useEffect(() => field.current?.focus(), [])

  async function send(content: string): Promise<boolean> {
    setError(undefined)
    dispatch({ type: 'sent' })
    try {
      await attempt((attemptKey) => post.mutateAsync({ params, body: { content }, attemptKey }))
    } catch (failure) {
      dispatch({ type: 'unsent' })
      if (failure instanceof HubFailure && failure.code === 'CONVERSATION_NOT_FOUND') setGone(true)
      else setError(keepsAttemptKey(failure) ? UNCONFIRMED_SEND : sentenceOf(failure))
      return false
    }
    void queryClient.invalidateQueries({
      queryKey: conversationQuery(companyId, projectId, conversationId).queryKey,
    })
    return true
  }

  function halt() {
    field.current?.focus()
    stop.mutate({ params })
  }

  if (gone) return <NotFound />
  return (
    <div className="flex w-full max-w-prose flex-col gap-xl">
      <div className="flex flex-col gap-sm">
        <PageTitle className="break-words">{titleOf(conversation)}</PageTitle>
        <Link
          to="/companies/$companyId/projects/$projectId/conversations"
          params={{ companyId, projectId }}
          className="text-label underline"
        >
          Voltar às conversas
        </Link>
      </div>
      {usable.size === 0 ? (
        <NoAccount companyId={companyId} />
      ) : (
        <ModelChoice
          companyId={companyId}
          projectId={projectId}
          conversation={conversation}
          usable={usable}
        />
      )}
      <Transcript messages={conversation.messages} answering={state.parts} />
      {state.parts !== null && !hasText(state.parts) && <p role="status">{THINKING}</p>}
      {state.failed && <p role="alert">{FAILED}</p>}
      {error !== undefined && <p role="alert">{error}</p>}
      <Composer
        answering={state.parts !== null}
        canSend={usable.size > 0}
        field={field}
        onSend={send}
        onStop={halt}
      />
    </div>
  )
}
