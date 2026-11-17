import { z } from 'zod'
import type { Principal } from '../access/public.ts'

/** The turn a call belongs to: a uuid the Assistant's takeTurn puts on the run's context (U2). */
export const TurnKey = z.uuid().brand('TurnKey')
export type TurnKey = z.infer<typeof TurnKey>

/** The ids of the line and of the query: the Projeto only where the conversation lives in one. */
export function idsOf(principal: Principal) {
  return principal.place.kind === 'PROJECT'
    ? { companyId: principal.companyId, projectId: principal.place.projectId }
    : { companyId: principal.companyId }
}
