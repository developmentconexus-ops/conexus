import type {
  AssistantConversation,
  CompanyId,
  ConnectionId,
  HandedOff,
  HandOffRefusal,
  ProposedApp,
} from '@conexus/hub-api'
import { FAILURES, ProjectName } from '@conexus/hub-api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { connectionsQuery } from '../../hub/connectors/public.ts'
import { projectQuery } from '../../hub/projects/public.ts'
import { derivedAttemptKey } from '../../platform/attempt-key.ts'
import { HubFailure, writeFailureText } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { Button } from '../../ui/button.tsx'
import { Card, CardContent, CardFooter } from '../../ui/card.tsx'
import { Field, FieldLabel } from '../../ui/field.tsx'
import { Input } from '../../ui/input.tsx'
import { CONTINUE_HERE, Markdown, useSay } from '../conversation/public.ts'
import { sendHandOff } from './queries.ts'
import {
  BRIEFING_LABEL,
  CREATE_APP,
  OPEN_BUILDER,
  PROJECT_GONE,
  PROJECT_NAME_LABEL,
  PROPOSAL_GONE,
  RELEASE_CONNECTIONS,
  RETRY,
  SEND_TO_BUILDER,
  UNCONFIRMED_HANDOFF,
} from './text.ts'

/** Why a marked connection stayed behind, in the words the Hub already uses for it. */
const REFUSALS: Record<HandOffRefusal, string> = {
  CONNECTION_NOT_WORKING: FAILURES.CONNECTION_NOT_WORKING.phrase,
  CONNECTION_NOT_FOUND: FAILURES.CONNECTION_NOT_FOUND.phrase,
  PROJECT_CONNECTION_TAKEN: FAILURES.PROJECT_CONNECTION_TAKEN.phrase,
  CONNECTIONS_NOT_ALLOWED: 'Peça ao dono ou a um administrador para liberar.',
}

function Briefing({ briefing }: { briefing: NonNullable<ProposedApp['briefing']> }) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-xs">
      <p className="text-label text-text-2">
        {BRIEFING_LABEL}: {briefing.name}
      </p>
      <div className="max-h-64 overflow-auto rounded-control border border-line p-sm">
        <Markdown text={briefing.content} />
      </div>
    </div>
  )
}

function Connections(props: {
  connections: AssistantConversation['connections']
  mayRelease: boolean
  marked: ReadonlySet<ConnectionId>
  onToggle: (id: ConnectionId) => void
  disabled: boolean
}) {
  if (props.connections.length === 0) return null
  return (
    <fieldset className="flex flex-col gap-xs">
      <legend className="mb-xs text-label text-text-2">{RELEASE_CONNECTIONS}</legend>
      {props.connections.map((connection) => (
        <label key={connection.connectionId} className="flex items-center gap-sm text-label">
          <input
            type="checkbox"
            checked={props.mayRelease && props.marked.has(connection.connectionId)}
            disabled={props.disabled || !props.mayRelease}
            onChange={() => props.onToggle(connection.connectionId)}
          />
          {connection.name}
        </label>
      ))}
      {!props.mayRelease && (
        <p className="text-label text-text-2">{REFUSALS.CONNECTIONS_NOT_ALLOWED}</p>
      )}
    </fieldset>
  )
}

/** What the touch made, when a connection stayed behind: each refused one with its sentence. */
function Refused(props: { made: HandedOff; connections: AssistantConversation['connections'] }) {
  return (
    <ul className="flex flex-col gap-xs text-label text-text-2">
      {props.made.refused.map((one) => (
        <li key={one.connectionId}>
          {props.connections.find((each) => each.connectionId === one.connectionId)?.name}:{' '}
          {REFUSALS[one.code]}
        </li>
      ))}
    </ul>
  )
}

type CardProps = {
  companyId: CompanyId
  conversation: Pick<AssistantConversation, 'id' | 'projectId' | 'connections'>
  proposed: ProposedApp
  toolCallId: string
  /** The proposal was replaced, or the person went on without it: no button. */
  closed: boolean
}

/**
 * The touch: the route hands the proposal over, once by the key the conversation and the call
 * derive (code C37, web W24). It answers NOT_FOUND for a proposal gone and for a Projeto gone, and
 * the Projeto's own read tells which.
 */
