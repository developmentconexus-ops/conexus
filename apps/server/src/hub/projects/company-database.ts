import type { CompanyId } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import type { CommandTx, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { NeonProjects } from '../../platform/neon.ts'
import { companyProjectName, NEON_PREPARE_BUDGET_MS, NeonProjectId } from '../../platform/neon.ts'
import { companyDatabase } from './tables.ts'

/** Past the `find` and `create` the holder makes, so a claim outlives the calls that hold it (docs/reference/boundaries.md). */
const CLAIM_MARGIN_MS = 5_000
const CLAIM_MS = NEON_PREPARE_BUDGET_MS + CLAIM_MARGIN_MS
const CLAIM_UNTIL = sql`statement_timestamp() + ${CLAIM_MS} * interval '1 millisecond'`

/**
 * Takes the right to call Neon for the company, or finds its database ready. The row is locked, so
 * two creations at once see one claim; a claim past its time is taken over, because its holder
 * either finished, in which case the project is found by name, or never will (decision 0040).
 */
export async function claimDatabase(
  tx: CommandTx,
  companyId: CompanyId,
): Promise<'READY' | 'CLAIMED'> {
  const [row] = await tx
    .select({
      state: companyDatabase.state,
      held: sql<boolean>`${companyDatabase.claimedUntil} > statement_timestamp()`,
    })
    .from(companyDatabase)
    .where(eq(companyDatabase.companyId, companyId))
    .for('update')
  if (row?.state === 'ready') return 'READY'
  if (row?.held) throw new Failure('COMPANY_DATABASE_PREPARING')
  if (row === undefined) {
    await tx
      .insert(companyDatabase)
      .values({ companyId, state: 'creating', claimedUntil: CLAIM_UNTIL })
  } else {
    await tx
      .update(companyDatabase)
      .set({ claimedUntil: CLAIM_UNTIL })
      .where(eq(companyDatabase.companyId, companyId))
  }
  return 'CLAIMED'
}

/** Lets the next creation take the claim now; a database already ready is left as it is. */
export async function releaseClaim(tx: CommandTx, companyId: CompanyId): Promise<void> {
  await tx
    .update(companyDatabase)
    .set({ claimedUntil: sql`statement_timestamp()` })
    .where(and(eq(companyDatabase.companyId, companyId), eq(companyDatabase.state, 'creating')))
}

/** What the call to Neon left: the project, or what the caller does with the claim. */
type Prepared = { kind: 'READY'; id: NeonProjectId } | { kind: 'REFUSED' } | { kind: 'NO_ANSWER' }

/**
 * The company's project in Neon, found by its exact name or created, with no transaction open (data
 * D22). A project a cut reply left is found and adopted; two with the name are a defect only a
 * person can settle.
 */
export async function prepareDatabase(neon: NeonProjects, companyId: CompanyId): Promise<Prepared> {
  const name = companyProjectName(companyId)
  const found = await neon.find(name)
  if (found.kind !== 'DONE') return found
  if (found.value.length > 1) {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'TWO_NEON_PROJECTS' } })
  }
  const [existing] = found.value
  if (existing !== undefined) return { kind: 'READY', id: existing }
  const made = await neon.create(name)
  return made.kind === 'DONE' ? { kind: 'READY', id: made.value } : made
}

/** Records the project the claim's holder prepared; true when this call made the database ready. */
export async function markReady(
  tx: CommandTx,
  input: { companyId: CompanyId; neonProjectId: NeonProjectId },
): Promise<boolean> {
  const [row] = await tx
    .select({ state: companyDatabase.state, neonProjectId: companyDatabase.neonProjectId })
    .from(companyDatabase)
    .where(eq(companyDatabase.companyId, input.companyId))
    .for('update')
  if (row?.state === 'ready' && row.neonProjectId === input.neonProjectId) return false
  if (row?.state !== 'creating') {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'DATABASE_NOT_CLAIMED' } })
  }
  await tx
    .update(companyDatabase)
    .set({ state: 'ready', neonProjectId: input.neonProjectId, claimedUntil: null })
    .where(eq(companyDatabase.companyId, input.companyId))
  return true
}

/** The company's database once ready: its Neon project, and the host its apps reach, once read. */
export async function readyDatabaseOf(tx: ReadTx, companyId: CompanyId) {
  const [row] = await tx
    .select({ neonProjectId: companyDatabase.neonProjectId, host: companyDatabase.host })
    .from(companyDatabase)
    .where(and(eq(companyDatabase.companyId, companyId), eq(companyDatabase.state, 'ready')))
  if (row?.neonProjectId == null) return undefined
  return { neonProjectId: NeonProjectId.parse(row.neonProjectId), host: row.host }
}

/** Records the host Neon gave for the company's project, the one the dispatcher reaches. */
export async function recordDatabaseHost(
  tx: CommandTx,
  input: { companyId: CompanyId; host: string },
): Promise<void> {
  await tx
    .update(companyDatabase)
    .set({ host: input.host })
    .where(eq(companyDatabase.companyId, input.companyId))
}
