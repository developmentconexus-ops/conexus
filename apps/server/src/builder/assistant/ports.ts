import type { CompanyId, ProjectId } from '@conexus/hub-api'
import type { ReadTx } from '../../platform/database.ts'

/** What the Assistant reads of the company's Projetos, through the Projects' and the apps' ports (code C4). */
export type AssistantProjects = {
  liveProjectOf(
    tx: ReadTx,
    ids: { companyId: CompanyId; projectId: ProjectId },
  ): Promise<{ name: string } | undefined>
  liveProjectsOf(
    tx: ReadTx,
    companyId: CompanyId,
  ): Promise<{ projects: { projectId: ProjectId; name: string }[]; more: boolean }>
  publishedVersionsOf(
    tx: ReadTx,
    projectIds: readonly ProjectId[],
  ): Promise<ReadonlyMap<ProjectId, number>>
}
