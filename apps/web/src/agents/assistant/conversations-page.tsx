import type { CompanyId } from '@conexus/hub-api'
import { CONVERSATION_SEARCH_MAX, listAssistantConversations } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'
import type { DayGroup } from '../../platform/dates.ts'
import { dayGroupOf } from '../../platform/dates.ts'
import { sentenceOf } from '../../platform/hub.ts'
import { BlockSentence } from '../../ui/block.tsx'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../ui/input-group.tsx'
import { PageTitle } from '../../ui/list.tsx'
import { Pager } from '../../ui/pager.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs.tsx'
import { ConversationLine } from './conversation-row.tsx'
import type { ListView } from './list-view.ts'
import { narrowedBy, viewOf } from './list-view.ts'
import { PlaceFilter, PlaceLabel } from './place-filter.tsx'
import { ProjectsTab } from './projects-tab.tsx'
import { assistantConversationsQuery } from './queries.ts'
import {
  CONVERSATIONS_TITLE,
  DAY_GROUP_LABELS,
  NO_CONVERSATION_FOUND,
  NO_CONVERSATION_IN_PLACE,
  NO_CONVERSATIONS_BLOCK,
  PROJECTS_TAB,
  RECENT,
  SEARCH_LABEL,
} from './text.ts'

const route = getRouteApi('/_app/companies/$companyId/conversations/')

const GROUPS: readonly DayGroup[] = ['TODAY', 'YESTERDAY', 'WEEK', 'BEFORE']

/** What the address of Conversas may carry (web W18); `viewOf` leaves out a part the Hub would refuse. */
export const ConversationsSearch = z.object({
  conversations: listAssistantConversations.input.query.shape.page,
  q: z.string().optional(),
  place: z.string().optional(),
  tab: z.literal('projects').optional(),
})

/** The box keeps what was typed, spaces included; the address and the list read it as the Hub does. */
function SearchBox({ q }: { q: string | undefined }) {
  const [typed, setTyped] = useState(q ?? '')
  const navigate = useNavigate()
  return (
    <InputGroup className="min-w-0 flex-1">
      <InputGroupAddon>
        <SearchIcon aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        aria-label={SEARCH_LABEL}
        placeholder={SEARCH_LABEL}
        maxLength={CONVERSATION_SEARCH_MAX}
        className="[&::-webkit-search-cancel-button]:appearance-none"
        value={typed}
        onChange={(event) => {
          setTyped(event.target.value)
          // Replaced as the person types, so Back does not walk through letters.
          void navigate({
            to: '.',
            search: (old) => ({
              ...old,
              q: event.target.value || undefined,
              conversations: undefined,
            }),
            replace: true,
          })
        }}
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
        <TabsTrigger value="recent">{RECENT}</TabsTrigger>
        <TabsTrigger value="projects">{PROJECTS_TAB}</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

function ByDay({ companyId, view }: { companyId: CompanyId; view: ListView }) {
  const narrowed = narrowedBy(view.place)
  const read = useQuery(
    assistantConversationsQuery(companyId, narrowed.projectId, view.page, {
      q: view.q,
      place: narrowed.place,
    }),
  )
  if (read.isPending) {
    return (
      <div role="status" aria-label="Carregando" className="flex flex-col gap-sm">
        <Skeleton className="h-row w-full" />
        <Skeleton className="h-row w-full" />
        <Skeleton className="h-row w-full" />
      </div>
    )
  }
  if (read.isError) {
    return <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
  }
  const { conversations, next } = read.data
  if (conversations.length === 0) {
    if (view.q !== undefined) return <BlockSentence>{NO_CONVERSATION_FOUND}</BlockSentence>
    if (view.place !== undefined) return <BlockSentence>{NO_CONVERSATION_IN_PLACE}</BlockSentence>
    return <BlockSentence>{NO_CONVERSATIONS_BLOCK}</BlockSentence>
  }
  const now = new Date()
  return (
    <>
      {GROUPS.map((group) => {
        const rows = conversations.filter((one) => dayGroupOf(one.updatedAt, now) === group)
        if (rows.length === 0) return null
        return (
          <section key={group} aria-label={DAY_GROUP_LABELS[group]} className="flex flex-col">
            <h2
              data-slot="day-label"
              className="flex h-row items-center px-sm font-body text-eyebrow text-text-2"
            >
              {DAY_GROUP_LABELS[group]}
            </h2>
            <ul>
              {rows.map((conversation) => (
                <ConversationLine
                  key={conversation.id}
                  companyId={companyId}
                  conversation={conversation}
                  now={now}
                  menu
                />
              ))}
            </ul>
          </section>
        )
      })}
      <div className="px-sm">
        <Pager next={next} param="conversations" page={view.page} list={CONVERSATIONS_TITLE} />
      </div>
    </>
  )
}

/**
 * Conversas (web W30): the person's conversations by day, newest first, 30 to a page with the pager
 * for the next ones, narrowed by a title text and a place, or grouped by Projeto in the second tab.
 * Text, place, tab and page live in the address (web W18). "Nova conversa" is the sidebar's.
 */
export function ConversationsPage({ companyId }: { companyId: CompanyId }) {
  const view = route.useSearch({ select: viewOf })
  const byProject = view.tab === 'PROJECTS'
  return (
    <div className="axis flex flex-col gap-lg pb-2xl">
      <PageTitle>{CONVERSATIONS_TITLE}</PageTitle>
      <div className="flex flex-col gap-sm">
        <div className="flex items-center gap-sm">
          <SearchBox q={view.q} />
          {!byProject && <PlaceFilter companyId={companyId} place={view.place} />}
        </div>
        {view.place !== undefined && !byProject && (
          <PlaceLabel companyId={companyId} place={view.place} />
        )}
      </div>
      <ViewTabs view={view} />
      <section aria-label={CONVERSATIONS_TITLE} className="flex flex-col gap-md">
        {byProject ? (
          <ProjectsTab companyId={companyId} q={view.q} />
        ) : (
          <ByDay companyId={companyId} view={view} />
        )}
      </section>
    </div>
  )
}
