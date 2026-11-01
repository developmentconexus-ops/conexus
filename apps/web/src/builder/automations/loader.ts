import type { AutomationId, AutomationSummary, CompanyId, ProjectId } from '@conexus/hub-api'
import { AutomationId as AutomationIdSchema } from '@conexus/hub-api'
import type { QueryClient } from '@tanstack/react-query'
import { notFound } from '@tanstack/react-router'
import { z } from 'zod'
import { projectQuery } from '../../hub/projects/public.ts'
import { idOrNotFound, readOrNotFound } from '../../platform/hub.ts'
import { automationRunsQuery, automationsQuery } from './queries.ts'

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

/**
 * The automation a history opens: the Hub keeps no read of one, so it is the place's list row; an
 * automation the place does not list (another person's, the other floor's, a deleted one) is not found.
 */
export function automationOf(
  automations: readonly AutomationSummary[],
  automationId: AutomationId,
): AutomationSummary {
  const automation = automations.find((each) => each.id === automationId)
  if (automation === undefined) throw notFound()
  return automation
}

/** What a history reads before it opens: the place's list, its automation among them, and its runs. */
export async function loadAutomationRuns(
  queryClient: QueryClient,
  open: { companyId: CompanyId; projectId?: ProjectId; automationId: AutomationId; page?: string },
) {
  const { companyId, projectId, automationId, page } = open
  const [list] = await loadAutomations(queryClient, { companyId, projectId })
  automationOf(list.automations, automationId)
  await readOrNotFound(
    queryClient.ensureQueryData(automationRunsQuery(companyId, automationId, page)),
  )
}
