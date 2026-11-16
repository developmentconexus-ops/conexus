import { isDeepStrictEqual } from 'node:util'
import type { CompanyId, CopyId, FixedRole, Role, RoleId } from '@conexus/hub-api'
import { CopyId as CopyIdSchema, fixedNameOf } from '@conexus/hub-api'
import { and, asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import type { SqlStatement } from '../../platform/app-sql.ts'
import type { SyncRead, WantedReader } from '../../platform/copy-reader.ts'
import type { DatabaseUrl, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { CopiesDeps, InCompany } from './store.ts'
import { companyOwner, companyScope } from './store.ts'
import { copy, copyReader } from './tables.ts'

const Ticket = z.object({ ticket: z.coerce.bigint() })

function wantedOf(deps: CopiesDeps, companyId: CompanyId): Promise<WantedReader[]> {
  return deps.database.read(companyScope(companyId), async (tx) => {
    const roles = await deps.identity.companyRoleRows(tx, companyId)
    const marks = await tx
      .select({ roleId: copyReader.roleId, name: copy.name })
      .from(copyReader)
      .innerJoin(
        copy,
        and(eq(copy.companyId, copyReader.companyId), eq(copy.id, copyReader.copyId)),
      )
      .where(eq(copyReader.companyId, companyId))
      .orderBy(asc(copy.name))
    return roles.map(({ id }) => ({
      roleId: id,
      tables: marks.filter((mark) => mark.roleId === id).map((mark) => mark.name),
    }))
  })
}

type Applied =
  | { kind: 'DONE'; wanted: WantedReader[] }
  | { kind: 'SUPERSEDED' }
  | { kind: 'FAILED'; code: string }

async function appliedOnce(
  deps: CopiesDeps,
  companyId: CompanyId,
  owner: DatabaseUrl,
): Promise<Applied> {
  const taken = await deps.companyPostgres.takeReadersTicket(owner)
  if (taken.kind !== 'DONE') return { kind: 'FAILED', code: codeOf(taken) }
  const { ticket } = Ticket.parse(taken.value.at(-1)?.[0])
  const wanted = await wantedOf(deps, companyId)
  try {
    const answer = await deps.companyPostgres.reconcileReaders(owner, ticket, wanted)
    if (answer.kind === 'SUPERSEDED') return answer
    return answer.kind === 'DONE'
      ? { kind: 'DONE', wanted }
      : { kind: 'FAILED', code: codeOf(answer) }
  } catch (error) {
    if (error instanceof Failure && error.details.reason === 'COPY_READER_NAME') {
      deps.log.error({ companyId }, 'COPY_READER_NAME')
    }
    throw error
  }
}

function codeOf(answer: { kind: string; code?: string }): string {
  return answer.code ?? answer.kind
}

export async function reconciled(deps: CopiesDeps, input: InCompany): Promise<'DONE' | 'FAILED'> {
  const { companyId } = input
  const owner = await companyOwner(deps, input)
  if (owner === undefined) {
    deps.log.error({ companyId, reason: 'NO_OWNER' }, 'COPY_READERS_FAILED')
    return 'FAILED'
  }
  const first = await appliedOnce(deps, companyId, owner)
  const changed =
    first.kind === 'DONE' && !isDeepStrictEqual(await wantedOf(deps, companyId), first.wanted)
  const applied = changed ? await appliedOnce(deps, companyId, owner) : first
  switch (applied.kind) {
    case 'DONE':
      return 'DONE'
    case 'SUPERSEDED':
      deps.log.info({ companyId }, 'COPY_READERS_SUPERSEDED')
      return 'DONE'
    case 'FAILED':
      deps.log.error({ companyId, code: applied.code }, 'COPY_READERS_FAILED')
      return 'FAILED'
    default:
      return applied satisfies never
  }
}

const READS_ALL: ReadonlySet<FixedRole> = new Set(['owner', 'admin'])

/** Which login a person reads the company's copies with: conexus_read for an owner or an administrator, the role's for the others. */
export type ReaderLogin = Readonly<
  { kind: 'ALL' } | { kind: 'ROLE'; roleId: RoleId } | { kind: 'NONE' }
>

function readsAll(role: Role): boolean {
  const fixed = fixedNameOf(role)
  return fixed !== undefined && READS_ALL.has(fixed)
}

async function marksOf(tx: ReadTx, companyId: CompanyId, roleId: RoleId): Promise<CopyId[]> {
  const rows = await tx
    .select({ copyId: copyReader.copyId })
    .from(copyReader)
    .where(and(eq(copyReader.companyId, companyId), eq(copyReader.roleId, roleId)))
  return rows.map(({ copyId }) => CopyIdSchema.parse(copyId))
}

export async function readerOf(
  deps: Pick<CopiesDeps, 'identity'>,
  tx: ReadTx,
  input: { companyId: CompanyId; role: Role },
): Promise<ReaderLogin> {
  if (readsAll(input.role)) return { kind: 'ALL' }
  const rows = await deps.identity.companyRoleRows(tx, input.companyId)
  const row = rows.find(({ role }) => role === input.role)
  return row === undefined ? { kind: 'NONE' } : { kind: 'ROLE', roleId: row.id }
}

/** The copies a role reads: every one for an owner or an administrator, the role's marks for the others, none for a role with no row. */
export async function copiesReadBy(
  deps: Pick<CopiesDeps, 'identity'>,
  tx: ReadTx,
  input: { companyId: CompanyId; role: Role },
): Promise<'ALL' | CopyId[]> {
  const reader = await readerOf(deps, tx, input)
  switch (reader.kind) {
    case 'ALL':
      return 'ALL'
    case 'NONE':
      return []
    case 'ROLE':
      return marksOf(tx, input.companyId, reader.roleId)
    default:
      return reader satisfies never
  }
}

type Asking = InCompany & {
  host: string
  statements: readonly SqlStatement[]
  signal: AbortSignal
}

async function asReadLogin(deps: CopiesDeps, input: Asking): Promise<SyncRead> {
  const { companyId, host, statements, signal } = input
  const address = await deps.companyPostgres.readerAddress(host)
  const first = await deps.companyPostgres.readCopies(address, statements, signal)
  if (first.kind !== 'NO_LOGIN') return first
  const owner = await companyOwner(deps, input)
  if (owner === undefined) return { kind: 'UNAVAILABLE', cause: 'NO_OWNER' }
  const made = await deps.companyPostgres.ensureReader(owner)
  if (made.kind !== 'DONE') {
    const code = made.kind === 'REFUSED' ? made.code : made.kind
    deps.log.error({ companyId, code }, 'COPY_DATABASE_FAILED')
    return { kind: 'UNAVAILABLE', cause: `READER_${code}` }
  }
  deps.log.info({ companyId }, 'COPY_READER_MADE')
  return deps.companyPostgres.readCopies(address, statements, signal)
}

const INSUFFICIENT_PRIVILEGE = '42501'

function refusedRead(read: SyncRead): boolean {
  return read.kind === 'REFUSED' && read.sqlstate === INSUFFICIENT_PRIVILEGE
}

function notInRole(deps: CopiesDeps, input: InCompany): { kind: 'NOT_IN_ROLE' } {
  deps.log.info({ companyId: input.companyId, personId: input.personId }, 'DATA_READ_REFUSED')
  return { kind: 'NOT_IN_ROLE' }
}

async function askRoleThenRepair(
  deps: CopiesDeps,
  input: Asking & { roleId: RoleId },
): Promise<SyncRead | { kind: 'NOT_IN_ROLE' }> {
  const { companyId, host, roleId, statements, signal } = input
  const address = await deps.companyPostgres.roleAddress(host, roleId)
  const first = await deps.companyPostgres.readCopies(address, statements, signal)
  if (first.kind !== 'NO_LOGIN' && !refusedRead(first)) return first
  const marks = await deps.database.read(companyScope(companyId), (tx) =>
    marksOf(tx, companyId, roleId),
  )
  if (marks.length === 0) return notInRole(deps, input)
  const outcome = await reconciled(deps, input)
  switch (outcome) {
    case 'FAILED':
      return first
    case 'DONE':
      break
    default:
      return outcome satisfies never
  }
  const again = await deps.companyPostgres.readCopies(address, statements, signal)
  if (refusedRead(again)) return notInRole(deps, input)
  if (again.kind === 'ROWS') deps.log.info({ companyId, roleId }, 'COPY_READERS_REPAIRED')
  return again
}

/** As the login of whoever asks, with its repair: the one place that picks the address a company read goes to. */
export async function readAs(
  deps: CopiesDeps,
  input: Asking & { reader: ReaderLogin },
): Promise<SyncRead | { kind: 'NOT_IN_ROLE' }> {
  const { reader } = input
  switch (reader.kind) {
    case 'NONE':
      return notInRole(deps, input)
    case 'ALL':
      return asReadLogin(deps, input)
    case 'ROLE':
      return askRoleThenRepair(deps, { ...input, roleId: reader.roleId })
    default:
      return reader satisfies never
  }
}
