import type {
  AssistantConversation,
  CompanyId,
  ConnectionId,
  ProjectId,
  SessionConnection,
} from '@conexus/hub-api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { SlidersHorizontalIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useEffectEvent, useState } from 'react'
import { sentenceOf, writeFailureText } from '../../platform/hub.ts'
import { Badge } from '../../ui/badge.tsx'
import { buttonVariants } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { Switch } from '../../ui/switch.tsx'
import { useConnectorNames } from './connector-names.ts'
import {
  assistantConnectionsQuery,
  assistantConversationQuery,
  sendAssistantConnections,
} from './queries.ts'
import {
  NO_CHOICE,
  NO_CONNECTIONS_HOME,
  NO_CONNECTIONS_PROJECT,
  UNCONFIRMED_CHOICE,
} from './text.ts'

type Props = {
  companyId: CompanyId
  /** The Projeto the conversation lives in; none on Início. Fixed once the conversation exists. */
  projectId?: ProjectId
  /** The conversation begun; without it the bar holds the choice of the one about to begin. */
  conversation?: AssistantConversation
  /** The choice of the conversation not yet begun, on mount and at each change. */
  onDraftChange?: (chosen: readonly ConnectionId[]) => void
  /** What sits beside **Ajustar**: Início's Projeto selector. */
  trailing?: ReactNode
}

/** The bar's empty state: where to link a system, by the place. */
function NoConnections({ companyId, projectId }: { companyId: CompanyId; projectId?: ProjectId }) {
  const link = cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'w-fit')
  return (
    <p className="flex flex-wrap items-center gap-sm text-text-2">
      {projectId === undefined ? NO_CONNECTIONS_HOME : NO_CONNECTIONS_PROJECT}
      {projectId === undefined ? (
        <Link to="/companies/$companyId/integrations" params={{ companyId }} className={link}>
          Abrir Integrações
        </Link>
      ) : (
        <Link
          to="/companies/$companyId/projects/$projectId/integrations"
          params={{ companyId, projectId }}
          className={link}
        >
          Abrir Integrações do Projeto
        </Link>
      )}
    </p>
  )
}