function useHandOff(props: CardProps, body: { name: string | undefined; marked: ConnectionId[] }) {
  const { companyId, conversation } = props
  const { projectId } = conversation
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const send = useMutation(sendHandOff)
  const [error, setError] = useState<string>()
  const [made, setMade] = useState<HandedOff>()
  const inFlight = useRef(false)

  function open(done: HandedOff) {
    return navigate({
      to: '/companies/$companyId/projects/$projectId/conversations/$conversationId',
      params: { companyId, projectId: done.projectId, conversationId: done.conversationId },
    })
  }

  async function gone(failure: unknown): Promise<string | undefined> {
    if (!(failure instanceof HubFailure) || failure.code !== 'NOT_FOUND') return undefined
    if (projectId === null) return PROPOSAL_GONE
    try {
      await queryClient.fetchQuery({ ...projectQuery(companyId, projectId), staleTime: 0 })
    } catch (read) {
      if (read instanceof HubFailure && read.code === 'NOT_FOUND') return PROJECT_GONE
      throw read
    }
    return PROPOSAL_GONE
  }

  async function touch() {
    if (inFlight.current) return
    inFlight.current = true
    setError(undefined)
    try {
      const attemptKey = await derivedAttemptKey(`${conversation.id}:${props.toolCallId}`)
      const done = await send.mutateAsync({
        params: { companyId, conversationId: conversation.id },
        body: {
          toolCallId: props.toolCallId,
          projectName: projectId === null ? ProjectName.parse(body.name) : undefined,
          connections: projectId === null ? body.marked : [],
        },
        attemptKey,
      })
      if (done.refused.length > 0) setMade(done)
      else await open(done)
    } catch (failure) {
      setError((await gone(failure)) ?? writeFailureText(failure, UNCONFIRMED_HANDOFF))
    } finally {
      inFlight.current = false
    }
  }

  return { touch, open, error, made, pending: send.isPending }
}

function Buttons(props: {
  starts: boolean
  pending: boolean
  failed: boolean
  disabled: boolean
  onTouch: () => void
}) {
  const say = useSay()
  const [saying, setSaying] = useState(false)
  async function continueHere() {
    setSaying(true)
    try {
      await say(CONTINUE_HERE)
    } finally {
      setSaying(false)
    }
  }
  const idle = props.starts ? CREATE_APP : SEND_TO_BUILDER
  const busy = props.starts ? 'Criando…' : 'Mandando…'
  return (
    <CardFooter className="flex-wrap gap-sm">
      <Button
        variant="primary"
        disabled={props.pending || saying || props.disabled}
        onClick={props.onTouch}
      >
        {props.pending ? busy : props.failed ? RETRY : idle}
      </Button>
      <Button disabled={props.pending || saying} onClick={() => void continueHere()}>
        {CONTINUE_HERE}
      </Button>
    </CardFooter>
  )
}

/**
 * The app the Assistant proposed (step 24.3.2, U3): on the Início **Criar app** with the name of
 * the Projeto and the connections to release, in a Projeto **Mandar ao Builder**; both hand the
 * proposal to the Builder and open the conversation it answers. **Continuar aqui** says so to the
 * Assistant as the person's own message. A closed proposal shows what it said and no button.
 */
export function AppProposalCard(props: CardProps) {
  const { companyId, conversation, proposed } = props
  const starts = conversation.projectId === null
  const mayRelease = useQuery(connectionsQuery(companyId)).data?.mayManage ?? false
  const [name, setName] = useState('')
  const [unmarked, setUnmarked] = useState<ReadonlySet<ConnectionId>>(new Set())
  const marked = conversation.connections
    .filter((each) => each.chosen && !unmarked.has(each.connectionId))
    .map((each) => each.connectionId)
  const handOff = useHandOff(props, { name, marked })
  const named = ProjectName.safeParse(name).success
  const { made } = handOff
  return (
    <Card>
      <CardContent className="flex flex-col gap-sm">
        <p className="whitespace-pre-wrap break-words text-text">{proposed.summary}</p>
        {proposed.briefing !== undefined && <Briefing briefing={proposed.briefing} />}
      </CardContent>
      {!props.closed && starts && made === undefined && (
        <>
          <Field>
            <FieldLabel htmlFor={`${props.toolCallId}-name`}>{PROJECT_NAME_LABEL}</FieldLabel>
            <Input
              id={`${props.toolCallId}-name`}
              value={name}
              disabled={handOff.pending}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Connections
            connections={conversation.connections}
            mayRelease={mayRelease}
            marked={new Set(marked)}
            disabled={handOff.pending}
            onToggle={(id) =>
              setUnmarked((now) => {
                const next = new Set(now)
                if (!next.delete(id)) next.add(id)
                return next
              })
            }
          />
        </>
      )}
      {made !== undefined && (
        <>
          <Refused made={made} connections={conversation.connections} />
          <Button variant="primary" onClick={() => void handOff.open(made)}>
            {OPEN_BUILDER}
          </Button>
        </>
      )}
      {!props.closed && made === undefined && (
        <Buttons
          starts={starts}
          pending={handOff.pending}
          failed={handOff.error !== undefined}
          disabled={starts && !named}
          onTouch={() => void handOff.touch()}
        />
      )}
      {handOff.error !== undefined && <Alert tone="danger">{handOff.error}</Alert>}
    </Card>
  )
}
