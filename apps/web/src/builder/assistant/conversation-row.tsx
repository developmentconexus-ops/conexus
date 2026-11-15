import type { AssistantConversationSummary, CompanyId } from '@conexus/hub-api'
import { Link } from '@tanstack/react-router'
import { ageOf } from '../../platform/dates.ts'
import { SidebarMenuButton, SidebarMenuItem } from '../../ui/sidebar.tsx'
import { titleOf } from '../conversation/public.ts'
import { ConversationMenu } from './conversation-menu.tsx'

export function ConversationRow(props: {
  companyId: CompanyId
  conversation: AssistantConversationSummary
  now: Date
  /** The Projeto's own group already names it, so its rows do not. */
  inProject?: boolean
}) {
  const { companyId, conversation } = props
  const content = (
    <>
      <span className="flex min-w-0 flex-1 items-baseline gap-sm">
        <span className="truncate">{titleOf(conversation)}</span>
        {conversation.project !== null && props.inProject !== true && (
          <span className="min-w-0 shrink-[3] truncate text-fact text-text-2">
            {conversation.project.name}
          </span>
        )}
      </span>
      <span className="shrink-0 text-fact tabular-nums text-text-2 group-focus-within/menu-item:opacity-0 group-hover/menu-item:opacity-0 pointer-coarse:group-focus-within/menu-item:opacity-100 pointer-coarse:group-hover/menu-item:opacity-100">
        {ageOf(conversation.updatedAt, props.now)}
      </span>
    </>
  )
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className="pointer-coarse:pr-9"
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
      <ConversationMenu companyId={companyId} conversation={conversation} />
    </SidebarMenuItem>
  )
}
