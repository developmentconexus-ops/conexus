import type {
  CompanyId,
  ConnectionId,
  ConversationId,
  PersonId,
  ProjectId,
  WorkflowRunId,
} from '@conexus/hub-api'
import { z } from 'zod'
import type { Speaker } from '../identity/public.ts'

/** Where a conversation lives: it decides which connections it may choose (C21). */
type Place = { kind: 'COMPANY' } | { kind: 'PROJECT'; projectId: ProjectId }

/** A conversation's scope, read from its thread on each turn (U2); the role is checked on every call. */
export type SessionScope = {
  companyId: CompanyId
  personId: PersonId
  place: Place
  chosen: readonly ConnectionId[]
  /**
   * Set where a published (or draft) agent version converses, or a workflow version runs: it reads
   * by what the version declares, not by the role of the person who talks to it (decision C1).
   */
  speaksAs?: Extract<Speaker, { kind: 'VERSION' } | { kind: 'WORKFLOW' }>
}

/** Where a write is kept: a conversation (its calls are tool calls) or a workflow run (its calls are balloon attempts). */
export type WriteScope =
  | Readonly<{ kind: 'CONVERSATION'; threadId: ConversationId }>
  | Readonly<{ kind: 'RUN'; runId: WorkflowRunId }>

/** The turn a call belongs to: a uuid the Assistant's takeTurn puts on the run's context (U2). */
export const TurnKey = z.uuid().brand('TurnKey')
export type TurnKey = z.infer<typeof TurnKey>

/** The ids of the line and of the query: the Projeto only where the conversation lives in one. */
export function idsOf(scope: SessionScope) {
  return scope.place.kind === 'PROJECT'
    ? { companyId: scope.companyId, projectId: scope.place.projectId }
    : { companyId: scope.companyId }
}
