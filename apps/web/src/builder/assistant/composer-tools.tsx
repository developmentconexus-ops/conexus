import type {
  AssistantConversation,
  CompanyId,
  ConnectionId,
  ProjectId,
  SessionConnection,
} from '@conexus/hub-api'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { FolderIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { ConnectorLogo } from '../../hub/connectors/public.ts'
import { projectQuery, projectsPagedQuery } from '../../hub/projects/public.ts'
import { sentenceOf, writeFailureText } from '../../platform/hub.ts'
import { buttonVariants } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu.tsx'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { Switch } from '../../ui/switch.tsx'
import { useConnectorCatalog } from './connector-names.ts'
import type { DraftChoice } from './context-bar.tsx'
import { assistantConversationQuery, sendAssistantConnections } from './queries.ts'
import {
  LINK_TOOLS_HOME,
  LINK_TOOLS_PROJECT,
  NO_PROJECT_CHIP,
  NO_TOOLS,
  PROJECT_CHOICE,
  TOOLS_LIST,
  UNCONFIRMED_CHOICE,
} from './text.ts'

/** Where the composer sits: Início, or a conversation begun. Início's Projeto is chosen only without `onProject`. */
export type ComposerPlace =
  | {
      kind: 'HOME'
      companyId: CompanyId
      draft: DraftChoice
      /** The Projeto the conversation will be born in; `onProject` is absent where it is fixed (a Projeto's own page). */
      projectId: ProjectId | undefined
      onProject?: (projectId: ProjectId | undefined) => void
    }
  | { kind: 'CONVERSATION'; companyId: CompanyId; conversation: AssistantConversation }

/** The words that go first under 26 rem of box: the row keeps its controls and loses these. */
const WORDS = '@max-[26rem]:sr-only'

const CHIP = 'h-control-sm min-w-[2rem] shrink-0 justify-center gap-xs px-xs text-fact text-text-2'

/** The folder of a conversation with no Projeto: faded, named for a screen reader, opening nothing. */
function NoProjectChip() {
  return (
    <span
      role="img"
      aria-label={NO_PROJECT_CHIP}
      className={cn(CHIP, 'inline-flex items-center opacity-50')}
    >
      <FolderIcon aria-hidden="true" className="size-4" />
    </span>
  )
}

/** The Projeto a conversation lives in, fixed: its folder and, once the Hub has answered, its name. */
function FixedProjectChip(props: { companyId: CompanyId; projectId: ProjectId }) {
  const project = useQuery(projectQuery(props.companyId, props.projectId)).data?.project
  return (
    <span className={cn(CHIP, 'inline-flex items-center')}>
      <FolderIcon aria-hidden="true" className="size-4 shrink-0" />
      {project !== undefined && (
        <span className={cn('max-w-40 truncate', WORDS)}>{project.name}</span>
      )}
    </span>
  )
}

const NO_PROJECT = 'none'

/** Início's choice of the Projeto a conversation is born in, only until its first question: a plain list, no search (the "+" menu of U5 brings it). */
function ProjectChoice(props: {
  companyId: CompanyId
  value: ProjectId | undefined
  onChange: (projectId: ProjectId | undefined) => void
}) {
  const read = useInfiniteQuery(projectsPagedQuery(props.companyId))
  const projects = read.data?.pages.flatMap((page) => page.projects) ?? []
  const chosen = projects.find((project) => project.id === props.value)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={PROJECT_CHOICE}
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), CHIP)}
      >
        <FolderIcon aria-hidden="true" className="size-4 shrink-0" />
        {chosen !== undefined && (
          <span className={cn('max-w-40 truncate text-text', WORDS)}>{chosen.name}</span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="max-h-72 overflow-y-auto">
        <DropdownMenuRadioGroup
          value={props.value ?? NO_PROJECT}
          onValueChange={(next) =>
            props.onChange(projects.find((project) => project.id === next)?.id)
          }
        >
          <DropdownMenuRadioItem value={NO_PROJECT}>Sem Projeto</DropdownMenuRadioItem>
          {projects.map((project) => (
            <DropdownMenuRadioItem key={project.id} value={project.id}>
              <span className="truncate">{project.name}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {read.hasNextPage && (
          <DropdownMenuItem
            closeOnClick={false}
            disabled={read.isFetchingNextPage}
            onClick={() => void read.fetchNextPage()}
          >
            Mais Projetos
          </DropdownMenuItem>
        )}
        {read.isError && (
          <p role="alert" className="px-sm py-xs text-danger">
            {sentenceOf(read.error)}
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** The switches of the conversation's tools: one per connection the place offers; a connection being changed waits. */
function Adjust(props: {
  offered: readonly SessionConnection[]
  label: (connection: SessionConnection) => string
  busy: boolean
  onToggle: (connectionId: ConnectionId, chosen: boolean) => void
}) {
  return (
    <>
      <p className="font-medium">{TOOLS_LIST}</p>
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
    </>
  )
}

const SHOWN_LOGOS = 3

function countText(count: number): string {
  return count === 1 ? '1 ferramenta' : `${count} ferramentas`
}

type Choice = {
  offered: readonly SessionConnection[] | undefined
  busy: boolean
  error?: string
  /** The offer could not be read, with what asks again. */
  failed?: { text: string; retry: () => void }
  onToggle: (connectionId: ConnectionId, chosen: boolean) => void
}

/** "N ferramentas": up to three logos and the count, which open the list of switches until U5's menu takes it. */
function ToolsCount(props: { place: ComposerPlace; choice: Choice }) {
  const { place, choice } = props
  const catalog = useConnectorCatalog(place.companyId)
  const { offered } = choice
  if (offered === undefined)
    return choice.failed === undefined ? <Skeleton className="h-5 w-24" /> : null
  if (offered.length === 0) return <NoTools place={place} />
  const chosen = offered.filter((one) => one.chosen)
  function label(connection: SessionConnection): string {
    return `${catalog.name(connection.connector)} · ${connection.name}`
  }
  const logos = chosen.slice(0, SHOWN_LOGOS).flatMap((one) => catalog.logo(one.connector) ?? [])
  return (
    <Popover>
      <PopoverTrigger
        aria-label={chosen.length === 0 ? NO_TOOLS : countText(chosen.length)}
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), CHIP, 'px-sm')}
      >
        <span aria-hidden="true" className="flex -space-x-1">
          {logos.map((logo, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: the stack's logos can repeat, and it never reorders.
            <ConnectorLogo key={index} small entry={{ logo }} />
          ))}
        </span>
        <span aria-hidden="true">
          {chosen.length === 0 ? (
            NO_TOOLS
          ) : (
            <>
              {chosen.length}
              <span className="@max-[26rem]:hidden">
                {chosen.length === 1 ? ' ferramenta' : ' ferramentas'}
              </span>
            </>
          )}
        </span>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="gap-md">
        <Adjust offered={offered} label={label} busy={choice.busy} onToggle={choice.onToggle} />
      </PopoverContent>
    </Popover>
  )
}

/** Nothing offered by the place: where to link a system, by the place. */
function NoTools({ place }: { place: ComposerPlace }) {
  const projectId = projectOf(place)
  const link = cn(buttonVariants({ variant: 'ghost', size: 'sm' }), CHIP)
  return projectId === undefined ? (
    <Link
      to="/companies/$companyId/integrations"
      params={{ companyId: place.companyId }}
      aria-label={LINK_TOOLS_HOME}
      className={link}
    >
      {NO_TOOLS}
    </Link>
  ) : (
    <Link
      to="/companies/$companyId/projects/$projectId/integrations"
      params={{ companyId: place.companyId, projectId }}
      aria-label={LINK_TOOLS_PROJECT}
      className={link}
    >
      {NO_TOOLS}
    </Link>
  )
}

function projectOf(place: ComposerPlace): ProjectId | undefined {
  return place.kind === 'HOME' ? place.projectId : (place.conversation.projectId ?? undefined)
}

/** What a place reads with no conversation begun: nothing yet, so nothing to show or to switch. */
const NO_OFFER: Choice = { offered: undefined, busy: false, onToggle: () => undefined }

/** The switch of a conversation begun is a `PUT`: the box shows what the Hub answered, and the choice before when it refuses (web W10, W12). */
function useConversationChoice(
  companyId: CompanyId,
  conversation: AssistantConversation | undefined,
): Choice {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string>()
  const send = useMutation({
    ...sendAssistantConnections,
    onSuccess: (answer) =>
      conversation !== undefined &&
      queryClient.setQueryData(
        assistantConversationQuery(companyId, conversation.id).queryKey,
        answer,
      ),
  })
  if (conversation === undefined) return NO_OFFER
  // While the swap is in the air the box already shows it; a refusal puts the choice before back.
  const asked = send.isPending ? send.variables.body.connections : undefined
  return {
    offered: conversation.connections.map((one) => ({
      ...one,
      chosen: asked === undefined ? one.chosen : asked.includes(one.connectionId),
    })),
    busy: send.isPending,
    error,
    onToggle: (connectionId, chosen) => {
      setError(undefined)
      const connections = conversation.connections
        .filter((one) => (one.connectionId === connectionId ? chosen : one.chosen))
        .map((one) => one.connectionId)
      send.mutate(
        { params: { companyId, conversationId: conversation.id }, body: { connections } },
        { onError: (failure) => setError(writeFailureText(failure, UNCONFIRMED_CHOICE)) },
      )
    },
  }
}

function draftChoice(draft: DraftChoice): Choice {
  const { read } = draft
  return {
    offered: draft.offered,
    busy: false,
    failed: read.isError
      ? { text: sentenceOf(read.error), retry: () => void read.refetch() }
      : undefined,
    onToggle: draft.toggle,
  }
}

function useChoice(place: ComposerPlace): Choice {
  const live = useConversationChoice(
    place.companyId,
    place.kind === 'CONVERSATION' ? place.conversation : undefined,
  )
  return place.kind === 'HOME' ? draftChoice(place.draft) : live
}

function ProjectControl({ place }: { place: ComposerPlace }) {
  const projectId = projectOf(place)
  if (place.kind === 'HOME' && place.onProject !== undefined)
    return (
      <ProjectChoice companyId={place.companyId} value={projectId} onChange={place.onProject} />
    )
  return projectId === undefined ? (
    <NoProjectChip />
  ) : (
    <FixedProjectChip companyId={place.companyId} projectId={projectId} />
  )
}

/** What fails in the tools, said above the box: the offer that could not be read, a switch the Hub refused, a catalog that did not load. */
function Notice(props: { choice: Choice; catalogFailure: string | undefined }) {
  const { failed, error } = props.choice
  if (failed !== undefined) return <ReadFailure text={failed.text} onRetry={failed.retry} />
  const text = error ?? props.catalogFailure
  return text === undefined ? null : (
    <p role="alert" className="text-danger">
      {text}
    </p>
  )
}

/**
 * The folder and the tools count of a place, from one reading: the pieces `Composer` puts after its
 * "+" (design V30, the card's row "A linha da caixa"), and what to say above the box when they fail.
 */
export function useComposerTools(place: ComposerPlace): { context: ReactNode; notice: ReactNode } {
  const choice = useChoice(place)
  const catalog = useConnectorCatalog(place.companyId)
  return {
    context: (
      <>
        <ProjectControl place={place} />
        <ToolsCount place={place} choice={choice} />
      </>
    ),
    notice: <Notice choice={choice} catalogFailure={catalog.failure} />,
  }
}
