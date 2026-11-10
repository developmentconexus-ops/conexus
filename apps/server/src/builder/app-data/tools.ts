import { APP_CALL_LIMITS } from '@conexus/app-contract'
import type { CompanyId, PersonId, ProjectId } from '@conexus/hub-api'
import { AGENT_TOOL, APP_DATA_TOOL } from '@conexus/hub-api'
import type { ToolsInput } from '@mastra/core/agent'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import type { AppCheck, AppRead, BuilderData } from '../../hub/apps/public.ts'
import { shaped } from '../../hub/connectors/public.ts'
import type { AppDataPort } from './port.ts'

/** One statement of at most 4000 characters: the database refuses what is more or less than a read. */
const AppDataInput = z.object({ sql: z.string().trim().min(1).max(4000) })

/** A read to check: the same statement and the values a handler case binds to its `$1`, `$2`. */
const AppDataCheckInput = z.object({
  sql: z.string().trim().min(1).max(4000),
  values: z
    .array(z.union([z.string().max(1000), z.number(), z.boolean(), z.null()]))
    .max(20)
    .default([]),
})

const TOO_LARGE = 'A consulta trouxe dados demais. Peça menos linhas.'

const READ_DESCRIPTION =
  'Reads the data of this Projeto’s app with one PostgreSQL SELECT, on its own tables by name, with no schema, and on the company copies released to this Projeto as sync.<name>, with every column in double quotes in the case the copy lists (select "CODVEND" from sync.vendas). List the app’s tables and columns with information_schema.columns where table_schema = current_schema(). One statement only, and it cannot write. A refusal carries PostgreSQL’s SQLSTATE: 42P01 or 42703 is a table or column that does not exist, 42601 a syntax error, 25006 or 42501 a write or a table you cannot read; fix the query and try again. The answer is cut to the first rows. Ask for the columns and rows you need.'

const CHECK_DESCRIPTION =
  'Runs one of the app’s reads on the real data and tells you how many rows it gives, its columns with their types and how long it took, and never a row. Give the SQL and the values of a real case of the handler, exactly as the handler binds them. Use it to prove a read works, not to look at the data: app_data_read shows a few rows for that. A refusal carries PostgreSQL’s SQLSTATE; CHECK_NOT_A_COUNT means the text is not one read.'

/** What the model reads of a read: cut as `connector_read` cuts (code C26), its columns kept whole. */
function cut(read: Extract<AppRead, { kind: 'ROWS' }>) {
  const { value, complete } = shaped({ columns: read.columns, linhas: read.rows })
  const listed = z.object({ columns: z.array(z.string()), linhas: z.array(z.array(z.unknown())) })
  const kept = listed.safeParse(value)
  if (!kept.success)
    return { kind: 'FAILED', code: 'APP_DATA_TOO_LARGE', message: TOO_LARGE } as const
  return { kind: 'ROWS', columns: kept.data.columns, rows: kept.data.linhas, complete } as const
}

/** The answer to the model: the rows cut, a refusal as the database gave it, a failure with its code. */
function answered(read: AppRead | { kind: 'REFUSED'; code: 'NOT_FOUND' }) {
  switch (read.kind) {
    case 'ROWS':
      return cut(read)
    case 'REFUSED':
      return read
    case 'FAILED':
      return read.code === 'APP_DATA_TOO_LARGE' ? { ...read, message: TOO_LARGE } : read
    default:
      return read satisfies never
  }
}

/** The call's own deadline, joined with the turn's abort. */
function withDeadline(abortSignal: AbortSignal | undefined): AbortSignal {
  const deadline = AbortSignal.timeout(APP_CALL_LIMITS.callDeadlineMs)
  return abortSignal === undefined ? deadline : AbortSignal.any([abortSignal, deadline])
}

/**
 * `app_data_read`: one `SELECT` on the Projeto's app, as its read login. Its schema is the login's
 * own, so the model names tables without a schema; a refusal is the database's, never a filter of ours.
 */
export function appDataTools(deps: {
  appData: AppDataPort
  scope: { companyId: CompanyId; personId: PersonId }
  projectId: ProjectId
}): ToolsInput {
  const id = AGENT_TOOL.appDataRead
  return {
    [id]: createTool({
      id,
      description: READ_DESCRIPTION,
      inputSchema: AppDataInput,
      execute: async ({ sql }, { abortSignal }) =>
        answered(
          await deps.appData.read({
            ...deps,
            statement: { text: sql },
            signal: withDeadline(abortSignal),
          }),
        ),
    }),
  }
}

type Ids = { companyId: CompanyId; projectId: ProjectId; personId: PersonId }

/** What `app_data_check`'s execute returns, which is what the model reads and Mastra keeps. */
type AppDataCheckOutput =
  /** The count, the columns and the time; or the database's refusal, its SQLSTATE only. */
  | Extract<AppCheck, { kind: 'COUNTED' | 'REFUSED' }>
  /** The person is not admitted to the Projeto (security S10). */
  | { kind: 'REFUSED'; code: 'NOT_FOUND' }
  | {
      kind: 'FAILED'
      code: 'CHECK_NOT_A_COUNT' | 'APP_DATA_NO_APP' | 'APP_DATA_UNAVAILABLE' | 'APP_DATA_TIMEOUT'
    }

/**
 * The Builder's two tools on the Projeto's app data, both offered whenever the person is admitted
 * (the Hub admits again on each call): `app_data_read` shows a few rows as the agents' does, and
 * `app_data_check` proves a read on the real data and answers a count, never a row. "Only counts"
 * keeps rows out of the conversation and out of what Mastra stores; a count of `where` clauses still
 * tells the model about the data, which the rule does not claim to hide.
 */
export function builderAppDataTools(deps: { data: BuilderData; ids: Ids }) {
  const { data, ids } = deps
  return {
    [APP_DATA_TOOL.read]: createTool({
      id: APP_DATA_TOOL.read,
      description: READ_DESCRIPTION,
      inputSchema: AppDataInput,
      execute: async ({ sql }, { abortSignal }) =>
        answered(await data.read(ids, { text: sql }, withDeadline(abortSignal))),
    }),
    [APP_DATA_TOOL.check]: createTool({
      id: APP_DATA_TOOL.check,
      description: CHECK_DESCRIPTION,
      inputSchema: AppDataCheckInput,
      execute: async ({ sql, values }, { abortSignal }): Promise<AppDataCheckOutput> => {
        const check = await data.check(ids, { text: sql, values }, withDeadline(abortSignal))
        return check.kind === 'NOT_A_COUNT' ? { kind: 'FAILED', code: 'CHECK_NOT_A_COUNT' } : check
      },
    }),
  }
}
