import type { AssistantConversationSummary, CompanyId } from '@conexus/hub-api'
import { ASSISTANT_CONTROLLER } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import type { ConversationActions } from '../../harness/room/public.ts'
import { ConversationMenu, titleOf, useRenameConversation } from '../../harness/room/public.ts'
import { ageOf } from '../../platform/dates.ts'
import { HubFailure } from '../../platform/hub.ts'
import { SidebarMenuButton, SidebarMenuItem } from '../../ui/sidebar.tsx'
import { sendAssistantDeletion } from './queries.ts'

type Answer = { resolve: () => void; reject: (error: unknown) => void }

function useAssistantActions(
  companyId: CompanyId,
  conversation: AssistantConversationSummary,
): ConversationActions {
  const navigate = useNavigate()
  const openId = useParams({ strict: false, select: (params) => params.conversationId })
  const params = { companyId, conversationId: conversation.id }
  const renameOf = useRenameConversation(ASSISTANT_CONTROLLER)
  // The menu closes and the open conversation goes to a new one on the Hub's answer, in the
  // mutation's own callbacks: they run ahead of the cache's `onSettled`, which waits for the list
  // to reload, and whose reload would show the deleted one "not found".
  function leave() {
    if (openId === conversation.id) {
      return navigate({ to: '/companies/$companyId', params: { companyId } })
    }
    return undefined
  }
  const removal = useMutation({
    mutationKey: sendAssistantDeletion.mutationKey,
    mutationFn: (_answer: Answer) => sendAssistantDeletion.mutationFn({ params }),
    onSuccess: async (_deleted, answer) => {
      answer.resolve()
      await leave()
    },
    onError: async (error, answer) => {
      answer.reject(error)
      if (error instanceof HubFailure && error.code === 'CONVERSATION_NOT_FOUND') await leave()
    },
  })
  return {
    rename: renameOf(conversation.id),
    remove: () => new Promise<void>((resolve, reject) => removal.mutate({ resolve, reject })),
  }
}

export function ConversationRow(props: {
  companyId: CompanyId
  conversation: AssistantConversationSummary
  now: Date
  /** The Projeto's own group already names it, so its rows do not. */
  inProject?: boolean
}) {
  const { companyId, conversation } = props
  const actions = useAssistantActions(companyId, conversation)
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
      <ConversationMenu title={titleOf(conversation)} actions={actions} />
    </SidebarMenuItem>
  )
}
