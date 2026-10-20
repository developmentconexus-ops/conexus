import type { CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import { HubFailure, sentenceOfCode, writeFailureText } from '../../platform/hub.ts'
import { Empty, NotFound } from '../../ui/states.tsx'
import { accountsQuery } from '../model-accounts/public.ts'
import { Composer } from './composer.tsx'
import type { Item } from './conversation-switch.tsx'
import { ConversationSwitch } from './conversation-switch.tsx'
import type { Live } from './live.ts'
import { hasText, shownAnswer } from './live.ts'
import { ModelChoice, NoAccount } from './model-choice.tsx'
import { allConversationsQueryKey, conversationQuery, sendMessage, sendStop } from './queries.ts'
import { EMPTY_CONVERSATION, THINKING, titleOf, UNCONFIRMED_SEND } from './text.ts'
import { Transcript } from './transcript.tsx'
import { useLive } from './use-live.ts'

const route = getRouteApi(
  '/_app/companies/$companyId/projects/$projectId/conversations/$conversationId',
)

/** The right region of a Projeto: the box of conversations on top, and what it shows below. */
function PanelFrame(props: { current: Item | undefined; children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <ConversationSwitch current={props.current} />
      {props.children}
    </div>
  )
}

/**
 * One conversation of the panel: the model, the transcript with the answer arriving, and the field.
 * The stream is ours (security S39: the Hub has no Mastra route), read by `use-live.ts`. A switch
 * of conversation starts the screen over, and what was typed comes back from its draft.
 */
export function Panel() {
  const { companyId, projectId, conversationId } = route.useParams()
  const { conversation } = useSuspenseQuery(
    conversationQuery(companyId, projectId, conversationId),
  ).data
  return (
    <PanelFrame current={{ value: conversationId, label: titleOf(conversation) }}>
      <Screen
        key={conversationId}
        companyId={companyId}
        projectId={projectId}
        conversationId={conversationId}
      />
    </PanelFrame>
  )
}

/** The panel of a Projeto that has no conversation yet: the box says so and offers a new one. */
export function EmptyPanel() {
  return (
    <PanelFrame current={undefined}>
      <div className="p-md">
        <Empty>Nenhuma conversa</Empty>
      </div>
    </PanelFrame>
  )
}

/** "Pensando…" until the answer has text, and the failure of the turn in the table's words. */
function AnswerStatus({ state }: { state: Live }) {
  if (state.kind === 'idle') return null
  return (
    <>
      {state.kind === 'answering' && !hasText(state.parts) && <p role="status">{THINKING}</p>}
      {state.failure !== null && <p role="alert">{sentenceOfCode(state.failure)}</p>}
    </>
  )
}

function Screen(props: {
  companyId: CompanyId
  projectId: ProjectId
  conversationId: ConversationId
}) {
  const { companyId, projectId, conversationId } = props
  const queryClient = useQueryClient()
  const { conversation } = useSuspenseQuery(
    conversationQuery(companyId, projectId, conversationId),
  ).data
  const accounts = useSuspenseQuery(accountsQuery(companyId)).data
  const usable = new Set(accounts.usableProviders)
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
      else setError(writeFailureText(failure, UNCONFIRMED_SEND))
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
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-xl overflow-y-auto p-md">
        {usable.size === 0 ? (
          <NoAccount companyId={companyId} />
        ) : (
          <ModelChoice ids={params} conversation={conversation} usable={usable} />
        )}
        {conversation.messages.length === 0 && state.kind === 'idle' && (
          <Empty>{EMPTY_CONVERSATION}</Empty>
        )}
        <Transcript
          messages={conversation.messages}
          answer={shownAnswer(state, conversation.messages)}
        />
        <AnswerStatus state={state} />
        {error !== undefined && <p role="alert">{error}</p>}
      </div>
      <div className="px-md">
        <Composer
          answering={state.kind === 'answering'}
          canSend={usable.size > 0}
          conversationId={conversationId}
          field={field}
          onSend={send}
          onStop={halt}
        />
      </div>
    </>
  )
}
