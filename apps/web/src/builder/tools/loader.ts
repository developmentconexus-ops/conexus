import type { CompanyId, ProjectId, ToolId } from '@conexus/hub-api'
import { ToolId as ToolIdSchema } from '@conexus/hub-api'
import type { QueryClient } from '@tanstack/react-query'
import { notFound } from '@tanstack/react-router'
import { projectQuery } from '../../hub/projects/public.ts'
import { HubFailure, idOrNotFound, readOrNotFound } from '../../platform/hub.ts'
import { toolsQuery } from '../agents/public.ts'
import { toolQuery } from './queries.ts'

type Scope = { companyId: CompanyId; projectId: ProjectId }

export const toolParams = {
  parse: (raw: { toolId: string }) => ({ toolId: idOrNotFound(ToolIdSchema, raw.toolId) }),
  stringify: (params: { toolId: ToolId }) => params,
}

/** What the tab reads before it opens: the Projeto (a deleted one is not found) and its tools. A member's read is not found (S10). */
export function loadTools(queryClient: QueryClient, scope: Scope) {
  return readOrNotFound(
    Promise.all([
      queryClient.query(projectQuery(scope.companyId, scope.projectId)),
      queryClient.query(toolsQuery(scope)),
    ]),
  )
}

/** A tool the Hub does not find at this address is a page not found, as a Projeto is. */
export async function loadTool(queryClient: QueryClient, scope: Scope, toolId: ToolId) {
  try {
    return await readOrNotFound(
      Promise.all([
        queryClient.query(projectQuery(scope.companyId, scope.projectId)),
        queryClient.query(toolQuery(scope, toolId)),
      ]),
    )
  } catch (error) {
    if (error instanceof HubFailure && error.code === 'TOOL_NOT_FOUND') throw notFound()
    throw error
  }
}
