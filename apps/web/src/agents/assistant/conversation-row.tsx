import type { AssistantConversationSummary, CompanyId } from '@conexus/hub-api'
import { ASSISTANT_CONTROLLER } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import type { ConversationActions } from '../../harness/room/public.ts'
import { ConversationMenu, titleOf, useRenameConversation } from '../../harness/room/public.ts'
import { ageOf } from '../../platform/dates.ts'
import { HubFailure } from '../../platform/hub.ts'
import { blockRow } from '../../ui/block.tsx'
import { cn } from '../../ui/cn.ts'
import { SidebarMenuButton, SidebarMenuItem } from '../../ui/sidebar.tsx'
import { AutomationBadge } from './automations/badge.tsx'
import { sendAssistantDeletion } from './queries.ts'

/** The age gives its place to the row's menu while the pointer or the focus is on the row; on touch both show. */
const AGE_UNDER_MENU =
  'group-focus-within/menu-item:opacity-0 group-hover/menu-item:opacity-0 pointer-coarse:group-focus-within/menu-item:opacity-100 pointer-coarse:group-hover/menu-item:opacity-100'

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

/** The row's Renomear and Apagar, over its end: the one menu of a conversation in a list. */
function RowMenu(props: { companyId: CompanyId; conversation: AssistantConversationSummary }) {
  const actions = useAssistantActions(props.companyId, props.conversation)
  return <ConversationMenu title={titleOf(props.conversation)} actions={actions} />
}

/**
 * A conversation as a row of the sheet (Continuar, the Conversas page): the title, where it was
 * born and its age, on the list row. With `menu`, the row's actions sit over its end.
 */
export function ConversationLine(props: {
  companyId: CompanyId
  conversation: AssistantConversationSummary
  now: Date
  menu?: true
  /** The Projeto's own group already names it, so its rows do not. */
  inProject?: true
}) {
  const { companyId, conversation } = props
  const className = cn(blockRow, 'hover:bg-surface-3', props.menu && 'pointer-coarse:pr-11')
  const content = (
    <>
      <span className="min-w-0 flex-auto truncate">{titleOf(conversation)}</span>
      {conversation.project !== null && props.inProject !== true && (
        <span className="min-w-0 shrink truncate text-fact text-text-2">
          {conversation.project.name}
        </span>
      )}
      {conversation.automation !== null && <AutomationBadge name={conversation.automation.name} />}
      <span
        className={cn('shrink-0 text-fact tabular-nums text-text-2', props.menu && AGE_UNDER_MENU)}
      >
        {ageOf(conversation.updatedAt, props.now)}
      </span>
    </>
  )
  return (
    <li className="group/menu-item relative">
      {conversation.project === null ? (
        <Link
          to="/companies/$companyId/conversations/$conversationId"
          params={{ companyId, conversationId: conversation.id }}
          className={className}
        >
          {content}
        </Link>
      ) : (
        <Link
          to="/companies/$companyId/projects/$projectId/assistant/$conversationId"
          params={{
            companyId,
            projectId: conversation.project.id,
            conversationId: conversation.id,
          }}
          className={className}
        >
          {content}
        </Link>
      )}
      {props.menu && <RowMenu companyId={companyId} conversation={conversation} />}
    </li>
  )
}

export function ConversationRow(props: {
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
      <span className={cn('shrink-0 text-fact tabular-nums text-text-2', AGE_UNDER_MENU)}>
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
      <RowMenu companyId={companyId} conversation={conversation} />
    </SidebarMenuItem>
  )
}
