import type {
  AssistantConversation,
  CompanyId,
  ConnectionId,
  ProjectId,
  SessionConnection,
} from '@conexus/hub-api'
import { Link } from '@tanstack/react-router'
import { PaperclipIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { ConnectorLogo } from '../../hub/connectors/public.ts'
import { buttonVariants } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import { Drawer, DrawerContent, DrawerTrigger } from '../../ui/drawer.tsx'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover.tsx'
import { Switch } from '../../ui/switch.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { COMPOSER_SOFT } from '../conversation/public.ts'
import { LIST, matches, ROW, SEARCH_FROM, Search } from './choice-list.tsx'
import { useConnectorCatalog } from './connector-names.ts'
import type { DraftChoice } from './draft-choice.ts'
import {
  ATTACH_FILE,
  ATTACH_HINT,
  chosenOf,
  LINK_ANOTHER_TOOL,
  LINK_TOOLS_PROJECT,
  NO_TOOL_MATCH,
  NO_TOOLS_COMPANY,
  PLUS_MENU,
  READING_TOOLS,
  RELEASE_ANOTHER_TOOL,
  TOOLS_LIST,
  TOOLS_SEARCH,
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

export type Choice = {
  offered: readonly SessionConnection[] | undefined
  busy: boolean
  error?: string
  /** The offer could not be read, with what asks again. */
  failed?: { text: string; retry: () => void }
  onToggle: (connectionId: ConnectionId, chosen: boolean) => void
}

export function projectOf(place: ComposerPlace): ProjectId | undefined {
  return place.kind === 'HOME' ? place.projectId : (place.conversation.projectId ?? undefined)
}

/** The switches of the conversation's tools: one per connection the place offers, searchable from `SEARCH_FROM`; a connection being changed waits. */
function ToolSwitches(props: { place: ComposerPlace; choice: Choice }) {
  const { offered } = props.choice
  const catalog = useConnectorCatalog(props.place.companyId)
  const [query, setQuery] = useState('')
  if (offered === undefined)
    return (
      <p role="status" className="px-sm py-xs text-text-2">
        {READING_TOOLS}
      </p>
    )
  if (offered.length === 0)
    return (
      <p className="px-sm py-xs text-text-2">
        {projectOf(props.place) === undefined ? NO_TOOLS_COMPANY : LINK_TOOLS_PROJECT}
      </p>
    )
  function label(one: SessionConnection): string {
    return `${catalog.name(one.connector)} · ${one.name}`
  }
  const shown = offered.filter((one) => matches(label(one), query))
  return (
    <>
      {offered.length >= SEARCH_FROM && (
        <Search label={TOOLS_SEARCH} value={query} onChange={setQuery} />
      )}
      <ul className={LIST}>
        {shown.map((one) => (
          <li key={one.connectionId} className={cn(ROW, 'justify-between')}>
            <label
              htmlFor={`connection-${one.connectionId}`}
              className="flex min-w-0 items-center gap-sm"
            >
              <Logo logo={catalog.logo(one.connector)} />
              <span className="truncate">{label(one)}</span>
            </label>
            <Switch
              id={`connection-${one.connectionId}`}
              checked={one.chosen}
              disabled={props.choice.busy}
              onCheckedChange={(next) => props.choice.onToggle(one.connectionId, next)}
            />
          </li>
        ))}
      </ul>
      {shown.length === 0 && <p className="px-sm py-xs text-text-2">{NO_TOOL_MATCH}</p>}
    </>
  )
}

/** The connector's logo plate, or its empty place before the catalog is read. */
export function Logo({ logo }: { logo: string | undefined }) {
  return logo === undefined ? (
    <span className="size-5 shrink-0" />
  ) : (
    <ConnectorLogo small entry={{ logo }} />
  )
}

/** Where to link another system: Integrações, or a Projeto's own. */
function Another({ words }: { words: string }) {
  return (
    <>
      <PlusIcon aria-hidden="true" className="size-4" />
      {words}
    </>
  )
}

function LinkAnother({ place }: { place: ComposerPlace }) {
  const projectId = projectOf(place)
  return projectId === undefined ? (
    <Link
      to="/companies/$companyId/integrations"
      params={{ companyId: place.companyId }}
      className={ROW}
    >
      <Another words={LINK_ANOTHER_TOOL} />
    </Link>
  ) : (
    <Link
      to="/companies/$companyId/projects/$projectId/integrations"
      params={{ companyId: place.companyId, projectId }}
      className={ROW}
    >
      <Another words={RELEASE_ANOTHER_TOOL} />
    </Link>
  )
}

/** What the "+" menu holds: the file, the tools' switches and the way to link another one. */
function PlusMenuBody(props: { place: ComposerPlace; choice: Choice; onAttach: () => void }) {
  const { offered } = props.choice
  return (
    <div className="flex flex-col gap-xs">
      <button type="button" className={cn(ROW, 'justify-between')} onClick={props.onAttach}>
        <span className="flex items-center gap-sm">
          <PaperclipIcon aria-hidden="true" className="size-4 text-text-2" />
          {ATTACH_FILE}
        </span>
        <span className="text-fact text-text-2">{ATTACH_HINT}</span>
      </button>
      <div className="flex items-center justify-between border-t border-line px-sm pt-sm text-fact text-text-2">
        <span>{TOOLS_LIST}</span>
        {offered !== undefined && offered.length > 0 && (
          <span>{chosenOf(offered.filter((one) => one.chosen).length, offered.length)}</span>
        )}
      </div>
      <ToolSwitches place={props.place} choice={props.choice} />
      <div className="border-t border-line pt-xs">
        <LinkAnother place={props.place} />
      </div>
    </div>
  )
}

/** **+**: a menu from 768 px, a sheet from below under it (design V30). */
export function PlusMenu(props: {
  place: ComposerPlace
  choice: Choice
  open: boolean
  onOpenChange: (open: boolean) => void
  pickFiles: () => void
}) {
  const phone = useIsMobile()
  const trigger = cn(buttonVariants({ variant: 'ghost', size: 'icon' }), COMPOSER_SOFT)
  const icon = <PlusIcon aria-hidden="true" />
  const body = (
    <PlusMenuBody
      place={props.place}
      choice={props.choice}
      onAttach={() => {
        props.onOpenChange(false)
        props.pickFiles()
      }}
    />
  )
  return phone ? (
    <Drawer open={props.open} onOpenChange={props.onOpenChange}>
      <DrawerTrigger aria-label={PLUS_MENU} className={trigger}>
        {icon}
      </DrawerTrigger>
      <DrawerContent title={PLUS_MENU}>{body}</DrawerContent>
    </Drawer>
  ) : (
    <Popover open={props.open} onOpenChange={props.onOpenChange}>
      <PopoverTrigger aria-label={PLUS_MENU} className={trigger}>
        {icon}
      </PopoverTrigger>
      <PopoverContent side="top" align="start" aria-label={PLUS_MENU} className="w-80 gap-0 p-xs">
        {body}
      </PopoverContent>
    </Popover>
  )
}
