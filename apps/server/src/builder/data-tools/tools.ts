import type { CompanyData, DataOrigin, DataResult, ReadAnswer } from '@conexus/hub-api'
import { DATA_TOOL, DESCRIBE_SAMPLE_ROWS, QUERY_SQL_MAX } from '@conexus/hub-api'
import type { ToolsInput } from '@mastra/core/agent'
import type { RequestContext } from '@mastra/core/request-context'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import type { FailureLog } from '../../platform/failure.ts'

/** The data a conversation may read: bound to its place and its person, or none when the conversation has no scope. */
export type DataOf = (requestContext: RequestContext) => Promise<CompanyData | undefined>

type Described = Extract<Awaited<ReturnType<CompanyData['describe']>>, { kind: 'CATALOG' }>
type Kept = Described['tables'][number]['kept']

/**
 * The failure a data tool throws for each refusal (code C79): Mastra wraps it in
 * `TOOL_EXECUTION_FAILED` and hands the model its message, the JSON `{ kind, status, code, message,
 * body, reason }`, as a tool failure. The screen reads it back with `thrownOf`.
 */
class DataRefused extends Error {
  override readonly name = 'DataRefused'
}

const REASONS = {
  NOT_GRANTED: "This conversation has no access to the company's data.",
  NOT_IN_CATALOG: 'No such table in the catalog. Call data_describe with no table to list them.',
  NOT_IN_ROLE:
    'PostgreSQL denied this statement: the role of the person does not read one of its tables, or the statement is not a read. Say so; do not look for the data elsewhere.',
  QUERY_TOO_LARGE: 'The answer is too large. Aggregate or add LIMIT.',
  DEADLINE: 'The query took too long. Narrow it.',
  TABLE_UNAVAILABLE:
    "The company's database did not answer. Do not read the system live in its place; tell the person to try again.",
  CATALOG_UNAVAILABLE: 'The catalog did not answer. Tell the person to try again.',
} as const

type Refusal =
  | { kind: keyof typeof REASONS }
  | { kind: 'QUERY_REFUSED'; sqlstate: string; message: string }

function refused(refusal: Refusal): never {
  const told =
    refusal.kind === 'QUERY_REFUSED'
      ? {
          code: refusal.sqlstate,
          message: refusal.message,
          reason: `PostgreSQL refused the query (SQLSTATE ${refusal.sqlstate}); its message is in message. 42601 is a syntax error, 42703 a column that does not exist, 42P01 a table that does not exist, 25006 a write. Correct it and try again.`,
        }
      : { code: null, message: null, reason: REASONS[refusal.kind] }
  throw new DataRefused(JSON.stringify({ kind: refusal.kind, status: null, body: null, ...told }))
}

/** Throws the refusal an answer of the contract stands for; an answer a table or a query read never gets is a defect, thrown as one. */
function refusedBy(answer: ReadAnswer | { kind: 'CATALOG_UNAVAILABLE' }): never {
  switch (answer.kind) {
    case 'QUERY_REFUSED':
      return refused(answer)
    case 'NOT_IN_CATALOG':
    case 'NOT_IN_ROLE':
    case 'QUERY_TOO_LARGE':
    case 'DEADLINE':
    case 'TABLE_UNAVAILABLE':
    case 'CATALOG_UNAVAILABLE':
      return refused({ kind: answer.kind })
    case 'TABLE':
    case 'QUERY':
    case 'LIVE':
    case 'REFUSED':
    case 'AUTH_REFUSED':
    case 'TOKEN_EXPIRED':
    case 'UNREADABLE':
    case 'BUSY':
    case 'UNREACHABLE':
    case 'NOT_GRANTED':
    case 'CALLS_SPENT':
      throw new Error(`The contract answered ${answer.kind} to a table or query read`)
    default:
      return answer satisfies never
  }
}

/** Where a table's rows came from, by the names the catalog gives its systems; none, with a log, when a connection is not in the catalog: its id is never a name. */
function originIn(
  table: string,
  kept: Kept,
  catalog: Described,
  log: Pick<FailureLog, 'error'>,
): DataOrigin | undefined {
  const systems: Described['systems'] = []
  for (const connection of kept.connections) {
    const found = catalog.systems.find((each) => each.connection === connection)
    if (found === undefined) {
      log.error({ table, connection: String(connection) }, 'DATA_ORIGIN_UNREAD')
      return undefined
    }
    systems.push(found)
  }
  const [first] = systems
  if (first === undefined) return undefined
  const { lastRun } = kept
  return {
    systems: systems.map((each) => each.name),
    connector: first.connector,
    table,
    lastRunEndedAt: lastRun?.endedAt ?? null,
    lastRun: lastRun?.outcome.kind ?? 'NONE',
  }
}

