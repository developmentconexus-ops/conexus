import type { CompanyId, PersonId, ProjectId } from '@conexus/hub-api'
import type { RunsContext } from './context.ts'

/** What a release names: a company, and maybe one of its Projetos or one of its people. */
export type ReleaseScope = { companyId: CompanyId; projectId?: ProjectId; personId?: PersonId }

/**
 * Takes a Projeto's machine, copy and repository, each on its own, so one that fails does not hide
 * the others; the failures are thrown together after all were tried.
 */
async function removeProject(
  context: RunsContext,
  ids: { companyId: CompanyId; projectId: ProjectId },
) {
  const { store, machines, copy } = context
  const machine = await machines.rowOf(ids.companyId, ids.projectId)
  const steps = [
    async () => {
      if (machine !== undefined) await machines.kill(machine.sandboxId)
    },
    async () => {
      if (await store.hasVersion(ids.companyId, ids.projectId)) await copy.removeProject(ids)
    },
    () => context.repository(ids).remove(),
    () => machines.release(ids.projectId),
  ]
  const failures: unknown[] = []
  for (const step of steps) {
    await step().catch((error: unknown) => {
      failures.push(error)
      context.log.error({ ...ids, error: String(error) }, 'PROJECT_SOURCE_RELEASE_FAILED')
    })
  }
  if (failures.length > 0) throw new AggregateError(failures, 'project source not released')
}

async function projectsOf(context: RunsContext, companyId: CompanyId): Promise<ProjectId[]> {
  const found = [
    ...(await context.store.projectsOf(companyId)),
    ...(await context.machines.projectsOf(companyId)),
  ]
  return [...new Set(found)]
}

/**
 * Stops what a removal reaches before anything is deleted (card, criterion 24): the runs not over
 * of the Projeto, the company or the person become `stopped` with nothing saved, so the turn's end
 * finds them settled and writes nothing. A person's removal stops only their runs; a Projeto's or a
 * company's takes machine, copy and repository too, each Projeto on its own; a failure is thrown
 * after all were tried, and the release can be repeated.
 */
export async function releaseRuns(context: RunsContext, scope: ReleaseScope): Promise<void> {
  const { store } = context
  const { companyId, projectId, personId } = scope
  const open = await store.inStates({ companyId, states: ['open', 'saving'], projectId, personId })
  for (const stopped of open) {
    await store.move({ companyId, id: stopped.id, from: stopped.state, to: 'stopped' })
    await context.stopped(stopped.id)
  }
  if (personId !== undefined) return
  const projects = projectId === undefined ? await projectsOf(context, companyId) : [projectId]
  const failures: unknown[] = []
  for (const each of projects) {
    await removeProject(context, { companyId, projectId: each }).catch((error: unknown) =>
      failures.push(error),
    )
  }
  if (failures.length > 0) throw new AggregateError(failures, 'project source not released')
  context.log.info({ companyId, count: projects.length }, 'PROJECT_SOURCE_RELEASED')
}
