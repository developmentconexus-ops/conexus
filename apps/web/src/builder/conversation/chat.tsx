import type { CompanyId, ConversationId, Provider } from '@conexus/hub-api'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import type { ReactNode, RefObject } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { HubFailure, writeFailureText } from '../../platform/hub.ts'
import { Empty, NotFound } from '../../ui/states.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { accountsQuery } from '../model-accounts/public.ts'
import type { Outgoing } from './attachments.ts'
import { Composer } from './composer.tsx'
import { useDraft } from './draft.ts'
import { useHandoff } from './handoff.ts'
import { MemoryStatus } from './memory-status.tsx'
import { NoAccount } from './model-choice.tsx'
import type { SessionRead } from './queries.ts'
import { sessionReadQuery } from './queries.ts'
import type { BuilderSession, Place } from './session.ts'
import type { Action, SessionState } from './session-state.ts'
import { TaskPanel } from './task-panel.tsx'
import { HANDOFF_UNCONFIRMED, NO_SECRETS, UNCONFIRMED_SEND } from './text.ts'
import { shownOf, Transcript } from './transcript.tsx'
import { useSession } from './use-session.ts'
import { WorkingLine } from './working-line.tsx'

/**
 * What a conversation's screen takes from the one that draws it (step 24.1, U4): whose session it
 * is, the read of the conversation to ask again, what an empty conversation says, and the pieces
 * that differ: the Builder's model button, the Assistant's bar of connections.
 */
export type ChatProps = {
  companyId: CompanyId
  conversationId: ConversationId
  place: Place
  /** The read of the conversation, asked again after a send and when the person's session ends. */
  conversationKey: readonly unknown[]
  /** The conversation is gone: the caller reads again what lists it. */
  onGone: () => void
  empty: string
  /** The model's button of the composer, for a person who can answer; none where the model is not changed here. */
  picker?: (control: {
    session: SessionRead
    providers: readonly Provider[]
    onError: (error: string | undefined) => void
  }) => ReactNode
  /** Between the transcript and the box. */
  bar?: ReactNode
}

function useSending(
  props: ChatProps,
  builder: BuilderSession,
  field: RefObject<HTMLTextAreaElement | null>,
  dispatch: (action: Action) => void,
  onGone: () => void,
) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string>()

  /**
   * Mastra's `sendMessage` opens a run, or enters the running one, or waits on the open card: a
   * message sent while the agent works shows pinned first, until the stream says Mastra took it.
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
    void queryClient.invalidateQueries({ queryKey: props.conversationKey })
    void queryClient.invalidateQueries({
      queryKey: sessionReadQuery(props.conversationId, props.place.controller).queryKey,
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

function ChatComposer(props: {
  chat: ChatProps
  session: SessionRead
  providers: readonly Provider[]
  state: SessionState
  draft: ReturnType<typeof useDraft>
  field: RefObject<HTMLTextAreaElement | null>
  onSend: (outgoing: Outgoing) => Promise<boolean>
  onStop: () => void
  onError: (error: string | undefined) => void
  canAnswer: boolean
  waiting: boolean
}) {
  const { chat, session, state, draft, field, canAnswer } = props
  return (
    <div className="px-md">
      <Composer
        answering={state.running || props.waiting}
        canSend={canAnswer}
        draft={draft}
        field={field}
        onSend={props.onSend}
        onStop={props.onStop}
        taskPanel={<TaskPanel tasks={session.tasks} streaming={state.running} />}
        memory={
          <MemoryStatus memory={state.memory} omPhase={state.omPhase} failed={state.memoryFailed} />
        }
        picker={
          canAnswer &&
          chat.picker?.({ session, providers: props.providers, onError: props.onError })
        }
      />
    </div>
  )
}

function Notices(props: { companyId: CompanyId; canAnswer: boolean; empty: string | undefined }) {
  const phone = useIsMobile()
  if (props.canAnswer && props.empty === undefined) return null
  return (
    <div className="flex flex-col gap-md px-md py-md">
      {!props.canAnswer && <NoAccount companyId={props.companyId} />}
      {props.empty !== undefined && (
        <Empty>
          {props.empty}
          {phone && <span className="mt-sm block text-fact text-text-2">{NO_SECRETS}</span>}
        </Empty>
      )}
    </div>
  )
}

/** Sends the request Início handed over, and gives its words back to the box when the send is refused or cut short. */
function useHandedOver(input: {
  conversationId: ConversationId
  draft: ReturnType<typeof useDraft>
  send: (outgoing: Outgoing, running: boolean) => Promise<boolean>
  setError: (error: string) => void
}) {
  const { draft, send, setError } = input
  useHandoff(input.conversationId, {
    send: async (outgoing) => {
      if (!(await send(outgoing, false))) draft.restore(outgoing)
    },
    recover: (text) => {
      draft.restore({ content: text, files: [] })
      setError(HANDOFF_UNCONFIRMED)
    },
  })
}

/**
 * One conversation: the transcript with the answer arriving, and the box. The session is Mastra's,
 * on its own routes behind the Hub's guard, read by `use-session.ts`; the Builder's and the
 * Assistant's are the same screen over two controllers. A switch of conversation starts the screen
 * over, and what was typed comes back from its draft.
 */
export function Chat(props: ChatProps) {
  const { companyId, conversationId, place } = props
  const queryClient = useQueryClient()
  const session = useSuspenseQuery(sessionReadQuery(conversationId, place.controller)).data
  const accounts = useSuspenseQuery(accountsQuery(companyId)).data
  const usable = useMemo(() => new Set(accounts.usableProviders), [accounts.usableProviders])
  const canAnswer = usable.size > 0
  const [gone, setGone] = useState(false)
  const field = useRef<HTMLTextAreaElement>(null)
  const draft = useDraft(conversationId)
  const { state, dispatch, builder, older } = useSession(
    { companyId, conversationId, ...place },
    {
      gone: () => {
        props.onGone()
        setGone(true)
      },
      ended: () => void queryClient.invalidateQueries({ queryKey: props.conversationKey }),
    },
  )
  const { error, setError, send, halt } = useSending(props, builder, field, dispatch, () =>
    setGone(true),
  )

  useEffect(() => field.current?.focus(), [])
  useHandedOver({ conversationId, draft, send, setError })

  const turns = useMemo(() => shownOf(state), [state])
  const waiting = Object.keys(state.suspended).length > 0
  const phone = useIsMobile()
  if (gone) return <NotFound />
  const empty = state.messages.length === 0 && !state.running
  return (
    <>
      <Notices
        companyId={companyId}
        canAnswer={canAnswer}
        empty={empty ? props.empty : undefined}
      />
      <div className="min-h-24 flex-1 md:min-h-40">
        <Transcript
          turns={turns}
          steers={state.steers}
          model={session.model}
          older={older}
          onAsk={(text) => {
            draft.append(text)
            field.current?.focus()
          }}
        />
      </div>
      {error !== undefined && (
        <p role="alert" className="px-md">
          {error}
        </p>
      )}
      {(state.running || waiting) && !(phone && waiting) && (
        <WorkingLine startedAt={state.startedAt} heard={state.messages} waiting={waiting} />
      )}
      {props.bar}
      <ChatComposer
        chat={props}
        session={session}
        providers={accounts.choices.mine}
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
