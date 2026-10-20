import type { CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import { HubFailure, writeFailureText } from '../../platform/hub.ts'
import { Empty, NotFound } from '../../ui/states.tsx'
import { accountsQuery } from '../model-accounts/public.ts'
import { Composer } from './composer.tsx'
import type { Item } from './conversation-switch.tsx'
import { ConversationSwitch } from './conversation-switch.tsx'
import { shownAnswer } from './live.ts'
import { ModelChoice, NoAccount } from './model-choice.tsx'
import { allConversationsQueryKey, conversationQuery, sendMessage, sendStop } from './queries.ts'
import { EMPTY_CONVERSATION, titleOf, UNCONFIRMED_SEND } from './text.ts'
import { Transcript } from './transcript.tsx'
import { useLive } from './use-live.ts'
import { WorkingLine } from './working-line.tsx'

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
  const usable = useMemo(() => new Set(accounts.usableProviders), [accounts.usableProviders])
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
      <div className="flex flex-col gap-md px-md py-md">
        {usable.size === 0 && <NoAccount companyId={companyId} />}
        {conversation.messages.length === 0 && state.kind === 'idle' && (
          <Empty>{EMPTY_CONVERSATION}</Empty>
        )}
      </div>
      <div className="min-h-0 flex-1">
        <Transcript
          messages={conversation.messages}
          answer={shownAnswer(state, conversation.messages)}
          model={conversation.model}
        />
      </div>
      {error !== undefined && (
        <p role="alert" className="px-md">
          {error}
        </p>
      )}
      {(state.kind === 'answering' || state.kind === 'resuming') && (
        <WorkingLine startedAt={state.startedAt} />
      )}
      <div className="px-md">
        <Composer
          answering={state.kind === 'answering'}
          canSend={usable.size > 0}
          conversationId={conversationId}
          field={field}
          onSend={send}
          onStop={halt}
          picker={
            usable.size > 0 && (
              <ModelChoice
                ids={params}
                conversation={conversation}
                usable={usable}
                onError={setError}
              />
            )
          }
        />
      </div>
    </>
  )
}
