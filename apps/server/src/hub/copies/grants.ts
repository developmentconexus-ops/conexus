import type { CompanyId, CopyId, ProjectId } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import type { SqlAnswer } from '../../platform/company-postgres.ts'
import type { ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { CopiesDeps, InCompany } from './store.ts'
import { companyScope, personScope, storedCopy, syncOf } from './store.ts'
import { copy, projectCopy } from './tables.ts'

export type OfRelease = InCompany & { projectId: ProjectId; copyId: CopyId }

/** The copy and the Projeto, both the company's and alive; either missing is not found (S10). */
async function bothOf(deps: CopiesDeps, tx: ReadTx, input: OfRelease) {
  const found = await storedCopy(tx, input)
  if (found === undefined) throw new Failure('COPY_NOT_FOUND')
  if ((await deps.projects.liveProjectOf(tx, input)) === undefined)
    throw new Failure('NOT_FOUND', { details: { reason: 'NO_PROJECT' } })
  return found
}

function refused(deps: CopiesDeps, input: OfRelease, answer: Exclude<SqlAnswer, { kind: 'DONE' }>) {
  const code = answer.kind === 'REFUSED' ? answer.code : answer.kind
  const { companyId, projectId, copyId } = input
  deps.log.error({ companyId, projectId, copyId, code }, 'COPY_GRANT_FAILED')
  return new Failure('COPY_DATABASE_UNAVAILABLE')
}

/**
 * Liberar: the release's row first, then, with no transaction open (data D22), the Projeto's
 * schema and logins by their owner, `hub/apps`, and the `GRANT`. A silent database answers 503 and
 * keeps the row; doing it again finishes.
 */
export async function grantCopy(deps: CopiesDeps, input: OfRelease): Promise<void> {
  const { name, sync } = await deps.database.command(personScope(input), async (tx) => {
    await deps.identity.admitMember({ tx, ...input, action: 'manageCopies' })
    const found = await bothOf(deps, tx, input)
    await tx
      .insert(projectCopy)
      .values({
        ...{ companyId: input.companyId, projectId: input.projectId, copyId: input.copyId },
        ...{ grantedBy: input.personId, grantedAt: sql`statement_timestamp()` },
      })
      .onConflictDoNothing()
    return { name: found.name, sync: await syncOf(deps, tx, input.companyId) }
  })
  const unavailable = new Failure('COPY_DATABASE_UNAVAILABLE')
  if ((await deps.apps().projectDatabase(input)).kind !== 'OPEN' || sync === undefined)
    throw unavailable
  const granted = await deps.companyPostgres.grantCopy(sync, { name, projectId: input.projectId })
  if (granted.kind !== 'DONE') throw refused(deps, input, granted)
  const { companyId, projectId, copyId } = input
  deps.log.info({ companyId, projectId, copyId }, 'COPY_GRANTED')
}

/** Tirar: the `REVOKE` first, outside any transaction (data D22), and only then the row; a silent database keeps it. */
export async function revokeCopy(deps: CopiesDeps, input: OfRelease): Promise<void> {
  const { name, sync } = await deps.database.command(personScope(input), async (tx) => {
    await deps.identity.admitMember({ tx, ...input, action: 'manageCopies' })
    const found = await bothOf(deps, tx, input)
    return { name: found.name, sync: await syncOf(deps, tx, input.companyId) }
  })
  if (sync !== undefined) {
    const taken = await deps.companyPostgres.revokeCopy(sync, {
      copy: name,
      projectId: input.projectId,
    })
    if (taken.kind !== 'DONE') throw refused(deps, input, taken)
  }
  await deps.database.command(personScope(input), async (tx) => {
    await deps.identity.admitMember({ tx, ...input, action: 'manageCopies' })
    await tx
      .delete(projectCopy)
      .where(and(eq(projectCopy.projectId, input.projectId), eq(projectCopy.copyId, input.copyId)))
  })
  const { companyId, projectId, copyId } = input
  deps.log.info({ companyId, projectId, copyId }, 'COPY_REVOKED')
}

type OfProject = { companyId: CompanyId; projectId: ProjectId }

/** The names of the copies released to the Projeto, and where the sync login is reached. */
function releasesOf(deps: CopiesDeps, input: OfProject) {
  return deps.database.read(companyScope(input.companyId), async (tx) => {
    const rows = await tx
      .select({ name: copy.name })
      .from(projectCopy)
      .innerJoin(copy, eq(copy.id, projectCopy.copyId))
      .where(eq(projectCopy.projectId, input.projectId))
    if (rows.length === 0) return undefined
    const sync = await syncOf(deps, tx, input.companyId)
    return sync === undefined ? undefined : { names: rows.map((row) => row.name), sync }
  })
}

const NOTHING: SqlAnswer = { kind: 'DONE', value: [] }

/** Before an app's logins are dropped: every release of the Projeto and the schema revoked, so `DROP ROLE` passes. */
export async function revokeAllOf(deps: CopiesDeps, input: OfProject): Promise<SqlAnswer> {
  const found = await releasesOf(deps, input)
  if (found === undefined) return NOTHING
  return deps.companyPostgres.revokeCopy(found.sync, { copy: 'ALL', projectId: input.projectId })
}

/** After an app's logins are made again: every release of the Projeto granted again (repair only). */
export async function applyGrants(deps: CopiesDeps, input: OfProject): Promise<SqlAnswer> {
  const found = await releasesOf(deps, input)
  if (found === undefined) return NOTHING
  for (const name of found.names) {
    const granted = await deps.companyPostgres.grantCopy(found.sync, {
      name,
      projectId: input.projectId,
    })
    if (granted.kind !== 'DONE') return granted
  }
  return NOTHING
}
