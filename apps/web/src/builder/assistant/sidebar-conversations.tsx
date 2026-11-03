import type { AssistantConversationSummary, CompanyId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearch } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import type { DayGroup } from '../../platform/dates.ts'
import { ageOf, dayGroupOf } from '../../platform/dates.ts'
import { sentenceOf } from '../../platform/hub.ts'
import { buttonVariants } from '../../ui/button.tsx'
import { Pager } from '../../ui/pager.tsx'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from '../../ui/sidebar.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { assistantConversationsQuery } from './queries.ts'
import { DAY_GROUP_LABELS, NEW_CONVERSATION, titleOf } from './text.ts'

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

function ConversationRow(props: {
  companyId: CompanyId
  conversation: AssistantConversationSummary
  now: Date
}) {
  const { companyId, conversation } = props
  const content = (
    <>
      <span className="flex min-w-0 flex-1 items-baseline gap-sm">
        <span className="truncate">{titleOf(conversation)}</span>
        {conversation.project !== null && (
          <span className="min-w-0 shrink-[3] truncate text-fact text-text-2">
            {conversation.project.name}
          </span>
        )}
      </span>
      <span className="shrink-0 text-fact tabular-nums text-text-2">
        {ageOf(conversation.updatedAt, props.now)}
      </span>
    </>
  )
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={
          conversation.project === null ? (
            <Link
              to="/companies/$companyId/conversations/$conversationId"
              params={{ companyId, conversationId: conversation.id }}
            />
          ) : (
            <Link
              to="/companies/$companyId/projects/$projectId/assistant/$conversationId"
              params={{
                companyId,
                projectId: conversation.project.id,
                conversationId: conversation.id,
              }}
            />
          )
        }
      >
        {content}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

/**
 * "Conversas" in the company's list (web W30): the person's conversations by day, newest first,
 * the first page of 50 and the pager for the next ones. With none, only "Nova conversa" stays.
 */
export function SidebarConversations({ companyId }: { companyId: CompanyId }) {
  const page = useSearch({
    strict: false,
    select: (search) =>
      typeof search.conversations === 'string' ? search.conversations : undefined,
  })
  const read = useQuery(assistantConversationsQuery(companyId, undefined, page))
  if (read.isPending) {
    return (
      <SidebarGroup aria-label="Conversas" className="px-0">
        <SidebarMenuSkeleton />
        <SidebarMenuSkeleton />
        <SidebarMenuSkeleton />
      </SidebarGroup>
    )
  }
  if (read.isError) {
    return (
      <SidebarGroup className="px-0">
        <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
      </SidebarGroup>
    )
  }
  const { conversations, next } = read.data
  if (conversations.length === 0) return null
  const now = new Date()
  return (
    <SidebarGroup className="gap-xs px-0">
      <SidebarGroupLabel>Conversas</SidebarGroupLabel>
      {GROUPS.map((group) => {
        const rows = conversations.filter((one) => dayGroupOf(one.updatedAt, now) === group)
        if (rows.length === 0) return null
        return (
          <section key={group} aria-label={DAY_GROUP_LABELS[group]} className="flex flex-col">
            <h3 className="flex h-row items-center px-sm text-eyebrow text-text-2">
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
        <Pager next={next} param="conversations" page={page} list="Conversas" />
      </div>
    </SidebarGroup>
  )
}
