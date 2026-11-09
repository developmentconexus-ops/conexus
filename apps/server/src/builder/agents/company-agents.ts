import type { CompanyId } from '@conexus/hub-api'
import { AgentId, ProjectId } from '@conexus/hub-api'
import { eq } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import { agent } from './tables.ts'

/** Every agent of the company, with the Projeto it lives in and the version it is published at: what a workflow's AGENT balloon is checked against (step 24.6). */
export async function companyAgentsOf(tx: ReadTx, companyId: CompanyId) {
  const rows = await tx
    .select({ id: agent.id, projectId: agent.projectId, activeVersion: agent.activeVersion })
    .from(agent)
    .where(eq(agent.companyId, companyId))
  return rows.map((row) => ({
    agentId: AgentId.parse(row.id),
    projectId: ProjectId.parse(row.projectId),
    activeVersion: row.activeVersion,
  }))
}
