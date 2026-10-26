import type { CompanyId, ConversationId, ProjectId, Provider } from '@conexus/hub-api'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { ReactNode, RefObject } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { HubFailure, writeFailureText } from '../../platform/hub.ts'
import { Empty, NotFound } from '../../ui/states.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { accountsQuery } from '../model-accounts/public.ts'
import type { Outgoing } from './attachments.ts'
import { Composer } from './composer.tsx'
import type { Item } from './conversation-switch.tsx'
import { ConversationSwitch } from './conversation-switch.tsx'
import { useDraft } from './draft.ts'
import { MemoryStatus } from './memory-status.tsx'
import { ModelChoice, NoAccount } from './model-choice.tsx'
import type { SessionRead } from './queries.ts'
import { allConversationsQueryKey, conversationQuery, sessionReadQuery } from './queries.ts'
import type { BuilderSession } from './session.ts'
import type { Action, SessionState } from './session-state.ts'
import { TaskPanel } from './task-panel.tsx'
import { EMPTY_CONVERSATION, NO_SECRETS, titleOf, UNCONFIRMED_SEND } from './text.ts'
import { shownOf, Transcript } from './transcript.tsx'
import { useSession } from './use-session.ts'
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
 * The session is Mastra's, on its own routes behind the Hub's guard, read by `use-session.ts`. A switch
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
  builder: BuilderSession,
  field: RefObject<HTMLTextAreaElement | null>,
  dispatch: (action: Action) => void,
  onGone: () => void,
) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string>()

  /**
   * Mastra's `sendMessage` opens a run, or enters the running one, or waits on the open card: a
   * message sent while the Builder works shows pinned first, until the stream says Mastra took it.
   */
  async function send(outgoing: Outgoing, running: boolean): Promise<boolean> {
    setError(undefined)
    const steer = running ? { id: crypto.randomUUID(), ...outgoing } : undefined
    if (steer !== undefined) dispatch({ type: 'steer', steer })
    try {
      await builder.send(outgoing)
    } catch (failure) {
      if (steer !== undefined) dispatch({ type: 'unsteered', id: steer.id })
      if (failure instanceof HubFailure && failure.code === 'CONVERSATION_NOT_FOUND') onGone()
      else setError(writeFailureText(failure, UNCONFIRMED_SEND))
      return false
    }
    void queryClient.invalidateQueries({
      queryKey: conversationQuery(params.companyId, params.projectId, params.conversationId)
        .queryKey,
    })
    void queryClient.invalidateQueries({
      queryKey: sessionReadQuery(params.conversationId).queryKey,
    })
    field.current?.focus()
    return true
  }

  const stop = useMutation({ mutationFn: builder.stop, meta: { keepCache: true } })

  function halt() {
    field.current?.focus()
    stop.mutate()
  }

  return { error, setError, send, halt }
}

function PanelComposer(props: {
  params: Params
  session: SessionRead
  accounts: { choices: { mine: readonly Provider[] } }
  state: SessionState
  draft: ReturnType<typeof useDraft>
  field: RefObject<HTMLTextAreaElement | null>
  onSend: (outgoing: Outgoing) => Promise<boolean>
  onStop: () => void
  onError: (error: string | undefined) => void
  canAnswer: boolean
  waiting: boolean
}) {
  const {
    params,
    session,
    accounts,
    state,
    draft,
    field,
    onSend,
    onStop,
    onError,
    canAnswer,
    waiting,
  } = props
  return (
    <div className="px-md">
      <Composer
        answering={state.running || waiting}
        canSend={canAnswer}
        draft={draft}
        field={field}
        onSend={onSend}
        onStop={onStop}
        taskPanel={<TaskPanel tasks={state.tasks ?? session.tasks} streaming={state.running} />}
        memory={
          <MemoryStatus memory={state.memory} omPhase={state.omPhase} failed={state.memoryFailed} />
        }
        picker={
          canAnswer && (
            <ModelChoice
              ids={params}
              conversationId={params.conversationId}
              session={session}
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
  const phone = useIsMobile()
  if (props.canAnswer && !props.empty) return null
  return (
    <div className="flex flex-col gap-md px-md py-md">
      {!props.canAnswer && <NoAccount companyId={props.companyId} />}
      {props.empty && (
        <Empty>
          {EMPTY_CONVERSATION}
          {phone && <span className="mt-sm block text-fact text-text-2">{NO_SECRETS}</span>}
        </Empty>
      )}
    </div>
  )
}

function Screen(params: Params) {
  const { companyId, projectId, conversationId } = params
  const queryClient = useQueryClient()
  const session = useSuspenseQuery(sessionReadQuery(conversationId)).data
  const accounts = useSuspenseQuery(accountsQuery(companyId)).data
  const usable = useMemo(() => new Set(accounts.usableProviders), [accounts.usableProviders])
  const canAnswer = usable.size > 0
  const [gone, setGone] = useState(false)
  const field = useRef<HTMLTextAreaElement>(null)
  const draft = useDraft(conversationId)
  const { state, dispatch, builder } = useSession(params, () => {
    void queryClient.invalidateQueries({
      queryKey: allConversationsQueryKey(companyId, projectId),
    })
    setGone(true)
  })
  const { error, setError, send, halt } = useSending(params, builder, field, dispatch, () =>
    setGone(true),
  )

  useEffect(() => field.current?.focus(), [])

  const turns = useMemo(() => shownOf(state), [state])
  const waiting = Object.keys(state.suspended).length > 0
  const phone = useIsMobile()
  if (gone) return <NotFound />
  const empty = state.messages.length === 0 && !state.running
  return (
    <>
      <Notices companyId={companyId} canAnswer={canAnswer} empty={empty} />
      <div className="min-h-24 flex-1 md:min-h-40">
        <Transcript turns={turns} steers={state.steers} model={session.model} />
      </div>
      {error !== undefined && (
        <p role="alert" className="px-md">
          {error}
        </p>
      )}
      {(state.running || waiting) && !(phone && waiting) && (
        <WorkingLine startedAt={state.startedAt} heard={state.messages} waiting={waiting} />
      )}
      <PanelComposer
        params={params}
        session={session}
        accounts={accounts}
        state={state}
        draft={draft}
        field={field}
        onSend={(outgoing) => send(outgoing, state.running || waiting)}
        onStop={halt}
        onError={setError}
        canAnswer={canAnswer}
        waiting={waiting}
      />
    </>
  )
}
