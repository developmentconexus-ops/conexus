import type { CompanyId, ConnectionId, PersonId, ProjectId } from '@conexus/hub-api'
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
   * Set where a published (or draft) agent version converses: it reads by what the version
   * declares, not by the role of the person who talks to it (decision C1).
   */
  agentVersion?: Extract<Speaker, { kind: 'VERSION' }>
}

/** The turn a call belongs to: a uuid the Assistant's takeTurn puts on the run's context (U2). */
export const TurnKey = z.uuid().brand('TurnKey')
export type TurnKey = z.infer<typeof TurnKey>

/** The ids of the line and of the query: the Projeto only where the conversation lives in one. */
export function idsOf(scope: SessionScope) {
  return scope.place.kind === 'PROJECT'
    ? { companyId: scope.companyId, projectId: scope.place.projectId }
    : { companyId: scope.companyId }
}
