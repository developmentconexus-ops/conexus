import { APP_CALL_LIMITS } from '@conexus/app-contract'
import type { ProjectId, QueryPage } from '@conexus/hub-api'
import { QUERY_ROWS } from '@conexus/hub-api'
import type { ReadResult, SqlStatement } from '../../platform/app-sql.ts'
import type { SyncRead } from '../../platform/copy-reader.ts'
import { withoutPassColumn } from '../../platform/copy-sql.ts'
import { Failure } from '../../platform/failure.ts'
import type { NeonProjectId } from '../../platform/neon.ts'
import type { Principal } from '../access/public.ts'
import type { DataDeps } from './deps.ts'
import { planVerdict } from './plan.ts'

const INSUFFICIENT_PRIVILEGE = '42501'

function withDeadline(signal: AbortSignal | undefined): AbortSignal {
  const deadline = AbortSignal.timeout(APP_CALL_LIMITS.callDeadlineMs)
  return signal === undefined ? deadline : AbortSignal.any([signal, deadline])
}

type Ready = { host: string; neonProjectId: NeonProjectId }
type Asked = { deps: DataDeps; scope: Principal; ready: Ready; sql: string }

function unavailable(deps: DataDeps, scope: Principal, cause: string): QueryPage {
  deps.log.error({ companyId: scope.companyId, cause }, 'DATA_QUERY_FAILED')
  return { kind: 'TABLE_UNAVAILABLE' }
}

function refused(deps: DataDeps, scope: Principal): QueryPage {
  deps.log.info({ companyId: scope.companyId, personId: scope.personId }, 'DATA_READ_REFUSED')
  return { kind: 'NOT_IN_ROLE' }
}

/** The statements as the Projeto's read login; a login not made yet is made as the owner and asked once more. */
async function projectRead(
  { deps, ready }: Asked,
  projectId: ProjectId,
  statements: readonly SqlStatement[],
  signal: AbortSignal,
): Promise<SyncRead | { kind: 'FAILED'; cause: string }> {
  const address = await deps.companyPostgres.readAddress(ready.host, projectId)
  const read = await deps.companyPostgres.readCopies(address, statements, signal)
  if (read.kind !== 'NO_LOGIN') return read
  const owner = await deps.neon.ownerConnection(ready.neonProjectId)
  if (owner.kind !== 'DONE') return { kind: 'FAILED', cause: `OWNER_${owner.kind}` }
  const made = await deps.companyPostgres.ensureReadLogin(owner.value, projectId)
  if (made.kind !== 'DONE') {
    return {
      kind: 'FAILED',
      cause: `READ_LOGIN_${made.kind === 'REFUSED' ? made.code : made.kind}`,
    }
  }
  return deps.companyPostgres.readCopies(address, statements, signal)
}

function rowsOfRead(asked: Asked, results: readonly ReadResult[]): QueryPage {
  const { deps, scope } = asked
  const [plan, result] = results
  const verdict = plan === undefined ? undefined : planVerdict(asked.sql, plan)
  if (verdict === undefined || verdict.kind === 'UNREADABLE' || result === undefined) {
    deps.log.error({ companyId: scope.companyId, personId: scope.personId }, 'DATA_PLAN_UNREAD')
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'DATA_PLAN_UNREAD' } })
  }
  if (verdict.kind === 'OUTSIDE') {
    deps.log.info(
      { companyId: scope.companyId, personId: scope.personId, reason: verdict.reason },
      'DATA_QUERY_OUTSIDE_SYNC',
    )
    return { kind: 'NOT_IN_CATALOG' }
  }
  const kept = withoutPassColumn(result)
  return {
    kind: 'ROWS',
    columns: kept.columns.map(({ name }) => name),
    rows: kept.rows.slice(0, QUERY_ROWS),
    complete: kept.rows.length <= QUERY_ROWS,
    used: verdict.tables,
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
  scope: Principal,
  a: { sql: string; signal?: AbortSignal },
): Promise<QueryPage> {
  const { companyId, personId, place } = scope
  const { readers } = deps.copies()
  const { reader, ready } = await deps.database.read(
    { kind: 'COMPANY', companyId, personId },
    async (tx) => {
      const proof = await deps.identity.admitMember({
        tx,
        companyId,
        personId,
        action: 'readCompany',
      })
      return {
        reader: await readers.readerOf(deps, tx, { companyId, role: proof.role }),
        ready: await deps.projects.readyDatabaseOf(tx, companyId),
      }
    },
  )
  if (ready?.host == null) return unavailable(deps, scope, 'NO_DATABASE')
  const asked = {
    ...{ deps, scope, sql: a.sql },
    ready: { host: ready.host, neonProjectId: ready.neonProjectId },
  }
  const statements = [{ text: `EXPLAIN (VERBOSE, FORMAT JSON) ${a.sql}` }, { text: a.sql }]
  const signal = withDeadline(a.signal)
  const read =
    place.kind === 'PROJECT'
      ? await projectRead(asked, place.projectId, statements, signal)
      : await readers.readAs({ companyId, personId, host: ready.host, reader, statements, signal })
  if (read.kind === 'FAILED') return unavailable(deps, scope, read.cause)
  if (read.kind === 'NO_LOGIN') return unavailable(deps, scope, 'NO_LOGIN')
  if (read.kind === 'NOT_IN_ROLE') return read
  return pageOf(asked, read)
}
