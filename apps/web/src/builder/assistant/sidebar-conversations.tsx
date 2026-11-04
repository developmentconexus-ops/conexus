import type { CompanyId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { PlusIcon, SearchIcon } from 'lucide-react'
import { useState } from 'react'
import type { DayGroup } from '../../platform/dates.ts'
import { dayGroupOf } from '../../platform/dates.ts'
import { sentenceOf } from '../../platform/hub.ts'
import { Button, buttonVariants } from '../../ui/button.tsx'
import { InputGroup, InputGroupInput } from '../../ui/input-group.tsx'
import { Pager } from '../../ui/pager.tsx'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuSkeleton,
} from '../../ui/sidebar.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs.tsx'
import { ConversationRow } from './conversation-row.tsx'
import type { ListView } from './list-view.ts'
import { narrowedBy, viewOf } from './list-view.ts'
import { PlaceFilter, PlaceLabel } from './place-filter.tsx'
import { ProjectsTab } from './projects-tab.tsx'
import { assistantConversationsQuery } from './queries.ts'
import {
  DAY_GROUP_LABELS,
  NEW_CONVERSATION,
  NO_CONVERSATION_FOUND,
  PROJECTS_TAB,
  RECENT_TAB,
  SEARCH_CONVERSATIONS,
  SEARCH_LABEL,
} from './text.ts'

const GROUPS: readonly DayGroup[] = ['TODAY', 'YESTERDAY', 'WEEK', 'BEFORE']

/** "Nova conversa", the list's first line: a new conversation begins on Início. */
export function NewConversation({ companyId }: { companyId: CompanyId }) {
  return (
    <Link
      to="/companies/$companyId"
      params={{ companyId }}
      activeOptions={{ exact: true }}
      className={`${buttonVariants()} w-full justify-start`}
    >
      <PlusIcon aria-hidden="true" />
      {NEW_CONVERSATION}
    </Link>
  )
}

/** The text in the address, replaced as the person types so Back does not walk through letters. */
function SearchBox({ q }: { q: string | undefined }) {
  const navigate = useNavigate()
  return (
    <InputGroup>
      <InputGroupInput
        autoFocus
        type="search"
        aria-label={SEARCH_LABEL}
        value={q ?? ''}
        onChange={(event) =>
          void navigate({
            to: '.',
            search: (old) => ({
              ...old,
              q: event.target.value || undefined,
              conversations: undefined,
            }),
            replace: true,
          })
        }
      />
    </InputGroup>
  )
}

function ViewTabs({ view }: { view: ListView }) {
  const navigate = useNavigate()
  return (
    <Tabs
      value={view.tab === 'PROJECTS' ? 'projects' : 'recent'}
      onValueChange={(value) =>
        void navigate({
          to: '.',
          search: (old) => ({
            ...old,
            tab: value === 'projects' ? 'projects' : undefined,
            conversations: undefined,
          }),
          replace: true,
        })
      }
    >
      <TabsList>
        <TabsTrigger value="recent">{RECENT_TAB}</TabsTrigger>
        <TabsTrigger value="projects">{PROJECTS_TAB}</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

function Recent({ companyId, view }: { companyId: CompanyId; view: ListView }) {
  const narrowed = narrowedBy(view.place)
  const read = useQuery(
    assistantConversationsQuery(companyId, narrowed.projectId, view.page, {
      q: view.q,
      place: narrowed.place,
    }),
  )
  if (read.isPending) {
    return (
      <>
        <SidebarMenuSkeleton />
        <SidebarMenuSkeleton />
        <SidebarMenuSkeleton />
      </>
    )
  }
  if (read.isError) {
    return <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
  }
  const { conversations, next } = read.data
  if (conversations.length === 0 && view.q !== undefined) {
    return <p className="px-sm text-fact text-text-2">{NO_CONVERSATION_FOUND}</p>
  }
  const now = new Date()
  return (
    <>
      {GROUPS.map((group) => {
        const rows = conversations.filter((one) => dayGroupOf(one.updatedAt, now) === group)
        if (rows.length === 0) return null
        return (
          <section key={group} aria-label={DAY_GROUP_LABELS[group]} className="flex flex-col">
            <h3
              data-slot="sidebar-day-label"
              className="flex h-row items-center px-sm text-eyebrow text-text-2"
            >
              {DAY_GROUP_LABELS[group]}
            </h3>
            <SidebarMenu>
              {rows.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  companyId={companyId}
                  conversation={conversation}
                  now={now}
                />
              ))}
            </SidebarMenu>
          </section>
        )
      })}
      <div className="px-sm">
        <Pager next={next} param="conversations" page={view.page} list="Conversas" />
      </div>
    </>
  )
}

/**
 * "Conversas" in the company's list (web W30): the person's conversations by day, newest first,
 * 30 to a page with the pager for the next ones, narrowed by a title text and a place, or grouped
 * by Projeto in the second tab; text, place, tab and page live in the address (web W18). With none
 * and nothing narrowing, only "Nova conversa" stays.
 */
export function SidebarConversations({ companyId }: { companyId: CompanyId }) {
  const view = useSearch({ strict: false, select: (search) => viewOf(search) })
  const [searching, setSearching] = useState(view.q !== undefined)
  const narrowed = narrowedBy(view.place)
  const first = useQuery(
    assistantConversationsQuery(companyId, narrowed.projectId, view.page, {
      q: view.q,
      place: narrowed.place,
    }),
  )
  const clean = view.q === undefined && view.place === undefined
  if (first.data?.conversations.length === 0 && clean && view.tab === undefined) return null
  return (
    <SidebarGroup aria-label="Conversas" className="gap-xs px-0">
      <div className="flex items-center justify-between">
        <SidebarGroupLabel>Conversas</SidebarGroupLabel>
        <div className="flex items-center gap-xs">
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            aria-label={SEARCH_CONVERSATIONS}
            aria-expanded={searching}
            onClick={() => setSearching(!searching)}
          >
            <SearchIcon aria-hidden="true" />
          </Button>
          <PlaceFilter companyId={companyId} place={view.place} />
        </div>
      </div>
      {searching && <SearchBox q={view.q} />}
      {view.place !== undefined && <PlaceLabel companyId={companyId} place={view.place} />}
      <ViewTabs view={view} />
      {view.tab === 'PROJECTS' ? (
        <ProjectsTab companyId={companyId} />
      ) : (
        <Recent companyId={companyId} view={view} />
      )}
    </SidebarGroup>
  )
}
