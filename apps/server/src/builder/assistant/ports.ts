import type {
  CompanyId,
  CopyId,
  CopyProposalId,
  CopyRun,
  CopySummary,
  PersonId,
  ProjectId,
} from '@conexus/hub-api'
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

/** What the Assistant reads of the company's copies, through the copies' service wired at the root (code C4). */
export type AssistantCopies = {
  list(input: {
    companyId: CompanyId
    personId: PersonId
    named: readonly CopyProposalId[]
  }): Promise<{ copies: CopySummary[] }>
  runs(input: {
    companyId: CompanyId
    personId: PersonId
    copyId: CopyId
    page: string | undefined
  }): Promise<{ copy: CopySummary; runs: CopyRun[] }>
}
