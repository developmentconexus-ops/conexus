import type { AutomationId, CompanyId, ProjectId } from '@conexus/hub-api'
import {
  createAutomation,
  deleteAutomation,
  listAutomationRuns,
  listAutomations,
  pauseAutomation,
  resumeAutomation,
  runAutomation,
} from '@conexus/hub-api'
import { queryOptions } from '@tanstack/react-query'
import { hubMutation, hubQuery } from '../../platform/hub.ts'

const WHILE_RUNNING = 5_000

/** The person's own automations of a place: the company's Início, or one Projeto. */
export function automationsQuery(companyId: CompanyId, projectId: ProjectId | undefined) {
  return hubQuery(listAutomations, { params: { companyId }, query: { projectId } })
}

/** The runs of one automation, newest first, a page at a time; read again while one of them runs. */
export function automationRunsQuery(
  companyId: CompanyId,
  automationId: AutomationId,
  page: string | undefined,
) {
  return queryOptions({
    ...hubQuery(listAutomationRuns, { params: { companyId, automationId }, query: { page } }),
    refetchInterval: (query) =>
      query.state.data?.runs.some((run) => run.state.kind === 'RUNNING') ? WHILE_RUNNING : false,
  })
}

export const sendAutomationCreation = hubMutation(createAutomation)
export const sendAutomationPause = hubMutation(pauseAutomation)
export const sendAutomationResume = hubMutation(resumeAutomation)
export const sendAutomationRun = hubMutation(runAutomation)
export const sendAutomationDeletion = hubMutation(deleteAutomation)
