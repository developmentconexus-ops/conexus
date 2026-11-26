import type { ProjectId } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import type { Memory } from '@mastra/memory'
import { machineMarksOf } from '../../harness/machine/public.ts'
import type { Owner, RunMark, RunScope } from '../../harness/spec/public.ts'
import { agentManagerAdmission, runResolver } from '../../harness/spec/public.ts'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { liveProjectOf } from '../../hub/projects/public.ts'
import type { Database } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { InProject } from '../saved-agent/public.ts'

type Deps = { database: Database; identity: IdentityPorts; liveProjectOf: typeof liveProjectOf }

export type RunOf = (requestContext: RequestContext) => Promise<RunScope | undefined>

/** Whether the Projeto a thread is marked with is a live one of the owner's company. */
async function liveIn(deps: Deps, owner: Owner, projectId: ProjectId): Promise<boolean> {
  const live = await deps.database.read({ kind: 'COMPANY', ...owner }, (tx) =>
    deps.liveProjectOf(tx, { companyId: owner.companyId, projectId }),
  )
  return live !== undefined
}

/** The guard's admission: the person builds agents now, in a Projeto of the company (criterion 21). */
export function construtorAdmission(deps: Deps) {
  const manager = agentManagerAdmission({ database: deps.database, identity: deps.identity })
  return async (input: Parameters<typeof manager>[0] & { mark: RunMark }): Promise<void> => {
    await manager(input)
    const owner = { companyId: input.companyId, personId: input.person.id }
    const { projectId } = input.mark
    if (projectId === undefined || !(await liveIn(deps, owner, projectId))) {
      throw new Failure('CONVERSATION_NOT_FOUND')
    }
  }
}

/**
 * The Construtor's run: the Hub keeps no row of it, so its Projeto is its thread's mark, checked
 * against the company's live Projetos (Factory `tools/scope.ts:107`); every connection it received.
 */
export function construtorRuns(deps: Deps, memory: Pick<Memory, 'getThreadById'>): RunOf {
  return runResolver('construtor', {
    memory,
    stored: async ({ owner, mark }) => {
      const { projectId } = mark
      if (projectId === undefined || !(await liveIn(deps, owner, projectId))) return undefined
      return {
        place: { kind: 'PROJECT', projectId },
        choice: { kind: 'ANY' },
        ceiling: { kind: 'PERSON' },
        attended: true,
      }
    },
  })
}

/** The person and the Projeto of the run, as the Construtor's tools act on them. */
export function inProjectOf(run: RunScope): InProject | undefined {
  if (run.place.kind !== 'PROJECT') return undefined
  return { ...run.owner, projectId: run.place.projectId }
}

/** The marks of the conversation's machine: its company and its Projeto (security S36). */
export function machineMarks(runOf: RunOf) {
  return async (requestContext: RequestContext) => {
    const run = await runOf(requestContext)
    const scope = run === undefined ? undefined : inProjectOf(run)
    if (scope === undefined) return undefined
    return machineMarksOf({ companyId: scope.companyId, projectId: scope.projectId })
  }
}
