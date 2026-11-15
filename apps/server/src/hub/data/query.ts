import { APP_CALL_LIMITS } from '@conexus/app-contract'
import type { QueryPage } from '@conexus/hub-api'
import { QUERY_ROWS } from '@conexus/hub-api'
import { z } from 'zod'
import type { ReadResult, SqlStatement } from '../../platform/app-sql.ts'
import type { SyncRead } from '../../platform/copy-reader.ts'
import { withoutPassColumn } from '../../platform/copy-sql.ts'
import { Failure } from '../../platform/failure.ts'
import type { NeonProjectId } from '../../platform/neon.ts'
import type { SessionScope } from '../connectors/public.ts'
import type { DataDeps } from './deps.ts'

const INSUFFICIENT_PRIVILEGE = '42501'

type PlanNode = { 'Relation Name'?: string; Schema?: string; Plans?: PlanNode[] }

const PlanNode: z.ZodType<PlanNode> = z.lazy(() =>
  z.looseObject({
    'Relation Name': z.string().optional(),
    Schema: z.string().optional(),
    Plans: z.array(PlanNode).optional(),
  }),
)
const Explained = z.tuple([z.looseObject({ Plan: PlanNode })])

function syncRelations(node: PlanNode): string[] {
  const own =
    node.Schema === 'sync' && node['Relation Name'] !== undefined ? [node['Relation Name']] : []
  return [...own, ...(node.Plans ?? []).flatMap(syncRelations)]
}

function relationsOf(explained: ReadResult): string[] | undefined {
  const parsed = Explained.safeParse(explained.rows[0]?.[0])
  if (!parsed.success) return undefined
  return [...new Set(syncRelations(parsed.data[0].Plan))]
}

function withDeadline(signal: AbortSignal | undefined): AbortSignal {
  const deadline = AbortSignal.timeout(APP_CALL_LIMITS.callDeadlineMs)
  return signal === undefined ? deadline : AbortSignal.any([signal, deadline])
}

type Ready = { host: string; neonProjectId: NeonProjectId }
type Asked = { deps: DataDeps; scope: SessionScope; ready: Ready }

function unavailable(deps: DataDeps, scope: SessionScope, cause: string): QueryPage {
  deps.log.error({ companyId: scope.companyId, cause }, 'DATA_QUERY_FAILED')
  return { kind: 'TABLE_UNAVAILABLE' }
}

function refused(deps: DataDeps, scope: SessionScope): QueryPage {
  deps.log.info({ companyId: scope.companyId, personId: scope.personId }, 'DATA_READ_REFUSED')
  return { kind: 'NOT_IN_ROLE' }
}

/** The statements as the read login of the place; a login not made yet is made as the owner and asked once more. */
async function readAs(
  { deps, scope, ready }: Asked,
  statements: readonly SqlStatement[],
  signal: AbortSignal,
): Promise<SyncRead | { kind: 'FAILED'; cause: string }> {
  const { place } = scope
  const address =
    place.kind === 'PROJECT'
      ? await deps.companyPostgres.readAddress(ready.host, place.projectId)
      : await deps.companyPostgres.readerAddress(ready.host)
  const read = await deps.companyPostgres.readCopies(address, statements, signal)
  if (read.kind !== 'NO_LOGIN') return read
  const owner = await deps.neon.ownerConnection(ready.neonProjectId)
  if (owner.kind !== 'DONE') return { kind: 'FAILED', cause: `OWNER_${owner.kind}` }
  const made =
    place.kind === 'PROJECT'
      ? await deps.companyPostgres.ensureReadLogin(owner.value, place.projectId)
      : await deps.companyPostgres.ensureReader(owner.value)
  if (made.kind !== 'DONE') {
    return {
      kind: 'FAILED',
      cause: `READ_LOGIN_${made.kind === 'REFUSED' ? made.code : made.kind}`,
    }
  }
  return deps.companyPostgres.readCopies(address, statements, signal)
}

function rowsOfRead({ deps, scope }: Asked, results: readonly ReadResult[]): QueryPage {
  const [plan, result] = results
  const used = plan === undefined ? undefined : relationsOf(plan)
  if (used === undefined || result === undefined) {
    deps.log.error({ companyId: scope.companyId, personId: scope.personId }, 'DATA_PLAN_UNREAD')
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'DATA_PLAN_UNREAD' } })
  }
  const kept = withoutPassColumn(result)
  return {
    kind: 'ROWS',
    columns: kept.columns.map(({ name }) => name),
    rows: kept.rows.slice(0, QUERY_ROWS),
    complete: kept.rows.length <= QUERY_ROWS,
    used,
  }
}

function pageOf(asked: Asked, read: Exclude<SyncRead, { kind: 'NO_LOGIN' }>): QueryPage {
  const { deps, scope } = asked
  switch (read.kind) {
    case 'ROWS':
      return rowsOfRead(asked, read.results)
    case 'REFUSED':
      return read.sqlstate === INSUFFICIENT_PRIVILEGE
        ? refused(deps, scope)
        : { kind: 'QUERY_REFUSED', sqlstate: read.sqlstate, message: read.message }
    case 'TOO_LARGE':
      return { kind: 'QUERY_TOO_LARGE' }
    case 'TIMEOUT':
      deps.log.error({ companyId: scope.companyId, cause: 'TIMEOUT' }, 'DATA_QUERY_FAILED')
      return { kind: 'DEADLINE' }
    case 'UNAVAILABLE':
      return unavailable(deps, scope, read.cause ?? 'UNAVAILABLE')
    default:
      return read satisfies never
  }
}

export async function queryOf(
  deps: DataDeps,
  scope: SessionScope,
  a: { sql: string; signal?: AbortSignal },
): Promise<QueryPage> {
  const { companyId, personId, place } = scope
  const { proof, ready } = await deps.database.read(
    { kind: 'COMPANY', companyId, personId },
    async (tx) => ({
      proof: await deps.identity.admitMember({ tx, companyId, personId, action: 'readCompany' }),
      ready: await deps.projects.readyDatabaseOf(tx, companyId),
    }),
  )
  if (ready?.host == null) return unavailable(deps, scope, 'NO_DATABASE')
  if (place.kind === 'COMPANY' && !deps.identity.allows(proof.role, 'readCopyRows')) {
    return refused(deps, scope)
  }
  const asked = { deps, scope, ready: { host: ready.host, neonProjectId: ready.neonProjectId } }
  const statements = [{ text: `EXPLAIN (VERBOSE, FORMAT JSON) ${a.sql}` }, { text: a.sql }]
  const read = await readAs(asked, statements, withDeadline(a.signal))
  if (read.kind === 'FAILED') return unavailable(deps, scope, read.cause)
  if (read.kind === 'NO_LOGIN') return unavailable(deps, scope, 'NO_LOGIN')
  return pageOf(asked, read)
}
