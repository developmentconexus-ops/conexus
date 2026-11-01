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
import { useState } from 'react'
import { projectQuery } from '../../hub/projects/public.ts'
import { sentenceOf, writeFailureText } from '../../platform/hub.ts'
import { Badge } from '../../ui/badge.tsx'
import { buttonVariants } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { Switch } from '../../ui/switch.tsx'
import { useConnectorCatalog } from './connector-names.ts'
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
  const catalog = useConnectorCatalog(props.companyId)
  function label(connection: SessionConnection): string {
    return `${catalog.name(connection.connector)} · ${connection.name}`
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
      {(props.error ?? catalog.failure) !== undefined && (
        <p role="alert" className="text-danger">
          {props.error ?? catalog.failure}
        </p>
      )}
    </div>
  )
}

/** The Projeto a conversation lives in, fixed beside **Ajustar**: its name once the Hub has answered. */
export function FixedProject(props: { companyId: CompanyId; projectId: ProjectId }) {
  const project = useQuery(projectQuery(props.companyId, props.projectId)).data?.project
  return project === undefined ? null : (
    <Badge className="max-w-full shrink">
      <span className="truncate">Projeto · {project.name}</span>
    </Badge>
  )
}

const NONE: ReadonlySet<ConnectionId> = new Set()

/**
 * The choice of the conversation not yet begun, with one owner: what the place offers, read from
 * the Hub, and what the person turned off. What the request creating the conversation carries is
 * the offer minus the turned-off ones at the moment of sending, so a new read of the offer never
 * undoes a switch. Without the offer read, `connections` is undefined and nothing may be sent.
 */
export function useDraftChoice(companyId: CompanyId, projectId: ProjectId | undefined) {
  const read = useQuery(assistantConnectionsQuery(companyId, projectId))
  const [held, setHeld] = useState({ project: projectId, unchosen: NONE })
  const unchosen = held.project === projectId ? held.unchosen : NONE
  const offered = read.data?.connections.map((one) => ({
    ...one,
    chosen: !unchosen.has(one.connectionId),
  }))
  return {
    read,
    offered,
    connections: offered?.filter((one) => one.chosen).map((one) => one.connectionId),
    toggle: (connectionId: ConnectionId, chosen: boolean) =>
      setHeld((was) => {
        const next = new Set(was.project === projectId ? was.unchosen : NONE)
        if (chosen) next.delete(connectionId)
        else next.add(connectionId)
        return { project: projectId, unchosen: next }
      }),
  }
}

/** The bar before the first question: it draws the choice that `useDraftChoice` holds and changes it. */
export function DraftBar(props: {
  companyId: CompanyId
  projectId?: ProjectId
  choice: ReturnType<typeof useDraftChoice>
  /** What sits beside **Ajustar**: Início's Projeto selector, or the Projeto fixed. */
  trailing?: ReactNode
}) {
  const { choice } = props
  if (choice.offered === undefined)
    return (
      <div className="flex flex-wrap items-center gap-sm">
        {choice.read.isError ? (
          <ReadFailure
            text={sentenceOf(choice.read.error)}
            onRetry={() => void choice.read.refetch()}
          />
        ) : (
          <Skeleton className="h-8 w-64" />
        )}
        {props.trailing}
      </div>
    )
  return (
    <Bar
      companyId={props.companyId}
      projectId={props.projectId}
      offered={choice.offered}
      busy={false}
      trailing={props.trailing}
      onToggle={choice.toggle}
    />
  )
}

/**
 * The bar of the conversation begun (web W10, W12): the connections it reads as labels and
 * **Ajustar**, a switch for each one the place offers. Each switch is a `PUT`, and the bar shows
 * what the Hub answered, going back to the choice before when the Hub refuses.
 */
export function ContextBar(props: {
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
