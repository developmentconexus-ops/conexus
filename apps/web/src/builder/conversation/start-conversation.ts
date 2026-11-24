import type {
  AgentId,
  CompanyId,
  ConnectionId,
  ConversationId,
  Effort,
  ModelId,
  ProjectId,
} from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import type { Outgoing } from './attachments.ts'
import { stashHandoffFiles } from './handoff.ts'
import {
  sendAgentConversation,
  sendAssistantCreation,
  sendConstrutorConversation,
  sendCreation,
} from './queries.ts'
import type { RoomKind } from './room.ts'

export type ConversationKind = RoomKind

type ModelPick = { model: ModelId; effort: Effort }

type StartOf = {
  APP_BUILDER: { companyId: CompanyId; projectId: ProjectId; picked: ModelPick | undefined }
  ASSISTANT: {
    companyId: CompanyId
    projectId: ProjectId | undefined
    picked: ModelPick
    connections: readonly ConnectionId[]
  }
  AGENT_BUILDER: { companyId: CompanyId; projectId: ProjectId; picked: ModelPick }
  SAVED_AGENT: { companyId: CompanyId; projectId: ProjectId; agentId: AgentId; draft: boolean }
}

/** The request the conversation opens with, sent once by the conversation's own screen; none opens an empty conversation. */
type Handoff = Outgoing | undefined

type HandoffState = { handoff: { conversationId: ConversationId; content: string } }

type Navigate = ReturnType<typeof useNavigate>

type Created = {
  id: ConversationId
  go: (navigate: Navigate, state: HandoffState | undefined) => Promise<void>
}

export type Started = { opened: true } | { opened: false; failure: unknown }

type Start<K extends ConversationKind> = {
  /** The key of the creating operation, as `hubMutation` derives it, for whoever filters the writes in flight. */
  mutationKey: readonly string[]
  create: (input: StartOf[K], attemptKey: string) => Promise<Created>
}

/** Each kind's operation of creating, and the address it opens: the one table of where a conversation goes. */
const STARTS: { [K in ConversationKind]: Start<K> } = {
  APP_BUILDER: {
    mutationKey: sendCreation.mutationKey,
    async create(input, attemptKey) {
      const params = { companyId: input.companyId, projectId: input.projectId }
      const { conversation } = await sendCreation.mutationFn({
        params,
        body: input.picked ?? {},
        attemptKey,
      })
      const to = '/companies/$companyId/projects/$projectId/conversations/$conversationId'
      const at = { ...params, conversationId: conversation.id }
      return {
        id: conversation.id,
        // **Nova conversa** keeps the screen's search; a hand-off carries its request instead.
        go: (navigate, state) =>
          navigate(
            state === undefined
              ? { to, params: at, search: (previous) => previous }
              : { to, params: at, state },
          ),
      }
    },
  },
  ASSISTANT: {
    mutationKey: sendAssistantCreation.mutationKey,
    async create(input, attemptKey) {
      const { companyId } = input
      const { conversation } = await sendAssistantCreation.mutationFn({
        params: { companyId },
        body: { ...input.picked, projectId: input.projectId, connections: [...input.connections] },
        attemptKey,
      })
      const { id: conversationId, projectId } = conversation
      return {
        id: conversationId,
        go: (navigate, state) =>
          projectId === null
            ? navigate({
                to: '/companies/$companyId/conversations/$conversationId',
                params: { companyId, conversationId },
                state,
              })
            : navigate({
                to: '/companies/$companyId/projects/$projectId/assistant/$conversationId',
                params: { companyId, projectId, conversationId },
                state,
              }),
      }
    },
  },
  AGENT_BUILDER: {
    mutationKey: sendConstrutorConversation.mutationKey,
    async create(input, attemptKey) {
      const { companyId, projectId } = input
      const { conversation } = await sendConstrutorConversation.mutationFn({
        params: { companyId, projectId },
        body: input.picked,
        attemptKey,
      })
      return {
        id: conversation.id,
        go: (navigate, state) =>
          navigate({
            to: '/companies/$companyId/projects/$projectId/agents/construtor/$conversationId',
            params: { companyId, projectId, conversationId: conversation.id },
            state,
          }),
      }
    },
  },
  SAVED_AGENT: {
    mutationKey: sendAgentConversation.mutationKey,
    async create(input, attemptKey) {
      const { companyId, projectId, agentId } = input
      const { conversation } = await sendAgentConversation.mutationFn({
        params: { companyId, projectId, agentId },
        body: { draft: input.draft },
        attemptKey,
      })
      return {
        id: conversation.id,
        go: (navigate, state) =>
          navigate({
            to: '/companies/$companyId/projects/$projectId/agents/$agentId/$conversationId',
            params: { companyId, projectId, agentId, conversationId: conversation.id },
            state,
          }),
      }
    },
  },
}

/** Where a start is: the one owner of the "waiting" and of the failure the screens read. */
type Phase = { at: 'IDLE' } | { at: 'STARTING' } | { at: 'FAILED'; failure: unknown }

/**
 * Begins a conversation with one of the four agents: the one place that creates it, keeps the
 * attempt key until the Hub settles the outcome (web W24), hands the request over and goes to the
 * address of its kind. `onCreated` runs between the creation and the address; each place keeps
 * what it says of a refusal. `pending` holds from the click until the address is reached, which
 * is after the cache has read again what the creation changed; `start` also returns the failure,
 * for the place that decides at once.
 */
export function useStartConversation<K extends ConversationKind>(kind: K) {
  const navigate = useNavigate()
  const attempt = useAttemptKey()
  const create = useMutation({
    mutationKey: STARTS[kind].mutationKey,
    mutationFn: (input: StartOf[K]) =>
      attempt((attemptKey) => STARTS[kind].create(input, attemptKey)),
  })
  const [phase, setPhase] = useState<Phase>({ at: 'IDLE' })

  async function start(
    input: StartOf[K],
    handoff: Handoff,
    onCreated?: () => unknown,
  ): Promise<Started> {
    setPhase({ at: 'STARTING' })
    try {
      const created = await create.mutateAsync(input)
      if (handoff !== undefined) stashHandoffFiles(created.id, handoff.files)
      await onCreated?.()
      await created.go(
        navigate,
        handoff === undefined
          ? undefined
          : { handoff: { conversationId: created.id, content: handoff.content } },
      )
      setPhase({ at: 'IDLE' })
      return { opened: true }
    } catch (error) {
      setPhase({ at: 'FAILED', failure: error })
      return { opened: false, failure: error }
    }
  }

  return {
    start,
    pending: phase.at === 'STARTING',
    failure: phase.at === 'FAILED' ? phase.failure : undefined,
  }
}
