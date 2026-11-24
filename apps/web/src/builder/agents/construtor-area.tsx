import type { CompanyId, Effort, ModelId, ProjectId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { HubFailure, sentenceOf, writeFailureText } from '../../platform/hub.ts'
import { Block, BlockSentence, blockRow } from '../../ui/block.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import type { Outgoing } from '../conversation/public.ts'
import {
  agentWords,
  StartBox,
  StartWithoutAccount,
  UNCONFIRMED_CREATION,
  useDraft,
  usePicked,
  useStartConversation,
} from '../conversation/public.ts'
import { construtorConversationsQuery } from './construtor-queries.ts'
import {
  CONSTRUTOR_EXAMPLES,
  CONSTRUTOR_FIRST,
  CONSTRUTOR_NAME,
  CONSTRUTOR_PLACEHOLDER,
  NO_CONSTRUTOR_CONVERSATIONS,
} from './construtor-text.ts'
import { ConversationLine } from './rows.tsx'

type Scope = { companyId: CompanyId; projectId: ProjectId }

/** The box that begins a conversation with the Construtor in this Projeto; the question goes with the conversation it opens. */
export function ConstrutorAsk({ companyId, projectId }: Scope) {
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

/** The earlier conversations with the Construtor in this Projeto. */
export function ConstrutorConversations(scope: Scope) {
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
