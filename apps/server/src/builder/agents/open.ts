import type { AgentId, ConversationId } from '@conexus/hub-api'
import type { AgentController } from '@mastra/core/agent-controller'
import type { Memory } from '@mastra/memory'
import { eq } from 'drizzle-orm'
import type { Database } from '../../platform/database.ts'
import { violatedReference } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { Kept, Owner } from '../controller-kit/public.ts'
import { openSession, releaseThreads } from '../controller-kit/public.ts'
import type { ConversationMachines } from '../machine/public.ts'
import type { QueueDeps } from '../model-accounts/public.ts'
import type { InProject } from '../tools/public.ts'
import { AGENT_MARK, keptRun } from './controller.ts'
import type { FrozenVersion } from './frozen.ts'
import { agentConversation } from './tables.ts'

/**
 * The creation's row, kept before its thread (data D17): a repeat of the attempt finds the first,
 * the same when it runs the same agent the same way (code C37); the agent deleted meanwhile is
 * the reference's refusal.
 */
function keep(
  database: Database,
  owner: Owner,
  row: { id: ConversationId; agentId: AgentId; draft: boolean },
): Promise<Kept> {
  return database
    .command({ kind: 'COMPANY', ...owner }, async (tx): Promise<Kept> => {
      const [made] = await tx
        .insert(agentConversation)
        .values({ ...row, ...owner })
        .onConflictDoNothing({ target: agentConversation.id })
        .returning({ id: agentConversation.id })
      if (made !== undefined) return { made: true }
      const [kept] = await tx
        .select({ agentId: agentConversation.agentId, draft: agentConversation.draft })
        .from(agentConversation)
        .where(eq(agentConversation.id, row.id))
      const same = kept?.agentId === row.agentId && kept.draft === row.draft
      return { made: false, same, id: row.id }
    })
    .catch((error: unknown) => {
      if (violatedReference(error) === undefined) throw error
      throw new Failure('AGENT_NOT_FOUND', { cause: error })
    })
}

/**
 * Opens a conversation of the person's with the agent (`openSession` of the kit), on the version's
 * model, or the person's first with `model: null`. The agent deleted while it opened: its sweep may
 * have run before this thread, so the row is read again after it, and without it the thread goes
 * and the answer is `AGENT_NOT_FOUND` (data D22).
 */
export async function openAgentConversation(
  deps: {
    controller: AgentController
    memory: Memory
    queue: QueueDeps
    database: Database
    machines: Pick<ConversationMachines, 'kill'>
  },
  input: {
    scope: InProject
    agentId: AgentId
    draft: boolean
    frozen: FrozenVersion
    id: ConversationId
  },
) {
  const { scope, agentId, draft, id } = input
  const owner = { companyId: scope.companyId, personId: scope.personId }
  const tags = {
    [AGENT_MARK.company]: scope.companyId,
    [AGENT_MARK.person]: scope.personId,
    [AGENT_MARK.project]: scope.projectId,
    [AGENT_MARK.agent]: agentId,
    [AGENT_MARK.draft]: String(draft),
  }
  const opened = await openSession(deps, {
    ...{ kind: 'agents', owner, id, tags, model: input.frozen.model ?? undefined },
    keep: () => keep(deps.database, owner, { id, agentId, draft }),
  })
  if ((await keptRun(deps.database, owner, id)) === undefined) {
    await releaseThreads(deps, [id], (each) => deps.machines.kill(each))
    throw new Failure('AGENT_NOT_FOUND')
  }
  return opened
}
