import type { ConversationSummary } from '@conexus/hub-api'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { keepsAttemptKey, useAttemptKey } from '../../platform/attempt-key.ts'
import { dayAndHour } from '../../platform/dates.ts'
import { sentenceOf } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { List, PageTitle, Row, rowBody } from '../../ui/list.tsx'
import { Pager } from '../../ui/pager.tsx'
import { Empty } from '../../ui/states.tsx'
import { conversationsQuery, sendCreation } from './queries.ts'
import { UNCONFIRMED_CREATION } from './text.ts'

const route = getRouteApi('/_app/companies/$companyId/projects/$projectId/conversations')

function ConversationRow(props: { conversation: ConversationSummary }) {
  const { companyId, projectId } = route.useParams()
  const { conversation } = props
  return (
    <Row>
      <Link
        to="/companies/$companyId/projects/$projectId/conversations/$conversationId"
        params={{ companyId, projectId, conversationId: conversation.id }}
        className={rowBody({ kind: 'link' })}
      >
        <span className="min-w-0 truncate">
          {conversation.title ?? dayAndHour(conversation.createdAt)}
        </span>
        {conversation.title !== null && (
          <span className="shrink-0 text-label text-text-2">
            {dayAndHour(conversation.createdAt)}
          </span>
        )}
      </Link>
    </Row>
  )
}

/** **Nova conversa**: the attempt key stays until the Hub settles the outcome (web W24). */
function NewConversation() {
  const { companyId, projectId } = route.useParams()
  const navigate = useNavigate()
  const create = useMutation(sendCreation)
  const attempt = useAttemptKey()
  const [error, setError] = useState<string>()

  async function start() {
    setError(undefined)
    try {
      const { conversation } = await attempt((attemptKey) =>
        create.mutateAsync({ params: { companyId, projectId }, body: {}, attemptKey }),
      )
      await navigate({
        to: '/companies/$companyId/projects/$projectId/conversations/$conversationId',
        params: { companyId, projectId, conversationId: conversation.id },
      })
    } catch (failure) {
      setError(keepsAttemptKey(failure) ? UNCONFIRMED_CREATION : sentenceOf(failure))
    }
  }

  return (
    <div className="flex flex-col items-start gap-sm">
      <Button variant="primary" disabled={create.isPending} onClick={() => void start()}>
        Nova conversa
      </Button>
      {error !== undefined && <p role="alert">{error}</p>}
    </div>
  )
}

/** The person's own conversations of a Projeto, 50 a page, the page in the address (web W18). */
export function Conversations() {
  const { companyId, projectId } = route.useParams()
  const { page } = route.useSearch()
  const { data } = useSuspenseQuery(conversationsQuery(companyId, projectId, page))
  return (
    <div className="flex flex-col gap-xl">
      <PageTitle>Conversas</PageTitle>
      <NewConversation />
      {data.conversations.length === 0 ? (
        <Empty>Nenhuma conversa</Empty>
      ) : (
        <List>
          {data.conversations.map((conversation) => (
            <ConversationRow key={conversation.id} conversation={conversation} />
          ))}
        </List>
      )}
      <Pager next={data.next} param="page" page={page} list="conversas" />
    </div>
  )
}
