import type {
  AssistantConversationSummary,
  CompanyId,
  ConnectionId,
  Effort,
  ModelId,
  ProjectId,
} from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { dayOf } from '../../platform/dates.ts'
import { sentenceOf, writeFailureText } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { blockRow } from '../../ui/block.tsx'
import { cn } from '../../ui/cn.ts'
import { Pager } from '../../ui/pager.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { AutomationBadge } from '../automations/public.ts'
import type { Outgoing } from '../conversation/public.ts'
import {
  ASSISTANT_WORDS,
  START_COLUMN,
  StartBox,
  StartWithoutAccount,
  titleOf,
  UNCONFIRMED_CREATION,
  useDraft,
  usePicked,
  useStartConversation,
} from '../conversation/public.ts'
import { useComposerTools } from './composer-tools.tsx'
import { useDraftChoice } from './draft-choice.ts'
import { assistantConversationsQuery } from './queries.ts'
import {
  ASSISTANT_EXAMPLES,
  HOME_PLACEHOLDER,
  NO_CONVERSATIONS,
  PROJECT_LIST_TITLE,
} from './text.ts'

/**
 * Creates the conversation with the model, the Projeto and the connections the box holds, then
 * opens it with the question handed over to be sent once (13.1's handoff). One attempt key serves
 * the tries of one question (web W24).
 */
function useBegin(
  companyId: CompanyId,
  held: {
    model: { model: ModelId; effort: Effort }
    projectId: ProjectId | undefined
    /** What the box chose; none while the offer has not arrived, when nothing is sent. */
    connections: readonly ConnectionId[] | undefined
  },
) {
  const { start, failure } = useStartConversation('ASSISTANT')
  async function begin(question: Outgoing): Promise<boolean> {
    const { connections } = held
    if (connections === undefined) return false
    const started = await start(
      { companyId, projectId: held.projectId, picked: held.model, connections },
      question,
    )
    return started.opened
  }
  return {
    begin,
    error: failure === undefined ? undefined : writeFailureText(failure, UNCONFIRMED_CREATION),
  }
}

/**
 * The box that asks the Assistant, its folder and tools in the box's row. On Início the Projeto is
 * chosen here, until the first question; on the Projeto's own page it is fixed.
 */
export function Ask(props: {
  companyId: CompanyId
  projectId?: ProjectId
  chooseProject: boolean
}) {
  const { picked, setPicked, providers } = usePicked(props.companyId)
  if (picked === null) return <StartWithoutAccount companyId={props.companyId} />
  return <AskBox {...props} picked={picked} onPick={setPicked} providers={providers} />
}

function AskBox(props: {
  companyId: CompanyId
  projectId?: ProjectId
  chooseProject: boolean
  picked: { model: ModelId; effort: Effort }
  onPick: (picked: { model: ModelId; effort: Effort }) => void
  providers: ReturnType<typeof usePicked>['providers']
}) {
  const { companyId, picked } = props
  const [chosenProject, setChosenProject] = useState<ProjectId>()
  const projectId = props.chooseProject ? chosenProject : props.projectId
  const choice = useDraftChoice(companyId, projectId)
  const draft = useDraft(
    props.projectId === undefined ? `start:${companyId}` : `assistant:${props.projectId}`,
  )
  const { begin, error } = useBegin(companyId, {
    model: picked,
    projectId,
    connections: choice.connections,
  })
  const tools = useComposerTools({
    kind: 'HOME',
    companyId,
    draft: choice,
    projectId,
    onProject: props.chooseProject ? setChosenProject : undefined,
  })
  return (
    <StartBox
      words={ASSISTANT_WORDS}
      draft={draft}
      placeholder={HOME_PLACEHOLDER}
      examples={props.chooseProject ? ASSISTANT_EXAMPLES : []}
      canSend={choice.connections !== undefined}
      picker={{ picked, onPick: props.onPick, providers: props.providers }}
      onSend={begin}
      tools={tools}
      notice={error !== undefined && <Alert tone="danger">{error}</Alert>}
    />
  )
}

function ConversationLink(props: {
  companyId: CompanyId
  projectId: ProjectId
  conversation: AssistantConversationSummary
}) {
  const { companyId, projectId, conversation } = props
  return (
    <Link
      to="/companies/$companyId/projects/$projectId/assistant/$conversationId"
      params={{ companyId, projectId, conversationId: conversation.id }}
      className={cn(blockRow, 'justify-between hover:bg-surface-3')}
    >
      <span className="min-w-0 flex-auto truncate">{titleOf(conversation)}</span>
      {conversation.automation !== null && <AutomationBadge name={conversation.automation.name} />}
      <span className="shrink-0 text-label text-text-2">{dayOf(conversation.updatedAt)}</span>
    </Link>
  )
}

/**
 * The person's conversations with the Assistant in one Projeto, newest first, a page at a time with
 * the page in the address under `param` (web W18). Início's own list is the sidebar's.
 */
export function Recent(props: {
  companyId: CompanyId
  projectId: ProjectId
  page: string | undefined
  param: string
}) {
  const { companyId, projectId, page } = props
  const read = useQuery(assistantConversationsQuery(companyId, projectId, page))
  if (read.isPending) return <Skeleton className="h-20 w-full" />
  if (read.isError)
    return <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
  const { conversations, next } = read.data
  if (conversations.length === 0)
    return <p className={cn(START_COLUMN, 'text-text-2')}>{NO_CONVERSATIONS}</p>
  return (
    <section aria-label={PROJECT_LIST_TITLE} className={cn(START_COLUMN, 'gap-sm')}>
      <ul className="flex flex-col">
        {conversations.map((conversation) => (
          <li key={conversation.id}>
            <ConversationLink
              companyId={companyId}
              projectId={projectId}
              conversation={conversation}
            />
          </li>
        ))}
      </ul>
      <Pager next={next} param={props.param} page={page} list="Conversas" />
    </section>
  )
}

/** Início of an owner or an administrator: the box that asks the Assistant; the blocks come under it (`AssistantDay`). */
export function AssistantHome(props: { companyId: CompanyId }) {
  return <Ask companyId={props.companyId} chooseProject />
}
