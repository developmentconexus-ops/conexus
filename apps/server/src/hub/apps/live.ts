import { Manifest } from '@conexus/app-contract'
import type {
  AppVersion,
  CompanyId,
  OfProject,
  Person,
  PersonId,
  ProjectId,
} from '@conexus/hub-api'
import { eq } from 'drizzle-orm'
import type { CommandTx, ReadTx } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { SendDeps } from './send.ts'
import { admitPublisher } from './send.ts'
import { app } from './tables.ts'
import { keptVersionOf, lockApp, versionView } from './versions.ts'

/** What the connectors lack at the Projeto for the connectors and operations a manifest declares (grants.ts). */
export type Ungranted = (
  tx: ReadTx,
  ids: OfProject,
  declared: NonNullable<Manifest['connectors']>,
) => Promise<readonly { connector: string; operation: string | null }[]>

/** Who published which version of a Projeto, in the publishing transaction. */
export type PublishInput = {
  companyId: CompanyId
  projectId: ProjectId
  number: number
  by: PersonId
}

/** Closes the Projeto's open request once another version, or the one asked, is published (step 24.3.4). */
export type CloseRequests = (tx: CommandTx, input: PublishInput) => Promise<void>

export type PublishDeps = { ungranted: Ungranted; closeRequests: CloseRequests; log: FailureLog }

/**
 * Publishes a kept version inside the caller's transaction, whoever admitted it: the app is locked
 * first (the order every publish and every decision keeps, code C65), then the version and its
 * connectors are checked, the pointer is written and the Projeto's open request closes. Publishing
 * the published version again changes nothing and closes no request.
 */
export async function publishIn(
  tx: CommandTx,
  deps: PublishDeps,
  input: PublishInput,
): Promise<AppVersion> {
  const { companyId, projectId, number } = input
  const held = await lockApp(tx, input)
  const row = await keptVersionOf(tx, input)
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
  const view = versionView(row, { ...held, publishedVersionId: row.id })
  if (held.publishedVersionId === row.id) return view
  await tx.update(app).set({ publishedVersionId: row.id }).where(eq(app.projectId, projectId))
  await deps.closeRequests(tx, input)
  deps.log.info({ by: input.by, companyId, projectId, number }, 'APP_VERSION_PUBLISHED')
  return view
}

/**
 * Publishes a kept version for an owner, an administrator or a developer, in one transaction: only
 * the published pointer changes, so the Prévia, the Builder and the data stay as they are, and a
 * send in course neither refuses it nor is failed by it. A version pruned, failed, being sent, of
 * another Projeto or that never entered is not found. A version that declares a connector the
 * Projeto has no grant for, or an operation the kit does not read, is refused before the write.
 */
export function publishVersion(
  deps: SendDeps & PublishDeps,
  input: { person: Person; companyId: CompanyId; projectId: ProjectId; number: number },
): Promise<AppVersion> {
  const { companyId, projectId, number } = input
  const scope = { kind: 'COMPANY', companyId, personId: input.person.id } as const
  return deps.database.command(scope, async (tx) => {
    await admitPublisher(deps, tx, input)
    return publishIn(tx, deps, { companyId, projectId, number, by: input.person.id })
  })
}
