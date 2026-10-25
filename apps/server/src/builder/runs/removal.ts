import type { CompanyId, ConversationId, PersonId, ProjectId } from '@conexus/hub-api'
import { projectIdsOf } from '../../hub/projects/public.ts'
import type { RunsContext } from './context.ts'

/** What a release names: a company, and maybe one of its Projetos or one of its people. */
export type ReleaseScope = { companyId: CompanyId; projectId?: ProjectId; personId?: PersonId }

/**
 * Takes a Projeto's copy and repository, each on its own, so one that fails does not hide the
 * other; the failures are thrown together after both were tried.
 */
async function removeProject(
  context: RunsContext,
  ids: { companyId: CompanyId; projectId: ProjectId },
) {
  const steps = [() => context.copy.removeProject(ids), () => context.repository(ids).remove()]
  const failures: unknown[] = []
  for (const step of steps) {
    await step().catch((error: unknown) => {
      failures.push(error)
      context.log.error({ ...ids, error: String(error) }, 'PROJECT_SOURCE_RELEASE_FAILED')
    })
  }
  if (failures.length > 0) throw new AggregateError(failures, 'project source not released')
}

/**
 * Pauses, then kills by name, the machine of each released conversation (Factory
 * `session-retirement.ts:69-77`: a deleted session leaves no machine), also one no run of this
 * process holds; a killed machine cannot be paused, so the pause comes first. A conversation
 * with no machine passes. Each failure is logged and kept, so it hides none of the others.
 */
async function killMachines(
  context: RunsContext,
  companyId: CompanyId,
  conversations: ConversationId[],
): Promise<unknown[]> {
  const { machines } = context
  const failures: unknown[] = []
  for (const conversationId of conversations) {
    const steps = [() => machines.release(conversationId), () => machines.kill(conversationId)]
    for (const step of steps) {
      await step().catch((error: unknown) => {
        failures.push(error)
        const fields = { companyId, conversationId, error: String(error) }
        context.log.error(fields, 'MACHINE_RELEASE_FAILED')
      })
    }
  }
  return failures
}

/** The Projetos whose source a release takes: none for a person, the company's from the database. */
async function releasedProjects(context: RunsContext, scope: ReleaseScope): Promise<ProjectId[]> {
  const { companyId, projectId, personId } = scope
  if (personId !== undefined) return []
  if (projectId !== undefined) return [projectId]
  return context.database.read({ kind: 'COMPANY', companyId, personId: null }, (tx) =>
    projectIdsOf(tx, companyId),
  )
}

/**
 * Stops what a removal reaches before anything is deleted (card, criterion 24): the runs writing in
 * the Projeto, the company or the person's are let go with nothing saved, so the turn's end finds
 * them gone and writes nothing; the released conversations' machines are killed by name. A
 * Projeto's or a company's removal takes copy and repository too, each Projeto on its own; a
 * failure is thrown after all were tried, and the release can be repeated.
 */
export async function releaseRuns(
  context: RunsContext,
  scope: ReleaseScope,
  conversations: ConversationId[],
): Promise<void> {
  const { companyId } = scope
  await context.stopWriting(scope)
  const failures = await killMachines(context, companyId, conversations)
  const projects = await releasedProjects(context, scope)
  for (const each of projects) {
    await removeProject(context, { companyId, projectId: each }).catch((error: unknown) =>
      failures.push(error),
    )
  }
  if (failures.length > 0) throw new AggregateError(failures, 'project source not released')
  context.log.info({ companyId, count: projects.length }, 'PROJECT_SOURCE_RELEASED')
}
