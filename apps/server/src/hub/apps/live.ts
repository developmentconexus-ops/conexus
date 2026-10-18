import type { AppVersion, AppVersionId, CompanyId, Person, ProjectId } from '@conexus/hub-api'
import { and, eq } from 'drizzle-orm'
import { Failure } from '../../platform/failure.ts'
import type { SendDeps } from './send.ts'
import { admitManager } from './send.ts'
import { app, appVersion } from './tables.ts'
import { failVersion, lockApp, versionView } from './versions.ts'

/**
 * Puts a kept version back on the air, in one transaction: only the pointer changes, so the data
 * stay as they are and the next call runs the version's Worker. A live send's claim refuses; one
 * past its time fails that send. A version pruned, of another Projeto, or that never entered is
 * not found.
 */
export function setLiveVersion(
  deps: SendDeps,
  input: { person: Person; companyId: CompanyId; projectId: ProjectId; versionId: AppVersionId },
): Promise<AppVersion> {
  const { companyId, projectId, versionId } = input
  const scope = { kind: 'COMPANY', companyId, personId: input.person.id } as const
  return deps.database.command(scope, async (tx) => {
    await admitManager(deps, tx, input)
    const held = await lockApp(tx, input)
    if (held.sendingVersionId !== null) {
      if (held.held) throw new Failure('APP_VERSION_SENDING')
      const failure = 'APP_VERSION_FAILED'
      await failVersion(tx, { projectId, versionId: held.sendingVersionId, failure })
    }
    const [row] = await tx
      .select()
      .from(appVersion)
      .where(
        and(
          eq(appVersion.id, versionId),
          eq(appVersion.projectId, projectId),
          eq(appVersion.state, 'ready'),
        ),
      )
    if (row === undefined) throw new Failure('APP_VERSION_NOT_FOUND', { details: { versionId } })
    await tx.update(app).set({ liveVersionId: versionId }).where(eq(app.projectId, projectId))
    deps.log.info({ companyId, projectId, versionId }, 'APP_VERSION_LIVE')
    return versionView(row, versionId)
  })
}
