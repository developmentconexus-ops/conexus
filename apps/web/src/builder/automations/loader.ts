import type { AutomationId, CompanyId, ProjectId } from '@conexus/hub-api'
import { AutomationId as AutomationIdSchema } from '@conexus/hub-api'
import type { QueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { projectQuery } from '../../hub/projects/public.ts'
import { idOrNotFound, readOrNotFound } from '../../platform/hub.ts'
import { automationsQuery } from './queries.ts'

/** The automation an address names; an id the contract would never issue is not found. */
export const automationParams = {
  parse: (raw: { automationId: string }) => ({
    automationId: idOrNotFound(AutomationIdSchema, raw.automationId),
  }),
  stringify: (p: { automationId: AutomationId }) => p,
}

/** The page of the runs a history shows, in the address (web W18). */
export const RunsSearch = z.object({ page: z.string().optional().catch(undefined) })

/**
 * What an Automações page reads before it opens: the person's automations of the place and, in a
 * Projeto, the Projeto, so a deleted one is not found; a member's read is not found too (S10).
 */
export function loadAutomations(
  queryClient: QueryClient,
  place: { companyId: CompanyId; projectId?: ProjectId },
) {
  const { companyId, projectId } = place
  return readOrNotFound(
    Promise.all([
      queryClient.ensureQueryData(automationsQuery(companyId, projectId)),
      ...(projectId === undefined
        ? []
        : [queryClient.ensureQueryData(projectQuery(companyId, projectId))]),
    ]),
  )
}
