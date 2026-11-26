import type { CompanyId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import { buttonVariants } from '../../ui/button.tsx'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuSkeleton,
} from '../../ui/sidebar.tsx'
import { ConversationRow } from './conversation-row.tsx'
import { assistantConversationsQuery } from './queries.ts'
import { NEW_CONVERSATION, RECENT } from './text.ts'

/** The most conversations "Recentes" lists; the whole list is the Conversas page. */
const SHOWN = 8

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

/**
 * "Recentes" (web W30): the person's last conversations, newest first, each opening its own. It
 * reads the first page Início's "Continuar" reads; with none, or when the read fails, the group
 * is not drawn.
 */
export function SidebarConversations({ companyId }: { companyId: CompanyId }) {
  const read = useQuery(assistantConversationsQuery(companyId, undefined, undefined))
  if (read.isError || read.data?.conversations.length === 0) return null
  const now = new Date()
  return (
    <SidebarGroup aria-label={RECENT} className="gap-xs px-0">
      <SidebarGroupLabel>{RECENT}</SidebarGroupLabel>
      <SidebarMenu>
        {read.isPending ? (
          <>
            <SidebarMenuSkeleton />
            <SidebarMenuSkeleton />
            <SidebarMenuSkeleton />
          </>
        ) : (
          read.data.conversations
            .slice(0, SHOWN)
            .map((conversation) => (
              <ConversationRow
                key={conversation.id}
                companyId={companyId}
                conversation={conversation}
                now={now}
              />
            ))
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
