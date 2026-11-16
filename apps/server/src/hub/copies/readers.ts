import { isDeepStrictEqual } from 'node:util'
import type { CompanyId } from '@conexus/hub-api'
import { and, asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import type { WantedReader } from '../../platform/copy-reader.ts'
import type { DatabaseUrl } from '../../platform/database.ts'
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
