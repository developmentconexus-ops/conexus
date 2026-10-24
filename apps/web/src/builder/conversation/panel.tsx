import type {
  CompanyId,
  Conversation,
  ConversationId,
  MessageId,
  ProjectId,
  Provider,
} from '@conexus/hub-api'
import { questionIdOf } from '@conexus/hub-api'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { ReactNode, RefObject } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAttemptKeys } from '../../platform/attempt-key.ts'
import { HubFailure, writeFailureText } from '../../platform/hub.ts'
import { Empty, NotFound } from '../../ui/states.tsx'
import { accountsQuery } from '../model-accounts/public.ts'
import { Composer } from './composer.tsx'
import type { Item } from './conversation-switch.tsx'
import { ConversationSwitch } from './conversation-switch.tsx'
import { useDraft } from './draft.ts'
import type { Step } from './live.ts'
import { shownAnswer, waitsOnPerson } from './live.ts'
import { MemoryStatus } from './memory-status.tsx'
import { ModelChoice, NoAccount } from './model-choice.tsx'
import { allConversationsQueryKey, conversationQuery, sendMessage, sendStop } from './queries.ts'
import { useReturnedSteers, withoutTold } from './steer-screen.ts'
import { TaskPanel } from './task-panel.tsx'
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
  dispatch: (action: Step) => void,
  onGone: () => void,
) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string>()
  const attempt = useAttemptKeys()
  const post = useMutation({ ...sendMessage, meta: { keepCache: true } })
  const stop = useMutation({ ...sendStop, meta: { keepCache: true } })

  /** A message sent while the Builder answers steers the running turn: its bubble shows first, then the POST goes. */
  async function send(content: string, answering: boolean): Promise<boolean> {
    setError(undefined)
    if (!answering) dispatch({ type: 'sent' })
    let steered: MessageId | undefined
    try {
      await attempt(content, (attemptKey) => {
        if (answering) {
          steered = questionIdOf(params.conversationId, attemptKey)
          dispatch({ type: 'steer', steer: { id: steered, content } })
        }
        return post.mutateAsync({ params, body: { content }, attemptKey })
      })
    } catch (failure) {
      if (steered !== undefined) dispatch({ type: 'unsteered', id: steered })
      else dispatch({ type: 'unsent' })
      if (failure instanceof HubFailure && failure.code === 'CONVERSATION_NOT_FOUND') onGone()
      else setError(writeFailureText(failure, UNCONFIRMED_SEND))
      return false
    }
    void queryClient.invalidateQueries({
      queryKey: conversationQuery(params.companyId, params.projectId, params.conversationId)
        .queryKey,
    })
    field.current?.focus()
    return true
  }

  function halt() {
    field.current?.focus()
    stop.mutate({ params })
  }

  return { error, setError, send, halt }
}

function PanelComposer(props: {
  params: Params
  conversation: Conversation
  accounts: { choices: { mine: readonly Provider[] } }
  state: ReturnType<typeof useLive>['state']
  draft: ReturnType<typeof useDraft>
  field: RefObject<HTMLTextAreaElement | null>
  onSend: (content: string) => Promise<boolean>
  onStop: () => void
  onError: (error: string | undefined) => void
  canAnswer: boolean
}) {
  const {
    params,
    conversation,
    accounts,
    state,
    draft,
    field,
    onSend,
    onStop,
    onError,
    canAnswer,
  } = props
  const isTurnRunning = state.kind === 'answering' || state.kind === 'resuming'
  const turn = state.kind === 'idle' ? undefined : state.turn
  const activeTasks = turn?.tasks ?? conversation.tasks
  const activeMemory = turn?.memory ?? conversation.memory
  const omPhase = turn?.omPhase ?? 'idle'
  const memoryFailed = turn?.memoryFailed ?? null

  return (
    <div className="px-md">
      <Composer
        answering={state.kind === 'answering'}
        canSend={canAnswer}
        draft={draft}
        field={field}
        onSend={onSend}
        onStop={onStop}
        taskPanel={<TaskPanel tasks={activeTasks} streaming={isTurnRunning} />}
        memory={<MemoryStatus memory={activeMemory} omPhase={omPhase} failed={memoryFailed} />}
        picker={
          canAnswer && (
            <ModelChoice
              ids={params}
              conversation={conversation}
              providers={accounts.choices.mine}
              onError={onError}
            />
          )
        }
      />
    </div>
  )
}

function Notices(props: { companyId: CompanyId; canAnswer: boolean; empty: boolean }) {
  if (props.canAnswer && !props.empty) return null
  return (
    <div className="flex flex-col gap-md px-md py-md">
      {!props.canAnswer && <NoAccount companyId={props.companyId} />}
      {props.empty && <Empty>{EMPTY_CONVERSATION}</Empty>}
    </div>
  )
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
  const draft = useDraft(conversationId)
  const { state, dispatch } = useLive(params, () => {
    void queryClient.invalidateQueries({
      queryKey: allConversationsQueryKey(companyId, projectId),
    })
    setGone(true)
  })
  const { error, setError, send, halt } = useSending(params, field, dispatch, () => setGone(true))

  useEffect(() => field.current?.focus(), [])

  useReturnedSteers(state, draft, setError, dispatch)

  const { saved, answer } = useMemo(() => {
    const shown = shownAnswer(state, conversation.messages)
    const saved = withoutTold(state, conversation.messages, shown !== null)
    return { saved, answer: shown }
  }, [state, conversation.messages])
  if (gone) return <NotFound />
  const isTurnRunning = state.kind === 'answering' || state.kind === 'resuming'
  const empty = conversation.messages.length === 0 && state.kind === 'idle'
  return (
    <>
      <Notices companyId={companyId} canAnswer={canAnswer} empty={empty} />
      <div className="min-h-40 flex-1">
        <Transcript
          messages={saved}
          answer={answer}
          steers={isTurnRunning ? state.turn.steers : []}
          model={conversation.model}
        />
      </div>
      {error !== undefined && (
        <p role="alert" className="px-md">
          {error}
        </p>
      )}
      {isTurnRunning && (
        <WorkingLine
          startedAt={state.turn.startedAt}
          heard={state.turn.messages}
          waiting={answer !== null && waitsOnPerson(answer.items)}
        />
      )}
      <PanelComposer
        params={params}
        conversation={conversation}
        accounts={accounts}
        state={state}
        draft={draft}
        field={field}
        onSend={(content) => send(content, isTurnRunning)}
        onStop={halt}
        onError={setError}
        canAnswer={canAnswer}
      />
    </>
  )
}
