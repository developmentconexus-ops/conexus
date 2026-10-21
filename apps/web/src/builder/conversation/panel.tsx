import type { CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { ReactNode, RefObject } from 'react'
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

export function EmptyPanel() {
  return (
    <PanelFrame current={undefined}>
      <div className="p-md">
        <Empty>Nenhuma conversa</Empty>
      </div>
    </PanelFrame>
  )
}

type Params = { companyId: CompanyId; projectId: ProjectId; conversationId: ConversationId }

function useSending(
  params: Params,
  field: RefObject<HTMLTextAreaElement | null>,
  dispatch: (action: { type: 'sent' | 'unsent' }) => void,
  onGone: () => void,
) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string>()
  const attempt = useAttemptKey()
  const post = useMutation({ ...sendMessage, meta: { keepCache: true } })
  const stop = useMutation({ ...sendStop, meta: { keepCache: true } })

  async function send(content: string): Promise<boolean> {
    setError(undefined)
    dispatch({ type: 'sent' })
    try {
      await attempt((attemptKey) => post.mutateAsync({ params, body: { content }, attemptKey }))
    } catch (failure) {
      dispatch({ type: 'unsent' })
      if (failure instanceof HubFailure && failure.code === 'CONVERSATION_NOT_FOUND') onGone()
      else setError(writeFailureText(failure, UNCONFIRMED_SEND))
      return false
    }
    void queryClient.invalidateQueries({
      queryKey: conversationQuery(params.companyId, params.projectId, params.conversationId)
        .queryKey,
    })
    return true
  }

  function halt() {
    field.current?.focus()
    stop.mutate({ params })
  }

  return { error, setError, send, halt }
}

function Screen(params: Params) {
  const { companyId, projectId, conversationId } = params
  const queryClient = useQueryClient()
  const { conversation } = useSuspenseQuery(
    conversationQuery(companyId, projectId, conversationId),
  ).data
  const accounts = useSuspenseQuery(accountsQuery(companyId)).data
  const usable = useMemo(() => new Set(accounts.usableProviders), [accounts.usableProviders])
  const canAnswer = usable.size > 0
  const [gone, setGone] = useState(false)
  const field = useRef<HTMLTextAreaElement>(null)
  const { state, dispatch } = useLive(params, () => {
    void queryClient.invalidateQueries({ queryKey: allConversationsQueryKey(companyId, projectId) })
    setGone(true)
  })
  const { error, setError, send, halt } = useSending(params, field, dispatch, () => setGone(true))

  useEffect(() => field.current?.focus(), [])

  if (gone) return <NotFound />
  const empty = conversation.messages.length === 0 && state.kind === 'idle'
  const notice = !canAnswer || empty
  return (
    <>
      {notice && (
        <div className="flex flex-col gap-md px-md py-md">
          {!canAnswer && <NoAccount companyId={companyId} />}
          {empty && <Empty>{EMPTY_CONVERSATION}</Empty>}
        </div>
      )}
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
        <WorkingLine startedAt={state.startedAt} heard={state.parts} />
      )}
      <div className="px-md">
        <Composer
          answering={state.kind === 'answering'}
          canSend={canAnswer}
          conversationId={conversationId}
          field={field}
          onSend={send}
          onStop={halt}
          picker={
            canAnswer && (
              <ModelChoice
                ids={params}
                conversation={conversation}
                providers={accounts.choices.mine}
                onError={setError}
              />
            )
          }
        />
      </div>
    </>
  )
}
