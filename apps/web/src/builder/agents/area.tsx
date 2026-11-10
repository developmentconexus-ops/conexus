import type { CompanyId, Effort, ModelId, ProjectId } from '@conexus/hub-api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import { HubFailure, sentenceOf, writeFailureText } from '../../platform/hub.ts'
import { Block, BlockSentence, blockRow } from '../../ui/block.tsx'
import { cn } from '../../ui/cn.ts'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import {
  agentRoom,
  RoomContext,
  START_COLUMN,
  StartBox,
  StartWithoutAccount,
  stashHandoffFiles,
  UNCONFIRMED_CREATION,
  useDraft,
  usePicked,
} from '../conversation/public.ts'
import { AgentList } from './agent-list.tsx'
import { AreaFrame } from './area-frame.tsx'
import { construtorConversationsQuery, sendConstrutorConversation } from './queries.ts'
import { ConversationLine } from './rows.tsx'
import {
  CONSTRUTOR_EXAMPLES,
  CONSTRUTOR_FIRST,
  CONSTRUTOR_NAME,
  CONSTRUTOR_PLACEHOLDER,
  MEMBERS_CANNOT,
  NO_CONSTRUTOR_CONVERSATIONS,
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

/**
 * **Agentes** of a Projeto (step 24.3, U5, criterion 26, the founder's 2A and the prototype's one
 * column): the box that begins a conversation with the Construtor, the Projeto's agents with what
 * each does, its tools and its state, and the earlier conversations. The Hub refuses a read to whoever may not
 * manage agents, so the route does not open for them (S10); the sentence below is for a role that changed.
 */
export function AgentsArea(props: Scope) {
  const { may } = company.useRouteContext()
  const scope = { companyId: props.companyId, projectId: props.projectId }
  if (!may.manageAgents) return <p className="p-xl text-text-2">{MEMBERS_CANNOT}</p>
  return (
    <AreaFrame scope={scope} tab="agentes">
      <div className={cn(START_COLUMN, 'gap-lg')}>
        <Ask {...scope} />
        <AgentList companyId={scope.companyId} projectId={scope.projectId} />
        <Earlier {...scope} />
      </div>
    </AreaFrame>
  )
}
