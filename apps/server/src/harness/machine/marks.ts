import type { AgentId, CompanyId, ProjectId } from '@conexus/hub-api'
import { MARK } from './kit.ts'

/** The marks a conversation's machine carries (security S36): its company, and where it lives. */
export function machineMarksOf(where: {
  companyId: CompanyId
  projectId?: ProjectId
  agentId?: AgentId
}): Record<string, string> {
  return {
    [MARK.company]: where.companyId,
    ...(where.projectId === undefined ? {} : { [MARK.project]: where.projectId }),
    ...(where.agentId === undefined ? {} : { [MARK.agent]: where.agentId }),
  }
}
