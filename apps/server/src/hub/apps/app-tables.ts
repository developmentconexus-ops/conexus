import { APP_CALL_LIMITS } from '@conexus/app-contract'
import type { CompanyId, PersonId, ProjectId, RowCount } from '@conexus/hub-api'
import { AppTableName, ROW_COUNT_CAP } from '@conexus/hub-api'
import { z } from 'zod'
import { quoted } from '../../platform/app-sql.ts'
import { Failure } from '../../platform/failure.ts'
import type { AppDatabaseDeps } from './app-database.ts'
import { readAppData } from './app-database.ts'

/** A column as the catalog names it; `type` is `format_type`'s text. */
type AppColumn = { name: string; type: string }
/** A table the read login may read: the schema the catalog found it in, its columns in order, and its primary key's columns in key order, empty when it has none. */
export type AppTable = { schema: string; name: AppTableName; columns: AppColumn[]; key: string[] }
/** Why a look at the app's database gave nothing: it was silent, past its deadline, or too long a reply. */
export type AppDataFailed = {
  kind: 'FAILED'
  code: 'APP_DATA_UNAVAILABLE' | 'APP_DATA_TIMEOUT' | 'APP_DATA_TOO_LARGE'
}
/** What a look at the app's tables gives: no app, the tables, or the app's database silent. */
export type AppTablesRead =
  | { kind: 'NO_APP' }
  | { kind: 'TABLES'; tables: AppTable[] }
  | AppDataFailed

export type AppReadInput = {
  scope: { companyId: CompanyId; personId: PersonId }
  projectId: ProjectId
  signal: AbortSignal
}

/**
 * The tables of the read login's schema with their columns and primary key, from the catalog. The
 * ledger of the migrations is listed by `pg_class` but the login holds no `SELECT` on it, which
 * `has_table_privilege` filters (`information_schema.columns` hides it too, but shows no key to a
 * login that only reads).
 */
export type TableSchema = 'APP'

/** The SQL that names each schema a table may live in: a closed union, never text from outside. */
const SCHEMA_SQL: Record<TableSchema, string> = { APP: 'current_schema()' }

function catalogSql(schema: TableSchema) {
  return `select n.nspname::text, c.relname,
  (select coalesce(jsonb_agg(jsonb_build_object('name', a.attname,
      'type', format_type(a.atttypid, a.atttypmod)) order by a.attnum), '[]')
     from pg_attribute a where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped),
  (select coalesce(array_agg(a.attname::text order by array_position(i.indkey::int2[], a.attnum)), '{}')
     from pg_index i join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
    where i.indrelid = c.oid and i.indisprimary)
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = ${SCHEMA_SQL[schema]} and c.relkind in ('r', 'p')
  and has_table_privilege(c.oid, 'SELECT')`
}

const CatalogRow = z.tuple([
  z.string(),
  AppTableName,
  z.array(z.object({ name: z.string(), type: z.string() })),
  z.array(z.string()),
])

async function catalogOf(
  deps: AppDatabaseDeps,
  input: AppReadInput,
  statement: { text: string; values?: string[] },
): Promise<AppTablesRead> {
  const read = await readAppData(deps, { ...input, statement })
  switch (read.kind) {
    case 'FAILED':
      return read.code === 'APP_DATA_NO_APP'
        ? { kind: 'NO_APP' }
        : { kind: 'FAILED', code: read.code }
    case 'REFUSED':
      throw new Failure('INTERNAL_UNEXPECTED', {
        details: { reason: 'APP_TABLES_UNREADABLE', answer: read.kind },
      })
    case 'ROWS': {
      const rows = z.array(CatalogRow).safeParse(read.rows)
      if (!rows.success) {
        throw new Failure('INTERNAL_UNEXPECTED', {
          details: { reason: 'APP_TABLES_UNREADABLE', answer: 'SHAPE' },
          cause: rows.error,
        })
      }
      return {
        kind: 'TABLES',
        tables: rows.data.map(([schema, name, columns, key]) => ({ schema, name, columns, key })),
      }
    }
    default:
      return read satisfies never
  }
}

/** Every table of the app in name order, or no app, or its database silent. */
export function appTablesOf(deps: AppDatabaseDeps, input: AppReadInput): Promise<AppTablesRead> {
  return catalogOf(deps, input, { text: `${catalogSql('APP')} order by c.relname` })
}

/** One table of `schema` by its name, bound as a value, or `NONE` when the catalog has none the login may read. */
export async function appTableOf(
  deps: AppDatabaseDeps,
  input: AppReadInput & { schema: TableSchema; name: AppTableName },
): Promise<AppTablesRead | { kind: 'NONE' }> {
  const found = await catalogOf(deps, input, {
    text: `${catalogSql(input.schema)} and c.relname = $1`,
    values: [input.name],
  })
  return found.kind === 'TABLES' && found.tables.length === 0 ? { kind: 'NONE' } : found
}

const Counted = z.array(z.tuple([AppTableName, z.coerce.number().int()]))

/**
 * How many rows each table has, up to one past the cap, which says "over": a `count(*)` over a
 * `limit` of the cap plus one, a row per table, the names quoted from the catalog's own. A read that
 * fails leaves every table unknown, never zero; a reply of the wrong shape is ours to fix, so it throws.
 */
export async function rowCountsOf(
  deps: AppDatabaseDeps,
  input: AppReadInput & { tables: readonly AppTableName[] },
): Promise<Map<AppTableName, RowCount>> {
  const { tables, ...rest } = input
  const unknown = new Map<AppTableName, RowCount>(tables.map((name) => [name, { kind: 'UNKNOWN' }]))
  if (tables.length === 0) return unknown
  const text = tables
    .map(
      (name, at) =>
        `select $${at + 2}::text, (select count(*)::int from (select 1 from ${quoted(name)} limit $1) s)`,
    )
    .join(' union all ')
  const read = await readAppData(deps, {
    ...rest,
    statement: { text, values: [ROW_COUNT_CAP + 1, ...tables] },
  })
  if (read.kind !== 'ROWS') return unknown
  const counted = Counted.safeParse(read.rows)
  if (!counted.success) {
    throw new Failure('INTERNAL_UNEXPECTED', {
      details: { reason: 'APP_COUNTS_UNREADABLE', answer: 'SHAPE' },
      cause: counted.error,
    })
  }
  return new Map(
    counted.data.map(([name, rows]): [AppTableName, RowCount] => [
      name,
      rows > ROW_COUNT_CAP ? { kind: 'OVER' } : { kind: 'EXACT', rows },
    ]),
  )
}

/** The deadline of one look at the app's database, joined to the request's own signal (code C57). */
export function withinDeadline(signal: AbortSignal): AbortSignal {
  return AbortSignal.any([signal, AbortSignal.timeout(APP_CALL_LIMITS.callDeadlineMs)])
}