/** The origin of a table that was asked for by name or read by a query: without it the answer is refused. */
function originOf(table: string, kept: Kept, catalog: Described, log: Pick<FailureLog, 'error'>) {
  return originIn(table, kept, catalog, log) ?? refused({ kind: 'CATALOG_UNAVAILABLE' })
}

const DESCRIBE_DESCRIPTION =
  "Lists the company's copied tables this person may read, or, given a table, shows its columns and its first five rows. Call it with no table first: each table comes with what it holds, the system it was copied from and how its last run ended. Then call it with the table to read its columns and rows before you write a query. Write a table with its schema (sync.sankhya_vendas). A copy has no row count here."

const QUERY_DESCRIPTION =
  "Reads the company's copied data with one PostgreSQL SELECT, on the tables data_describe lists, each written with its schema (sync.sankhya_vendas), with every column in double quotes in the case the table lists. One statement only, and it cannot write. Aggregate in SQL and add LIMIT: the answer is cut to the first rows. The answer says where the rows came from in origin. A refusal carries PostgreSQL's SQLSTATE; fix the query and try again."

type Log = Pick<FailureLog, 'error'>
type Signal = AbortSignal | undefined

async function catalogOf(data: CompanyData, signal: Signal): Promise<Described> {
  const described = await data.describe({ signal })
  return described.kind === 'CATALOG' ? described : refused({ kind: described.kind })
}

function listed(catalog: Described, log: Log): DataResult {
  return {
    kind: 'CATALOG',
    systems: catalog.systems.map(({ name, connector, reads }) => ({
      name,
      connector,
      reads: reads.map(({ operation, label, summary }) => ({ operation, label, summary })),
    })),
    tables: catalog.tables.flatMap((each) => {
      const found = originIn(each.name, each.kept, catalog, log)
      if (found === undefined) return []
      const { table: _table, ...origin } = found
      return [{ name: each.name, label: each.label, description: each.description, ...origin }]
    }),
  }
}

async function tabled(
  a: Readonly<{ data: CompanyData; catalog: Described; table: string; signal: Signal; log: Log }>,
): Promise<DataResult> {
  const { data, catalog, table, signal, log } = a
  const found = catalog.tables.find((each) => each.name === table)
  if (found === undefined) return refused({ kind: 'NOT_IN_CATALOG' })
  const origin = originOf(found.name, found.kept, catalog, log)
  const answer = await data.read({ kind: 'TABLE', table, signal })
  if (answer.kind !== 'TABLE') return refusedBy(answer)
  const { name, label, description, columns } = found
  const sample = {
    rows: answer.rows.slice(0, DESCRIBE_SAMPLE_ROWS),
    more: !answer.complete || answer.rows.length > DESCRIBE_SAMPLE_ROWS,
  }
  return { kind: 'TABLE', name, label, description, columns, sample, origin }
}

async function queried(
  a: Readonly<{ data: CompanyData; sql: string; signal: Signal; log: Log }>,
): Promise<DataResult> {
  const { data, sql, signal, log } = a
  const answer = await data.read({ kind: 'QUERY', sql, signal })
  if (answer.kind !== 'QUERY') return refusedBy(answer)
  const catalog = await catalogOf(data, signal)
  const origin = answer.tables.map((each) => originOf(each.table, each.kept, catalog, log))
  const { columns, rows, complete } = answer
  return origin.length === 0
    ? {
        kind: 'ROWS',
        columns,
        rows,
        complete,
        origin,
        reason: 'The origin of these rows was not identified: say so.',
      }
    : { kind: 'ROWS', columns, rows, complete, origin }
}

/** The two tools that read the company's copied data, the same for every agent; each request decides what it may read. */
export function dataTools(deps: { dataOf: DataOf; log: Log }): ToolsInput {
  const { dataOf, log } = deps

  async function dataFor(requestContext: RequestContext | undefined): Promise<CompanyData> {
    const data = requestContext === undefined ? undefined : await dataOf(requestContext)
    if (data === undefined) return refused({ kind: 'NOT_GRANTED' })
    return data
  }

  return {
    [DATA_TOOL.describe]: createTool({
      id: DATA_TOOL.describe,
      description: DESCRIBE_DESCRIPTION,
      inputSchema: z.object({ table: z.string().max(40).optional() }),
      execute: async ({ table }, { requestContext, abortSignal: signal }) => {
        const data = await dataFor(requestContext)
        const catalog = await catalogOf(data, signal)
        return table === undefined
          ? listed(catalog, log)
          : tabled({ data, catalog, table, signal, log })
      },
    }),
    [DATA_TOOL.query]: createTool({
      id: DATA_TOOL.query,
      description: QUERY_DESCRIPTION,
      inputSchema: z.object({ sql: z.string().trim().min(1).max(QUERY_SQL_MAX) }),
      execute: async ({ sql }, { requestContext, abortSignal: signal }) =>
        queried({ data: await dataFor(requestContext), sql, signal, log }),
    }),
  }
}
