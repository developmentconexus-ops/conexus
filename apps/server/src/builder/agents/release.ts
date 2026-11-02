import { AgentId } from '@conexus/hub-api'
import { and, eq } from 'drizzle-orm'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { ReleaseScope } from '../controller-kit/public.ts'
import type { Tools } from '../tools/public.ts'
import type { AgentEvent } from './events.ts'
import { agent, agentVersion } from './tables.ts'

type ReleaseDeps = {
  database: Database
  tools: Pick<Tools, 'releasePerson'>
  emit: (event: AgentEvent) => Promise<void>
  log: FailureLog
}

/**
 * The removal of a person, a Projeto or a company, after its automations and before its
 * conversations. A person's authorship leaves with them and their agents, versions and tools stay
 * (data D17); a Projeto's or a company's agents are deleted with their versions and choices, so no
 * choice holds a tool when the company's row takes the library with it. Repeating it finds nothing.
 */
export async function releaseAgents(deps: ReleaseDeps, scope: ReleaseScope): Promise<number> {
  const { companyId, projectId, personId } = scope
  const hub = { kind: 'COMPANY', companyId, personId: null } as const
  if (personId !== undefined) {
    await deps.database.command(hub, async (tx) => {
      const own = and(eq(agent.companyId, companyId), eq(agent.createdBy, personId))
      await tx.update(agent).set({ createdBy: null }).where(own)
      await tx
        .update(agentVersion)
        .set({ publishedBy: null })
        .where(and(eq(agentVersion.companyId, companyId), eq(agentVersion.publishedBy, personId)))
      await deps.tools.releasePerson(tx, companyId, personId)
    })
    return 0
  }
  const gone = await deps.database.command(hub, (tx) =>
    tx
      .delete(agent)
      .where(
        projectId === undefined
          ? eq(agent.companyId, companyId)
          : and(eq(agent.companyId, companyId), eq(agent.projectId, projectId)),
      )
      .returning({ id: agent.id }),
  )
  for (const row of gone) {
    await deps.emit({ kind: 'DELETED', companyId, agentId: AgentId.parse(row.id) })
  }
  deps.log.info({ companyId, count: gone.length }, 'AGENTS_RELEASED')
  return gone.length
}