/** One switch per connection the place offers; a connection being changed waits. */
function Adjust(props: {
  offered: readonly SessionConnection[]
  label: (connection: SessionConnection) => string
  busy: boolean
  onToggle: (connectionId: ConnectionId, chosen: boolean) => void
}) {
  return (
    <Popover>
      <PopoverTrigger className={cn(buttonVariants({ size: 'sm' }), 'gap-xs')}>
        <SlidersHorizontalIcon aria-hidden="true" />
        Ajustar
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="gap-md">
        <p className="font-medium">Ligações desta conversa</p>
        <ul className="flex flex-col gap-sm">
          {props.offered.map((connection) => (
            <li key={connection.connectionId} className="flex items-center justify-between gap-md">
              <label htmlFor={`connection-${connection.connectionId}`} className="min-w-0 truncate">
                {props.label(connection)}
              </label>
              <Switch
                id={`connection-${connection.connectionId}`}
                checked={connection.chosen}
                disabled={props.busy}
                onCheckedChange={(next) => props.onToggle(connection.connectionId, next)}
              />
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

/** The bar's view, from the connections the place offers and what is chosen. */
function Bar(props: {
  companyId: CompanyId
  projectId?: ProjectId
  offered: readonly SessionConnection[]
  busy: boolean
  error?: string
  onToggle: (connectionId: ConnectionId, chosen: boolean) => void
  trailing?: ReactNode
}) {
  const names = useConnectorNames(props.companyId)
  function label(connection: SessionConnection): string {
    return `${names(connection.connector)} · ${connection.name}`
  }
  const chosen = props.offered.filter((one) => one.chosen)
  return (
    <div className="flex flex-col gap-sm">
      <fieldset
        aria-label="Ligações da conversa"
        className="m-0 flex min-w-0 flex-wrap items-center gap-sm border-0 p-0"
      >
        {props.offered.length === 0 ? (
          <NoConnections companyId={props.companyId} projectId={props.projectId} />
        ) : (
          <>
            {chosen.length === 0 ? (
              <span className="text-text-2">{NO_CHOICE}</span>
            ) : (
              chosen.map((connection) => (
                <Badge key={connection.connectionId}>{label(connection)}</Badge>
              ))
            )}
            <Adjust
              offered={props.offered}
              label={label}
              busy={props.busy}
              onToggle={props.onToggle}
            />
          </>
        )}
        {props.trailing}
      </fieldset>
      {props.error !== undefined && (
        <p role="alert" className="text-danger">
          {props.error}
        </p>
      )}
    </div>
  )
}

/**
 * The bar of the conversation (web W10, W12): the connections it reads as labels and **Ajustar**,
 * a switch for each one the place offers. Before the first question the choice is a draft that the
 * request creating the conversation carries; after it, each switch is a `PUT` and the bar shows
 * what the Hub answered, going back to the choice before when the Hub refuses.
 */
export function ContextBar(props: Props) {
  const { companyId, projectId, conversation } = props
  return conversation === undefined ? (
    <DraftBar {...props} />
  ) : (
    <ChosenBar
      companyId={companyId}
      projectId={projectId}
      conversation={conversation}
      trailing={props.trailing}
    />
  )
}

function DraftBar(props: Props) {
  const { companyId, projectId } = props
  const read = useQuery(assistantConnectionsQuery(companyId, projectId))
  const [unchosen, setUnchosen] = useState<ReadonlySet<ConnectionId>>(new Set())
  const reported = useEffectEvent((chosen: readonly ConnectionId[]) =>
    props.onDraftChange?.(chosen),
  )
  // What the place offers is all chosen at first: the parent learns it when the read arrives.
  useEffect(() => {
    if (read.data !== undefined) reported(read.data.connections.map((one) => one.connectionId))
  }, [read.data])
  if (read.isPending) return <Skeleton className="h-8 w-64" />
  if (read.isError)
    return (
      <p role="alert" className="text-danger">
        {sentenceOf(read.error)}
      </p>
    )
  const offered = read.data.connections.map((one) => ({
    ...one,
    chosen: !unchosen.has(one.connectionId),
  }))
  function toggle(connectionId: ConnectionId, chosen: boolean) {
    const next = new Set(unchosen)
    if (chosen) next.delete(connectionId)
    else next.add(connectionId)
    setUnchosen(next)
    reported(offered.filter((one) => !next.has(one.connectionId)).map((one) => one.connectionId))
  }
  return (
    <Bar
      companyId={companyId}
      projectId={projectId}
      offered={offered}
      busy={false}
      trailing={props.trailing}
      onToggle={toggle}
    />
  )
}

function ChosenBar(props: {
  companyId: CompanyId
  projectId?: ProjectId
  conversation: AssistantConversation
  trailing?: ReactNode
}) {
  const { companyId, conversation } = props
  const queryClient = useQueryClient()
  const [error, setError] = useState<string>()
  const send = useMutation({
    ...sendAssistantConnections,
    onSuccess: (answer) =>
      queryClient.setQueryData(
        assistantConversationQuery(companyId, conversation.id).queryKey,
        answer,
      ),
  })
  // While the swap is in the air the bar already shows it; a refusal puts the choice before back.
  const asked = send.isPending ? send.variables.body.connections : undefined
  const offered = conversation.connections.map((one) => ({
    ...one,
    chosen: asked === undefined ? one.chosen : asked.includes(one.connectionId),
  }))
  return (
    <Bar
      companyId={companyId}
      projectId={props.projectId}
      offered={offered}
      busy={send.isPending}
      error={error}
      trailing={props.trailing}
      onToggle={(connectionId, chosen) => {
        setError(undefined)
        const connections = conversation.connections
          .filter((one) => (one.connectionId === connectionId ? chosen : one.chosen))
          .map((one) => one.connectionId)
        send.mutate(
          { params: { companyId, conversationId: conversation.id }, body: { connections } },
          { onError: (failure) => setError(writeFailureText(failure, UNCONFIRMED_CHOICE)) },
        )
      }}
    />
  )
}
