import type { AppVersion, CompanyId, Person, ProjectId } from '@conexus/hub-api'
import { and, eq } from 'drizzle-orm'
import { Failure } from '../../platform/failure.ts'
import type { SendDeps } from './send.ts'
import { admitPublisher } from './send.ts'
import { app, appVersion } from './tables.ts'
import { lockApp, VERSION_VIEW, versionView } from './versions.ts'

/**
 * Publishes a kept version, in one transaction: only the published pointer changes, so the Prévia,
 * the Builder and the data stay as they are, and a send in course neither refuses it nor is failed
 * by it. Publishing the published version again changes nothing. A version pruned, failed, being
 * sent, of another Projeto or that never entered is not found.
 */
export function publishVersion(
  deps: SendDeps,
  input: { person: Person; companyId: CompanyId; projectId: ProjectId; number: number },
): Promise<AppVersion> {
  const { companyId, projectId, number } = input
  const scope = { kind: 'COMPANY', companyId, personId: input.person.id } as const
  return deps.database.command(scope, async (tx) => {
    await admitPublisher(deps, tx, input)
    const held = await lockApp(tx, input)
    const [row] = await tx
      .select(VERSION_VIEW)
      .from(appVersion)
      .where(
        and(
          eq(appVersion.projectId, projectId),
          eq(appVersion.number, number),
          eq(appVersion.state, 'ready'),
        ),
      )
    if (row === undefined) throw new Failure('APP_VERSION_NOT_FOUND', { details: { number } })
    await tx.update(app).set({ publishedVersionId: row.id }).where(eq(app.projectId, projectId))
    deps.log.info({ by: input.person.id, companyId, projectId, number }, 'APP_VERSION_PUBLISHED')
    return versionView(row, { ...held, publishedVersionId: row.id })
  })
}
