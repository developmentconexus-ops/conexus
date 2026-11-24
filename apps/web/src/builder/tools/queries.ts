import type { CompanyId, ProjectId, ToolId } from '@conexus/hub-api'
import { createToolVersion, deleteTool, getTool } from '@conexus/hub-api'
import { hubMutation, hubQuery } from '../../platform/hub.ts'

type Scope = { companyId: CompanyId; projectId: ProjectId }

export function toolQuery(scope: Scope, toolId: ToolId) {
  return hubQuery(getTool, { params: { ...scope, toolId } })
}

export const sendToolVersion = hubMutation(createToolVersion)
export const sendToolDeletion = hubMutation(deleteTool)
