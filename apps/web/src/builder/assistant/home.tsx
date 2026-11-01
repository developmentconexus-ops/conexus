import type {
  AssistantConversationSummary,
  CompanyId,
  ConnectionId,
  Effort,
  ModelId,
  ProjectId,
} from '@conexus/hub-api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { projectsQuery } from '../../hub/projects/public.ts'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import { dayAndHour, dayOf } from '../../platform/dates.ts'
import { sentenceOf, writeFailureText } from '../../platform/hub.ts'
import { Badge } from '../../ui/badge.tsx'
import { cn } from '../../ui/cn.ts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import {
  StartBox,
  StartWithoutAccount,
  stashHandoffFiles,
  useDraft,
  usePicked,
} from '../conversation/public.ts'
import { ContextBar } from './context-bar.tsx'
import { assistantConversationsQuery, sendAssistantCreation } from './queries.ts'
import {
  ASSISTANT_EXAMPLES,
  HOME_PLACEHOLDER,
  NO_CONVERSATIONS,
  RECENT_TITLE,
  UNCONFIRMED_CREATION,
} from './text.ts'

const NO_PROJECT = 'none'

/** Início's choice of the Projeto a conversation is born in, only until its first question. */
function ProjectSelect(props: {
  companyId: CompanyId
  value: ProjectId | undefined
  onChange: (projectId: ProjectId | undefined) => void
}) {
  const projects = useQuery(projectsQuery(props.companyId, undefined)).data?.projects ?? []
  const items = [
    { value: NO_PROJECT, label: 'Sem Projeto' },
    ...projects.map((project) => ({ value: project.id, label: project.name })),
  ]
  return (
    <Select
      value={props.value ?? NO_PROJECT}
      items={items}
      onValueChange={(next) => props.onChange(projects.find((project) => project.id === next)?.id)}
    >
      <SelectTrigger aria-label="Projeto da conversa" className="h-7 w-auto min-w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

type Begun = { content: string; files: Parameters<typeof stashHandoffFiles>[1] }

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
    connections: readonly ConnectionId[]
  },
) {
  const [error, setError] = useState<string>()
  const create = useMutation(sendAssistantCreation)
  const attempt = useAttemptKey()
  const navigate = useNavigate()
  async function begin(question: Begun): Promise<boolean> {
    setError(undefined)
    try {
      const { conversation } = await attempt((attemptKey) =>
        create.mutateAsync({
          params: { companyId },
          body: { ...held.model, projectId: held.projectId, connections: [...held.connections] },
          attemptKey,
        }),
      )
      stashHandoffFiles(conversation.id, question.files)
      const state = { handoff: { content: question.content } }
      const { id: conversationId, projectId } = conversation
      await (projectId === null
        ? navigate({
            to: '/companies/$companyId/conversations/$conversationId',
            params: { companyId, conversationId },
            state,
          })
        : navigate({
            to: '/companies/$companyId/projects/$projectId/assistant/$conversationId',
            params: { companyId, projectId, conversationId },
            state,
          }))
      return true
    } catch (failure) {
      setError(writeFailureText(failure, UNCONFIRMED_CREATION))
      return false
    }
  }
  return { begin, error }
}

/**
 * The box that asks the Assistant, with its bar under it. On Início the Projeto is chosen here,
 * until the first question; on the Projeto's own page it is fixed.
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
  const [chosen, setChosen] = useState<readonly ConnectionId[]>([])
  const draft = useDraft(
    props.projectId === undefined ? `start:${companyId}` : `assistant:${props.projectId}`,
  )
  const { begin, error } = useBegin(companyId, {
    model: picked,
    projectId,
    connections: chosen,
  })
  return (
    <StartBox
      draft={draft}
      placeholder={HOME_PLACEHOLDER}
      examples={ASSISTANT_EXAMPLES}
      picked={picked}
      onPick={props.onPick}
      providers={props.providers}
      onSend={begin}
      bar={
        <div className="flex flex-col gap-sm">
          <ContextBar
            key={projectId ?? NO_PROJECT}
            companyId={companyId}
            projectId={projectId}
            onDraftChange={setChosen}
            trailing={
              props.chooseProject && (
                <ProjectSelect
                  companyId={companyId}
                  value={projectId}
                  onChange={setChosenProject}
                />
              )
            }
          />
          {error !== undefined && (
            <p role="alert" className="text-danger">
              {error}
            </p>
          )}
        </div>
      }
    />
  )
}

function titleOf(conversation: AssistantConversationSummary): string {
  return conversation.title ?? `Conversa de ${dayAndHour(conversation.updatedAt)}`
}

function ConversationLink(props: {
  companyId: CompanyId
  conversation: AssistantConversationSummary
  projectName: string | undefined
}) {
  const { companyId, conversation } = props
  const row = cn(
    'flex items-center justify-between gap-md rounded-control px-sm py-md hover:bg-surface-3',
  )
  const content = (
    <>
      <span className="flex min-w-0 items-center gap-sm">
        <span className="truncate">{titleOf(conversation)}</span>
        {props.projectName !== undefined && <Badge>{props.projectName}</Badge>}
      </span>
      <span className="shrink-0 text-label text-text-2">{dayOf(conversation.updatedAt)}</span>
    </>
  )
  return conversation.projectId === null ? (
    <Link
      to="/companies/$companyId/conversations/$conversationId"
      params={{ companyId, conversationId: conversation.id }}
      className={row}
    >
      {content}
    </Link>
  ) : (
    <Link
      to="/companies/$companyId/projects/$projectId/assistant/$conversationId"
      params={{ companyId, projectId: conversation.projectId, conversationId: conversation.id }}
      className={row}
    >
      {content}
    </Link>
  )
}

/** The person's conversations with the Assistant, newest first: all of them on Início, one Projeto's in its Conversas. */
export function Recent(props: { companyId: CompanyId; projectId?: ProjectId }) {
  const { companyId, projectId } = props
  const read = useQuery(assistantConversationsQuery(companyId, projectId, undefined))
  const projects = useQuery(projectsQuery(companyId, undefined)).data?.projects ?? []
  if (read.isPending) return <Skeleton className="h-20 w-full" />
  if (read.isError)
    return <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
  const { conversations } = read.data
  if (conversations.length === 0)
    return projectId === undefined ? null : <p className="text-text-2">{NO_CONVERSATIONS}</p>
  return (
    <section
      aria-labelledby="recent-title"
      className="mx-auto flex w-full max-w-[46rem] flex-col gap-sm"
    >
      <h2 id="recent-title" className="font-display text-title">
        {RECENT_TITLE}
      </h2>
      <ul className="flex flex-col">
        {conversations.map((conversation) => (
          <li key={conversation.id}>
            <ConversationLink
              companyId={companyId}
              conversation={conversation}
              projectName={
                projectId === undefined
                  ? projects.find((project) => project.id === conversation.projectId)?.name
                  : undefined
              }
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Início of an owner or an administrator: the box, the bar and, under them, the recent conversations. */
export function AssistantHome({ companyId }: { companyId: CompanyId }) {
  return (
    <div className="flex flex-col gap-xl">
      <Ask companyId={companyId} chooseProject />
      <Recent companyId={companyId} />
    </div>
  )
}
