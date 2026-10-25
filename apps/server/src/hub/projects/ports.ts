import type { CompanyId, ProjectId } from '@conexus/hub-api'
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

/** The number of the version on the air of a Projeto's app, null before its first (step 14.1). */
export type AppVersionOf = (tx: ReadTx, projectId: ProjectId) => Promise<number | null>

/**
 * What deleting a Projeto asks of the Builder (code C4): its conversations' threads and memory go
 * before its row, which takes their index with it (data D17).
 */
export type ProjectConversationRelease = (scope: {
  companyId: CompanyId
  projectId: ProjectId
}) => Promise<void>
