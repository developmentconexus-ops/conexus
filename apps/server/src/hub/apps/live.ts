import { Manifest } from '@conexus/app-contract'
import type { AppVersion, CompanyId, OfProject, Person, ProjectId } from '@conexus/hub-api'
import { and, eq } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { SendDeps } from './send.ts'
import { admitPublisher } from './send.ts'
import { app, appVersion } from './tables.ts'
import { lockApp, VERSION_VIEW, versionView } from './versions.ts'

/** What the connectors lack at the Projeto for the connectors and operations a manifest declares (grants.ts). */
export type Ungranted = (
  tx: ReadTx,
  ids: OfProject,
  declared: NonNullable<Manifest['connectors']>,
) => Promise<readonly { connector: string; operation: string | null }[]>

/**
 * Publishes a kept version, in one transaction: only the published pointer changes, so the Prévia,
 * the Builder and the data stay as they are, and a send in course neither refuses it nor is failed
 * by it. Publishing the published version again changes nothing. A version pruned, failed, being
 * sent, of another Projeto or that never entered is not found. A version that declares a connector
 * the Projeto has no grant for, or an operation the kit does not read, is refused before the write.
 */
export function publishVersion(
  deps: SendDeps & { ungranted: Ungranted },
  input: { person: Person; companyId: CompanyId; projectId: ProjectId; number: number },
): Promise<AppVersion> {
  const { companyId, projectId, number } = input
  const scope = { kind: 'COMPANY', companyId, personId: input.person.id } as const
  return deps.database.command(scope, async (tx) => {
    await admitPublisher(deps, tx, input)
    const held = await lockApp(tx, input)
    const [row] = await tx
      .select({ ...VERSION_VIEW, manifest: appVersion.manifest })
      .from(appVersion)
      .where(
        and(
          eq(appVersion.projectId, projectId),
          eq(appVersion.number, number),
          eq(appVersion.state, 'ready'),
        ),
      )
    if (row === undefined) throw new Failure('APP_VERSION_NOT_FOUND', { details: { number } })
    const [lacking] = await deps.ungranted(
      tx,
      { companyId, projectId },
      Manifest.parse(row.manifest).connectors ?? [],
    )
    if (lacking !== undefined)
      throw new Failure('CONNECTOR_NOT_GRANTED', {
        details: { connector: lacking.connector, operation: lacking.operation ?? '' },
      })
    await tx.update(app).set({ publishedVersionId: row.id }).where(eq(app.projectId, projectId))
    deps.log.info({ by: input.person.id, companyId, projectId, number }, 'APP_VERSION_PUBLISHED')
    return versionView(row, { ...held, publishedVersionId: row.id })
  })
}
