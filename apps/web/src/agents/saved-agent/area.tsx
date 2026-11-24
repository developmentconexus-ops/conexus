import type { CompanyId, Effort, ModelId, ProjectId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import type { Outgoing } from '../../harness/room/public.ts'
import {
  agentWords,
  START_COLUMN,
  StartBox,
  StartWithoutAccount,
  UNCONFIRMED_CREATION,
  useDraft,
  usePicked,
  useStartConversation,
} from '../../harness/room/public.ts'
import { HubFailure, sentenceOf, writeFailureText } from '../../platform/hub.ts'
import { Block, BlockSentence, blockRow } from '../../ui/block.tsx'
import { cn } from '../../ui/cn.ts'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { AgentList } from './agent-list.tsx'
import { AreaFrame } from './area-frame.tsx'
import { construtorConversationsQuery } from './queries.ts'
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
  const { start, failure } = useStartConversation('AGENT_BUILDER')
  // The Hub, too, can find no account for the person's model: the same notice, with the way to the accounts.
  if (failure instanceof HubFailure && failure.code === 'MODEL_NO_ACCOUNT')
    return <StartWithoutAccount companyId={companyId} />

  async function begin(question: Outgoing) {
    const started = await start({ companyId, projectId, picked }, question)
    return started.opened
  }

  return (
    <>
      <p className="text-text-2">{CONSTRUTOR_FIRST}</p>
      <StartBox
        words={agentWords(CONSTRUTOR_NAME)}
        draft={draft}
        placeholder={CONSTRUTOR_PLACEHOLDER}
        examples={CONSTRUTOR_EXAMPLES}
        picker={{ picked, onPick: props.onPick, providers: props.providers }}
        onSend={begin}
        notice={
          failure !== undefined && (
            <p role="alert" className="text-danger">
              {writeFailureText(failure, UNCONFIRMED_CREATION)}
            </p>
          )
        }
      />
    </>
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
              to="/companies/$companyId/projects/$projectId/agents/agent-builder/$conversationId"
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
