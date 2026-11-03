import type { CompanyId } from '@conexus/hub-api'
import { ProjectId } from '@conexus/hub-api'
import { and, eq, isNotNull } from 'drizzle-orm'
import type { Database, ReadTx, Scope } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { ProjectConversationRelease } from './ports.ts'
import { project } from './tables.ts'

export function ofProject(ids: { companyId: CompanyId; projectId: ProjectId }) {
  return and(eq(project.id, ids.projectId), eq(project.companyId, ids.companyId))
}

/** The company's Projetos marked for deletion, which the repair at start finishes. */
export async function markedProjectsOf(tx: ReadTx, companyId: CompanyId): Promise<ProjectId[]> {
  const rows = await tx
    .select({ id: project.id })
    .from(project)
    .where(and(eq(project.companyId, companyId), isNotNull(project.deletingSince)))
  return rows.map(({ id }) => ProjectId.parse(id))
}

/**
 * The rest of a Projeto marked for deletion, once its app is gone: its conversations, with no
 * transaction open (data D22), then its row. Conversations the Builder could not release keep the
 * mark for the repair at start: `PROJECT_DELETION_PENDING`.
 */
export async function finishMarkedProject(
  deps: { database: Database; releaseConversations: ProjectConversationRelease },
  input: { scope: Scope; companyId: CompanyId; projectId: ProjectId },
): Promise<void> {
  const ids = { companyId: input.companyId, projectId: input.projectId }
  try {
    await deps.releaseConversations(ids)
  } catch (cause) {
    throw new Failure('PROJECT_DELETION_PENDING', { cause })
  }
  await deps.database.command(input.scope, (tx) =>
    tx.delete(project).where(and(ofProject(ids), isNotNull(project.deletingSince))),
  )
}
