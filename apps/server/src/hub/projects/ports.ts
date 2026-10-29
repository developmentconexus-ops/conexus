import type { CompanyId, PersonId, ProjectId } from '@conexus/hub-api'
import type { CommandTx, ReadTx, Scope } from '../../platform/database.ts'

/**
 * What deleting a Projeto asks of its app (code C4): Projects names the port, and `main.ts` hands
 * it the apps' own, made before either subject exists.
 */
export type AppRemoval = {
  claimForDeletion(
    tx: CommandTx,
    ids: { companyId: CompanyId; projectId: ProjectId },
  ): Promise<void>
  removeProjectApp(input: {
    scope: Scope
    companyId: CompanyId
    projectId: ProjectId
  }): Promise<'DONE' | 'LEFT'>
}

/** The numbers of the Prévia's and the published version of a Projeto's app; null before each first. */
export type AppVersionsOf = (
  tx: ReadTx,
  projectId: ProjectId,
) => Promise<{ appVersion: number | null; publishedVersion: number | null }>

/**
 * What deleting a Projeto asks of the Builder (code C4): its conversations' threads and memory go
 * before its row, which takes their index with it (data D17).
 */
export type ProjectConversationRelease = (scope: {
  companyId: CompanyId
  projectId: ProjectId
}) => Promise<void>

/** The roles the published version of a Projeto's app declares, with their labels (step 18, D). */
export type PublishedRolesOf = (
  tx: ReadTx,
  projectId: ProjectId,
) => Promise<{ published: boolean; roles: readonly { name: string; label: string }[] }>

/** Ends a person's sessions in a Projeto's app, after the commit that took their access (S13). */
export type AppSessionsEnd = (ids: { projectId: ProjectId; personId: PersonId }) => Promise<void>
