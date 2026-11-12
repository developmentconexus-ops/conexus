import type { CompanyId, CopyId, ProjectId } from '@conexus/hub-api'
import { PersonId } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import type { SqlAnswer } from '../../platform/company-postgres.ts'
import type { DatabaseUrl, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { speakerOf } from '../identity/public.ts'
import { sourcesOf } from './sources.ts'
import type { CopiesDeps, InCompany, StoredCopy } from './store.ts'
import { companyScope, copyTableOf, parsedCopy, personScope, storedCopy, syncOf } from './store.ts'
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
 * The release's row, taken back when the `GRANT` did not follow: a second transaction of the Hub,
 * so the list never says "liberada" for a copy the Projeto cannot read. If this fails too, both
 * failures are logged and the row stays: `applyGrants` gives it back at the next
 * `APP_DATABASE_READY` (data D22: the external effect never runs inside a transaction).
 */
async function undoRelease(deps: CopiesDeps, input: OfRelease): Promise<void> {
  const { companyId, projectId, copyId } = input
  try {
    await deps.database.command(personScope(input), async (tx) => {
      await tx
        .delete(projectCopy)
        .where(
          and(eq(projectCopy.projectId, input.projectId), eq(projectCopy.copyId, input.copyId)),
        )
    })
  } catch (error) {
    const reason = error instanceof Error ? error.name : 'UNKNOWN'
    deps.log.error({ companyId, projectId, copyId, reason }, 'COPY_RELEASE_UNDO_FAILED')
  }
}

/** What a release tells the company's database: the copy's table, and the columns the Projeto's logins read. */
export type Released = Readonly<{ name: string; columns: readonly string[]; accounts: boolean }>

/**
 * The copy's own columns less those of a kind the role of who releases lacks (decision `C1`): the
 * Projeto's logins read what that person may see, the engine's columns besides. Read in the
 * caller's transaction.
 */
export async function releaseOf(
  deps: CopiesDeps,
  tx: ReadTx,
  input: { companyId: CompanyId; stored: StoredCopy; by: PersonId },
): Promise<Released> {
  const { companyId, stored } = input
  const speaker = await speakerOf(tx, companyId, input.by)
  const held = new Set<string>(
    speaker === undefined ? [] : await deps.identity.personalKinds(companyId, speaker),
  )
  const kinds =
    stored.definition.version === 2
      ? deps.connectors().personalColumns(stored.connectorId, stored.definition)
      : new Map<string, string>()
  const columns = stored.definition.columns
    .map(({ name }) => name)
    .filter((name) => {
      const kind = kinds.get(name)
      return kind === undefined || held.has(kind)
    })
  const sources = await sourcesOf(tx, { companyId, copyId: stored.id })
  return { name: stored.name, columns, accounts: copyTableOf(stored, sources).accounts }
}

/**
 * The release in the company's database, with no transaction open (data D22): the Projeto's schema
 * and logins by their owner, `hub/apps`, then the `GRANT`, which repeats safely. None when the
 * Projeto's database did not open or the company has no sync login yet.
 */
export async function grantedInDatabase(
  deps: CopiesDeps,
  input: InCompany & { projectId: ProjectId },
  release: Released & { sync: DatabaseUrl | undefined },
): Promise<SqlAnswer | undefined> {
  const opened = await deps.apps().projectDatabase(input)
  const { sync, ...released } = release
  if (opened.kind !== 'OPEN' || sync === undefined) return undefined
  return deps.companyPostgres.grantCopy(sync, { ...released, projectId: input.projectId })
}

/**
 * Liberar: the release's row first, then, with no transaction open (data D22), the Projeto's
 * schema and logins by their owner, `hub/apps`, and the `GRANT`. A silent database answers 503
 * and the row this act made is taken back by a second transaction, so the Projeto reads nothing
 * the list does not show; doing it again starts over. A row an earlier act made stays.
 */
export async function grantCopy(deps: CopiesDeps, input: OfRelease): Promise<void> {
  const { released, sync, made } = await deps.database.command(personScope(input), async (tx) => {
    await deps.identity.admitMember({ tx, ...input, action: 'manageCopies' })
    const found = await bothOf(deps, tx, input)
    const inserted = await tx
      .insert(projectCopy)
      .values({
        ...{ companyId: input.companyId, projectId: input.projectId, copyId: input.copyId },
        ...{ grantedBy: input.personId, grantedAt: sql`statement_timestamp()` },
      })
      .onConflictDoNothing()
      .returning({ copyId: projectCopy.copyId })
    return {
      released: await releaseOf(deps, tx, { ...input, stored: found, by: input.personId }),
      sync: await syncOf(deps, tx, input.companyId),
      made: inserted.length > 0,
    }
  })
  const unavailable = new Failure('COPY_DATABASE_UNAVAILABLE')
  const granted = await grantedInDatabase(deps, input, { ...released, sync })
  if (granted?.kind !== 'DONE') {
    if (made) await undoRelease(deps, input)
    if (granted === undefined) throw unavailable
    throw refused(deps, input, granted)
  }
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

/** What each copy released to the Projeto tells the database, as the person who released it may see, and where the sync login is reached. */
function releasesOf(deps: CopiesDeps, input: OfProject) {
  return deps.database.read(companyScope(input.companyId), async (tx) => {
    const rows = await tx
      .select({ row: copy, by: projectCopy.grantedBy })
      .from(projectCopy)
      .innerJoin(copy, eq(copy.id, projectCopy.copyId))
      .where(eq(projectCopy.projectId, input.projectId))
    if (rows.length === 0) return undefined
    const sync = await syncOf(deps, tx, input.companyId)
    if (sync === undefined) return undefined
    const releases: Released[] = []
    for (const { row, by } of rows)
      releases.push(
        await releaseOf(deps, tx, {
          companyId: input.companyId,
          stored: parsedCopy(row),
          by: PersonId.parse(by),
        }),
      )
    return { releases, sync }
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
  for (const released of found.releases) {
    const granted = await deps.companyPostgres.grantCopy(found.sync, {
      ...released,
      projectId: input.projectId,
    })
    if (granted.kind !== 'DONE') return granted
  }
  return NOTHING
}
