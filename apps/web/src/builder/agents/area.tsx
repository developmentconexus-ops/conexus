import type { AgentListed, CompanyId, Effort, ModelId, ProjectId } from '@conexus/hub-api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { BotIcon } from 'lucide-react'
import { useState } from 'react'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import { HubFailure, sentenceOf, writeFailureText } from '../../platform/hub.ts'
import { Block, BlockSentence, blockRow } from '../../ui/block.tsx'
import { cn } from '../../ui/cn.ts'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import {
  agentRoom,
  RoomContext,
  START_COLUMN,
  StartBox,
  StartWithoutAccount,
  stashHandoffFiles,
  toolsText,
  useDraft,
  usePicked,
} from '../conversation/public.ts'
import { AreaFrame } from './area-frame.tsx'
import { agentsQuery, construtorConversationsQuery, sendConstrutorConversation } from './queries.ts'
import { ConversationLine, StateStamp } from './rows.tsx'
import {
  AREA_TITLE,
  CONSTRUTOR_EXAMPLES,
  CONSTRUTOR_FIRST,
  CONSTRUTOR_NAME,
  CONSTRUTOR_PLACEHOLDER,
  MEMBERS_CANNOT,
  NO_AGENTS,
  NO_CONSTRUTOR_CONVERSATIONS,
  UNCONFIRMED_CREATION,
} from './text.ts'

const company = getRouteApi('/_app/companies/$companyId')
type Scope = { companyId: CompanyId; projectId: ProjectId }

/** The box that begins a conversation with the Construtor in this Projeto; the question goes with the conversation it opens. */
function Ask({ companyId, projectId }: Scope) {
  const { picked, setPicked, providers } = usePicked(companyId)
  if (picked === null) return <StartWithoutAccount companyId={companyId} />
  return <AskBox {...{ companyId, projectId, picked, providers }} onPick={setPicked} />
}

function AskBox(
  props: Scope & {
    picked: { model: ModelId; effort: Effort }
    onPick: (picked: { model: ModelId; effort: Effort }) => void
    providers: ReturnType<typeof usePicked>['providers']
  },
) {
  const { companyId, projectId, picked } = props
  const draft = useDraft(`construtor:${projectId}`)
  const navigate = useNavigate()
  const create = useMutation(sendConstrutorConversation)
  const attempt = useAttemptKey()
  const [error, setError] = useState<unknown>()
  // The Hub, too, can find no account for the person's model: the same notice, with the way to the accounts.
  const noAccount = error instanceof HubFailure && error.code === 'MODEL_NO_ACCOUNT'
  if (noAccount) return <StartWithoutAccount companyId={companyId} />

  async function begin(question: {
    content: string
    files: Parameters<typeof stashHandoffFiles>[1]
  }) {
    setError(undefined)
    try {
      const { conversation } = await attempt((attemptKey) =>
        create.mutateAsync({ params: { companyId, projectId }, body: picked, attemptKey }),
      )
      stashHandoffFiles(conversation.id, question.files)
      await navigate({
        to: '/companies/$companyId/projects/$projectId/agents/construtor/$conversationId',
        params: { companyId, projectId, conversationId: conversation.id },
        state: { handoff: { conversationId: conversation.id, content: question.content } },
      })
      return true
    } catch (failure) {
      setError(failure)
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
        picker={{ picked, onPick: props.onPick, providers: props.providers }}
        onSend={begin}
        notice={
          error !== undefined && (
            <p role="alert" className="text-danger">
              {writeFailureText(error, UNCONFIRMED_CREATION)}
            </p>
          )
        }
      />
    </RoomContext.Provider>
  )
}

function Earlier(scope: Scope) {
  const read = useQuery(construtorConversationsQuery(scope))
  const now = new Date()
  return (
    <Block title="Conversas com o Construtor">
      {read.isPending && <Skeleton className="h-16 w-full" />}
      {read.isError && (
        <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
      )}
      {read.data?.conversations.length === 0 && (
        <BlockSentence>{NO_CONSTRUTOR_CONVERSATIONS}</BlockSentence>
      )}
      <ul>
        {read.data?.conversations.map((conversation) => (
          <li key={conversation.id}>
            <Link
              to="/companies/$companyId/projects/$projectId/agents/construtor/$conversationId"
              params={{ ...scope, conversationId: conversation.id }}
              className={`${blockRow} hover:bg-surface-3`}
            >
              <ConversationLine conversation={conversation} now={now} />
            </Link>
          </li>
        ))}
      </ul>
    </Block>
  )
}

function AgentRow({ scope, agent }: { scope: Scope; agent: AgentListed }) {
  return (
    <li>
      <Link
        to="/companies/$companyId/projects/$projectId/agents/$agentId"
        params={{ ...scope, agentId: agent.id }}
        className={`${blockRow} hover:bg-surface-3`}
      >
        <BotIcon aria-hidden="true" className="size-4 shrink-0 text-text-2" />
        <span className="max-w-[45%] shrink-0 truncate">{agent.name}</span>
        <span className="hidden min-w-0 flex-1 truncate text-text-2 sm:inline">
          {agent.description}
        </span>
        <span className="ml-auto shrink-0 text-fact text-text-2">{toolsText(agent.tools)}</span>
        <StateStamp state={agent.state} />
      </Link>
    </li>
  )
}

function AgentList(scope: Scope) {
  const read = useQuery(agentsQuery(scope))
  const phone = useIsMobile()
  const rows = (
    <>
      {read.isPending && <Skeleton className="h-20 w-full" />}
      {read.isError && (
        <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
      )}
      {read.data?.agents.length === 0 && <BlockSentence>{NO_AGENTS}</BlockSentence>}
      <ul>
        {read.data?.agents.map((agent) => (
          <AgentRow key={agent.id} scope={scope} agent={agent} />
        ))}
      </ul>
    </>
  )
  // On a phone the page's own title sits right above, so the block does not say it a second time.
  return phone ? (
    <section aria-label={AREA_TITLE} className="flex min-w-0 flex-col">
      {rows}
    </section>
  ) : (
    <Block title={AREA_TITLE}>{rows}</Block>
  )
}

/**
 * **Agentes** of a Projeto (step 24.3, U5, criterion 26, the founder's 2A and the prototype's one
 * column): the box that begins a conversation with the Construtor, the Projeto's agents with what
 * each does, its tools and its state, and the earlier conversations. The Hub refuses a member's
 * read, so the route does not open for them (S10); the sentence below is for a role that changed.
 */
export function AgentsArea(props: Scope) {
  const { role } = company.useRouteContext()
  const scope = { companyId: props.companyId, projectId: props.projectId }
  if (role === 'member') return <p className="p-xl text-text-2">{MEMBERS_CANNOT}</p>
  return (
    <AreaFrame scope={scope} tab="agentes">
      <div className={cn(START_COLUMN, 'gap-lg')}>
        <Ask {...scope} />
        <AgentList {...scope} />
        <Earlier {...scope} />
      </div>
    </AreaFrame>
  )
}
