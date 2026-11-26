import type { CompanyId, ProjectId } from '@conexus/hub-api'
import type { ReadTx } from '../../../platform/database.ts'

/** What the company's tools read of its Projetos, through the Projects' and the apps' ports (code C4). */
export type CompanyProjects = {
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
