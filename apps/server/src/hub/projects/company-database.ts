import type { CompanyNickname } from '@conexus/hub-api'
import { CompanyId } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import type { CommandTx, Database, ReadTx } from '../../platform/database.ts'
import { databaseFailure } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { NeonProject, NeonProjects } from '../../platform/neon.ts'
import { companyProjectName, NEON_PREPARE_BUDGET_MS, NeonProjectId } from '../../platform/neon.ts'
import type { IdentityPorts } from '../identity/public.ts'
import { companyDatabase } from './tables.ts'

/** Past the `find` and `create` the holder makes, so a claim outlives the calls that hold it (docs/reference/boundaries.md). */
const CLAIM_MARGIN_MS = 5_000
const CLAIM_MS = NEON_PREPARE_BUDGET_MS + CLAIM_MARGIN_MS
const CLAIM_UNTIL = sql`statement_timestamp() + ${CLAIM_MS} * interval '1 millisecond'`

/**
 * Takes the right to call Neon for the company, or finds its database ready. The row is locked, so
 * two creations at once see one claim; a claim past its time is taken over, because its holder
 * either finished, in which case the project is found by the company's key, or never will (0040).
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
 * The company's project in Neon, found by the exact `-<companyId>` ending of its name or created as
 * `<nickname>-<companyId>`, with no transaction open (data D22, decision 0048). A project a cut reply
 * left is found and adopted; two with the key are a defect only a person can settle.
 */
export async function prepareDatabase(
  neon: NeonProjects,
  input: { companyId: CompanyId; nickname: CompanyNickname },
): Promise<Prepared> {
  const found = await neon.find(input.companyId)
  if (found.kind !== 'DONE') return found
  if (found.value.length > 1) {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'TWO_NEON_PROJECTS' } })
  }
  const [existing] = found.value
  if (existing !== undefined) return { kind: 'READY', id: existing.id }
  const made = await neon.create(companyProjectName(input))
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

type NamingDeps = {
  database: Database
  identity: IdentityPorts
  neon: NeonProjects
  log: FailureLog
}

/** The company a project's name ends in, `-<companyId>`, as `find` reads it (decision 0048). */
const COMPANY_KEY = /-([A-Za-z0-9]{32})$/

/**
 * Renames the company's project `<nickname>-<companyId>` when the Hub recorded it as the company's
 * ready database under another name; the company's own scope reads the row and the nickname, so no
 * read crosses companies. A project Neon lost meanwhile, to the company's deletion, needs nothing.
 */
async function nameDatabase(deps: NamingDeps, input: { companyId: CompanyId; found: NeonProject }) {
  const { companyId, found } = input
  const scope = { kind: 'COMPANY', companyId, personId: null } as const
  const nickname = await deps.database.read(scope, async (tx) => {
    const ready = await readyDatabaseOf(tx, companyId)
    if (ready?.neonProjectId !== found.id) return null
    return deps.identity.companyNicknameOf(tx, companyId)
  })
  if (nickname === null) return
  const name = companyProjectName({ nickname, companyId })
  if (name === found.name) return
  const renamed = await deps.neon.rename(found.id, name)
  if (renamed.kind !== 'DONE') {
    deps.log.error({ companyId, reason: renamed.kind }, 'COMPANY_DATABASE_RENAME_FAILED')
  } else if (renamed.value === 'renamed') {
    deps.log.info({ companyId, neonProjectId: found.id }, 'COMPANY_DATABASE_RENAMED')
  }
}

/**
 * One pass at start (architecture §8) over the companies' organization in Neon: a project whose
 * name ends in a company's id takes the name decision 0048 gives it, once; the next start finds
 * nothing to do. A company that fails is logged and left for the next start, and so is the whole
 * pass when Neon does not list; the Hub starts all the same.
 */
export async function nameDatabases(deps: NamingDeps): Promise<void> {
  const listed = await deps.neon.list()
  if (listed.kind !== 'DONE') {
    deps.log.error({ reason: listed.kind }, 'COMPANY_DATABASE_RENAME_FAILED')
    return
  }
  for (const found of listed.value) {
    const companyId = CompanyId.safeParse(COMPANY_KEY.exec(found.name)?.[1])
    if (!companyId.success) continue
    try {
      await nameDatabase(deps, { companyId: companyId.data, found })
    } catch (error) {
      const failure = error instanceof Failure ? error : databaseFailure(error)
      const reason = failure.code
      deps.log.error({ companyId: companyId.data, reason }, 'COMPANY_DATABASE_RENAME_FAILED')
    }
  }
}
