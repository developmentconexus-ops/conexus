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
import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { refreshNotifications } from '../../hub/notifications/public.ts'
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

/**
 * The runs of one automation, followed while one runs. When the person is looking and a run ends,
 * the notification it makes is read at once, so the bell does not wait for its next poll (step 24.2,
 * criterion 21). `enabled: false` reads nothing: the list page follows only after **Rodar agora**.
 */
export function useFollowedRuns(
  companyId: CompanyId,
  automationId: AutomationId,
  page: string | undefined,
  enabled = true,
) {
  const queryClient = useQueryClient()
  const read = useQuery({ ...automationRunsQuery(companyId, automationId, page), enabled })
  const running = read.data?.runs.some((run) => run.state.kind === 'RUNNING')
  const was = useRef(false)
  useEffect(() => {
    if (was.current && running === false) void refreshNotifications(queryClient, companyId)
    if (running !== undefined) was.current = running
  }, [running, queryClient, companyId])
  return read
}

export const sendAutomationCreation = hubMutation(createAutomation)
export const sendAutomationPause = hubMutation(pauseAutomation)
export const sendAutomationResume = hubMutation(resumeAutomation)
export const sendAutomationRun = hubMutation(runAutomation)
export const sendAutomationDeletion = hubMutation(deleteAutomation)
