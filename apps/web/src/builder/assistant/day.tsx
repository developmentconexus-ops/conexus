import type { CompanyId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { connectionsQuery, stateBadge } from '../../hub/connectors/public.ts'
import { ProjectsBlock } from '../../hub/projects/public.ts'
import { ageOf } from '../../platform/dates.ts'
import { sentenceOf } from '../../platform/hub.ts'
import { BLOCK_ROWS, Block, BlockSentence, blockRow, Stamp } from '../../ui/block.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { AutomationBadge } from '../automations/public.ts'
import { assistantConversationsQuery } from './queries.ts'
import {
  CONNECTIONS_BLOCK,
  CONTINUE_BLOCK,
  INTEGRATIONS_LINK,
  moreConnections,
  NO_CONNECTIONS_BLOCK,
  NO_CONVERSATIONS_BLOCK,
  titleOf,
} from './text.ts'

function ContinueRows({ companyId }: { companyId: CompanyId }) {
  const read = useQuery(assistantConversationsQuery(companyId, undefined, undefined))
  if (read.isPending) return <Skeleton className="h-24 w-full" />
  if (read.isError)
    return <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
  const { conversations } = read.data
  if (conversations.length === 0) return <BlockSentence>{NO_CONVERSATIONS_BLOCK}</BlockSentence>
  const now = new Date()
  return (
    <ul>
      {conversations.slice(0, BLOCK_ROWS).map((conversation) => {
        const content = (
          <>
            <span className="min-w-0 flex-auto truncate">{titleOf(conversation)}</span>
            {conversation.project !== null && (
              <span className="min-w-0 shrink truncate text-fact text-text-2">
                {conversation.project.name}
              </span>
            )}
            {conversation.automation !== null && (
              <AutomationBadge name={conversation.automation.name} />
            )}
            <span className="shrink-0 text-fact tabular-nums text-text-2">
              {ageOf(conversation.updatedAt, now)}
            </span>
          </>
        )
        return (
          <li key={conversation.id}>
            {conversation.project === null ? (
              <Link
                to="/companies/$companyId/conversations/$conversationId"
                params={{ companyId, conversationId: conversation.id }}
                className={`${blockRow} hover:bg-surface-3`}
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
                className={`${blockRow} hover:bg-surface-3`}
              >
                {content}
              </Link>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function ConnectionRows({ companyId }: { companyId: CompanyId }) {
  const read = useQuery(connectionsQuery(companyId))
  if (read.isPending) return <Skeleton className="h-24 w-full" />
  if (read.isError)
    return <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
  const { connections, connectors } = read.data
  if (connections.length === 0) return <BlockSentence>{NO_CONNECTIONS_BLOCK}</BlockSentence>
  const hidden = connections.length - BLOCK_ROWS
  return (
    <ul>
      {connections.slice(0, BLOCK_ROWS).map((connection) => {
        const auth = connectors.find((entry) => entry.id === connection.connector)?.auth
        const badge = auth === undefined ? null : stateBadge(connection, auth)
        return (
          <li key={connection.id}>
            <Link
              to="/companies/$companyId/integrations/$connectionId"
              params={{ companyId, connectionId: connection.id }}
              className={`${blockRow} hover:bg-surface-3`}
            >
              <span className="min-w-0 flex-1 truncate">{connection.name}</span>
              {badge !== null && <Stamp tone={badge.tone}>{badge.text}</Stamp>}
            </Link>
          </li>
        )
      })}
      {hidden > 0 && (
        <li>
          <Link
            to="/companies/$companyId/integrations"
            params={{ companyId }}
            className={`${blockRow} text-text-2 hover:bg-surface-3`}
          >
            {moreConnections(hidden)}
          </Link>
        </li>
      )}
    </ul>
  )
}

/**
 * What Início of an owner or an administrator holds under the box (step 13.3, U3): Continuar, the
 * five latest conversations, then Projetos beside Ligações, each state in words, on the one axis.
 */
export function AssistantDay({ companyId }: { companyId: CompanyId }) {
  return (
    <div className="flex flex-col gap-3xl">
      <Block title={CONTINUE_BLOCK}>
        <ContinueRows companyId={companyId} />
      </Block>
      <div className="grid gap-3xl min-[768px]:grid-cols-2 min-[768px]:gap-lg">
        <ProjectsBlock companyId={companyId} creates />
        <Block
          title={CONNECTIONS_BLOCK}
          action={
            <Link
              to="/companies/$companyId/integrations"
              params={{ companyId }}
              className="text-label text-text-2 hover:text-text"
            >
              {INTEGRATIONS_LINK}
            </Link>
          }
        >
          <ConnectionRows companyId={companyId} />
        </Block>
      </div>
    </div>
  )
}
