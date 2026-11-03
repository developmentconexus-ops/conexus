import type { AgentSummary, CompanyId, ProjectId } from '@conexus/hub-api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import { sentenceOf, writeFailureText } from '../../platform/hub.ts'
import { cn } from '../../ui/cn.ts'
import { PageTitle } from '../../ui/list.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import {
  agentRoom,
  RoomContext,
  START_COLUMN,
  StartBox,
  StartWithoutAccount,
  stashHandoffFiles,
  useDraft,
  usePicked,
} from '../conversation/public.ts'
import { agentsQuery, construtorConversationsQuery, sendConstrutorConversation } from './queries.ts'
import {
  AREA_TITLE,
  CONSTRUTOR_EXAMPLES,
  CONSTRUTOR_FIRST,
  CONSTRUTOR_NAME,
  CONSTRUTOR_PLACEHOLDER,
  MEMBERS_CANNOT,
  NO_AGENTS,
  NO_CONSTRUTOR_CONVERSATIONS,
  stateText,
  titleOf,
  UNCONFIRMED_CREATION,
} from './text.ts'

const company = getRouteApi('/_app/companies/$companyId')
type Scope = { companyId: CompanyId; projectId: ProjectId }

/** The box that begins a conversation with the Construtor in this Projeto; the question goes with the conversation it opens. */
function Ask({ companyId, projectId }: Scope) {
  const { picked } = usePicked(companyId)
  const draft = useDraft(`construtor:${projectId}`)
  const navigate = useNavigate()
  const create = useMutation(sendConstrutorConversation)
  const attempt = useAttemptKey()
  const [error, setError] = useState<string>()
  if (picked === null) return <StartWithoutAccount companyId={companyId} />

  async function begin(question: {
    content: string
    files: Parameters<typeof stashHandoffFiles>[1]
  }) {
    setError(undefined)
    try {
      const { conversation } = await attempt((attemptKey) =>
        create.mutateAsync({ params: { companyId, projectId }, body: {}, attemptKey }),
      )
      stashHandoffFiles(conversation.id, question.files)
      await navigate({
        to: '/companies/$companyId/projects/$projectId/agents/construtor/$conversationId',
        params: { companyId, projectId, conversationId: conversation.id },
        state: { handoff: { conversationId: conversation.id, content: question.content } },
      })
      return true
    } catch (failure) {
      setError(writeFailureText(failure, UNCONFIRMED_CREATION))
      return false
    }
  }

  return (
    <RoomContext.Provider value={agentRoom(CONSTRUTOR_NAME)}>
      <p className="text-text-2">{CONSTRUTOR_FIRST}</p>
      <StartBox
        draft={draft}
        placeholder={CONSTRUTOR_PLACEHOLDER}
        examples={CONSTRUTOR_EXAMPLES}
        onSend={begin}
        bar={
          error !== undefined && (
            <p role="alert" className="text-danger">
              {error}
            </p>
          )
        }
      />
    </RoomContext.Provider>
  )
}

function Earlier(scope: Scope) {
  const read = useQuery(construtorConversationsQuery(scope))
  if (read.isPending) return <Skeleton className="h-16 w-full" />
  if (read.isError)
    return <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
  if (read.data.conversations.length === 0)
    return <p className="text-text-2">{NO_CONSTRUTOR_CONVERSATIONS}</p>
  return (
    <section aria-label="Conversas com o Construtor" className="flex flex-col gap-xs">
      <h2 className="font-display text-title">Conversas com o Construtor</h2>
      <ul className="flex flex-col">
        {read.data.conversations.map((conversation) => (
          <li key={conversation.id}>
            <Link
              to="/companies/$companyId/projects/$projectId/agents/construtor/$conversationId"
              params={{ ...scope, conversationId: conversation.id }}
              className="block truncate rounded-control px-sm py-xs hover:bg-surface-3"
            >
              {titleOf(conversation)}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function AgentRow({ scope, agent }: { scope: Scope; agent: AgentSummary }) {
  return (
    <li className="border-b border-line last:border-b-0">
      <Link
        to="/companies/$companyId/projects/$projectId/agents/$agentId"
        params={{ ...scope, agentId: agent.id }}
        className="flex flex-col gap-xs px-sm py-md hover:bg-surface-3"
      >
        <span className="flex items-center justify-between gap-sm">
          <span className="truncate font-display">{agent.name}</span>
          <span className="shrink-0 text-label text-text-2">{stateText(agent.state)}</span>
        </span>
        {agent.description !== '' && (
          <span className="line-clamp-2 break-words text-text-2">{agent.description}</span>
        )}
      </Link>
    </li>
  )
}

function AgentList(scope: Scope) {
  const read = useQuery(agentsQuery(scope))
  return (
    <section aria-label="Agentes do Projeto" className="flex flex-col gap-sm">
      <h2 className="font-display text-title">Agentes do Projeto</h2>
      {read.isPending && <Skeleton className="h-20 w-full" />}
      {read.isError && (
        <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
      )}
      {read.data?.agents.length === 0 && <p className="text-text-2">{NO_AGENTS}</p>}
      <ul className="flex flex-col border-y border-line">
        {read.data?.agents.map((agent) => (
          <AgentRow key={agent.id} scope={scope} agent={agent} />
        ))}
      </ul>
    </section>
  )
}

/**
 * **Agentes** of a Projeto (step 24.3, U5, criterion 26, the founder's 1A and 2A): the box that
 * begins a conversation with the Construtor, the earlier ones, and the Projeto's agents with their
 * state. On a phone the two are tabs, **Construtor** and **Agentes**. The Hub refuses a member's
 * read, so the route does not open for them (S10); the sentence below is for a role that changed.
 */
export function AgentsArea(props: Scope) {
  const { role } = company.useRouteContext()
  const phone = useIsMobile()
  const scope = { companyId: props.companyId, projectId: props.projectId }
  if (role === 'member') return <p className="p-xl text-text-2">{MEMBERS_CANNOT}</p>
  const construtor = (
    <div className={cn(START_COLUMN, 'gap-lg')}>
      <Ask {...scope} />
      <Earlier {...scope} />
    </div>
  )
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-page flex-1 flex-col gap-lg overflow-y-auto p-xl">
      <PageTitle>{AREA_TITLE}</PageTitle>
      {phone ? (
        <Tabs defaultValue="construtor">
          <TabsList>
            <TabsTrigger value="construtor">{CONSTRUTOR_NAME}</TabsTrigger>
            <TabsTrigger value="agentes">Agentes</TabsTrigger>
          </TabsList>
          <TabsContent value="construtor">{construtor}</TabsContent>
          <TabsContent value="agentes">
            <AgentList {...scope} />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)_22rem] items-start gap-xl">
          {construtor}
          <AgentList {...scope} />
        </div>
      )}
    </div>
  )
}
