import type { CopyId, Role, RoleId } from '@conexus/hub-api'
import { CopyId as CopyIdSchema } from '@conexus/hub-api'
import { and, eq, inArray, sql } from 'drizzle-orm'
import type { CommandTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { marksOf, readsAll, reconciled } from './readers.ts'
import type { CopiesDeps, InCompany } from './store.ts'
import { personScope } from './store.ts'
import { copy, copyReader } from './tables.ts'

type Mark = Pick<typeof copyReader.$inferSelect, 'grantedBy' | 'grantedAt'> & { copyId: CopyId }
type Change = { roleId: RoleId; wanted: CopyId[]; removed: Mark[]; added: CopyId[] }

async function changedMarks(
  deps: CopiesDeps,
  tx: CommandTx,
  input: InCompany & { role: Role; copies: readonly CopyId[] },
): Promise<Change> {
  const { companyId, personId } = input
  if (readsAll(input.role)) throw new Failure('ROLE_FIXED')
  const rows = await deps.identity.companyRoleRows(tx, companyId)
  const row = rows.find(({ role }) => role === input.role)
  if (row === undefined) throw new Failure('ROLE_NOT_FOUND')
  const wanted = [...new Set(input.copies)]
  const found =
    wanted.length === 0
      ? []
      : await tx
          .select({ id: copy.id })
          .from(copy)
          .where(and(eq(copy.companyId, companyId), inArray(copy.id, wanted)))
  if (found.length !== wanted.length) throw new Failure('COPY_NOT_FOUND')
  const current = await marksOf(tx, companyId, row.id)
  const taken = current.filter((copyId) => !wanted.includes(copyId))
  const added = wanted.filter((copyId) => !current.includes(copyId))
  const deleted =
    taken.length === 0
      ? []
      : await tx
          .delete(copyReader)
          .where(
            and(
              eq(copyReader.companyId, companyId),
              eq(copyReader.roleId, row.id),
              inArray(copyReader.copyId, taken),
            ),
          )
          .returning({
            copyId: copyReader.copyId,
            grantedBy: copyReader.grantedBy,
            grantedAt: copyReader.grantedAt,
          })
  const removed = deleted.map((mark) => ({ ...mark, copyId: CopyIdSchema.parse(mark.copyId) }))
  if (added.length > 0) {
    await tx.insert(copyReader).values(
      added.map((copyId) => ({
        ...{ companyId, copyId, roleId: row.id, grantedBy: personId },
        grantedAt: sql`statement_timestamp()`,
      })),
    )
  }
  return { roleId: row.id, wanted, removed, added }
}

function restoredMarks(deps: CopiesDeps, input: InCompany, change: Change): Promise<void> {
  const { companyId } = input
  const { roleId, removed, added } = change
  return deps.database.command(personScope(input), async (tx) => {
    await deps.identity.lockCompany(tx, companyId)
    if (removed.length > 0) {
      await tx
        .insert(copyReader)
        .values(removed.map((mark) => ({ ...mark, companyId, roleId })))
        .onConflictDoNothing()
    }
    if (added.length > 0) {
      await tx
        .delete(copyReader)
        .where(
          and(
            eq(copyReader.companyId, companyId),
            eq(copyReader.roleId, roleId),
            inArray(copyReader.copyId, added),
          ),
        )
    }
  })
}

async function undone(
  deps: CopiesDeps,
  input: InCompany & { role: Role },
  change: Change,
): Promise<never> {
  const { companyId, role } = input
  try {
    await restoredMarks(deps, input, change)
  } catch (error) {
    deps.log.error({ companyId, role }, 'COPY_READERS_PENDING')
    throw new Failure('COPY_DATABASE_UNAVAILABLE', { cause: error })
  }
  throw new Failure('COPY_DATABASE_UNAVAILABLE')
}

async function reconciledOrRestored(deps: CopiesDeps, input: InCompany, change: Change) {
  try {
    return await reconciled(deps, input)
  } catch (error) {
    await restoredMarks(deps, input, change)
    throw error
  }
}

/**
 * The copies a role reads: the Hub's marks first, under the company's lock, then, with no
 * transaction open (data D22), the company's database made to match. A silent database that was
 * to take a read away answers 503 with the Hub's marks restored, so the login never reads more
 * than the Hub says; one that was only to give answers 200, and the next read or run gives it.
 */
export async function setRoleCopies(
  deps: CopiesDeps,
  input: InCompany & { role: Role; copies: readonly CopyId[] },
): Promise<CopyId[]> {
  const { companyId, personId, role } = input
  const change = await deps.database.command(personScope(input), async (tx) => {
    await deps.identity.lockCompany(tx, companyId)
    await deps.identity.admitMember({ tx, companyId, personId, action: 'manageRoles' })
    return changedMarks(deps, tx, input)
  })
  const outcome = await reconciledOrRestored(deps, input, change)
  switch (outcome) {
    case 'DONE': {
      const counts = { added: change.added.length, removed: change.removed.length }
      deps.log.info({ companyId, role, by: personId, ...counts }, 'COPY_READERS_SET')
      return change.wanted
    }
    case 'FAILED':
      if (change.removed.length > 0) return undone(deps, input, change)
      deps.log.info({ companyId, role }, 'COPY_READERS_PENDING')
      return change.wanted
    default:
      return outcome satisfies never
  }
}
