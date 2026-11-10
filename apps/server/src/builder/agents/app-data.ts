import { APP_CALL_LIMITS } from '@conexus/app-contract'
import type { CompanyId, PersonId, ProjectId } from '@conexus/hub-api'
import { AGENT_TOOL } from '@conexus/hub-api'
import type { ToolsInput } from '@mastra/core/agent'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import type { AppRead, AppTablesRead, SqlStatement } from '../../hub/apps/public.ts'
import { shaped } from '../../hub/connectors/public.ts'

/** What an agent asks of its Projeto's app (step 24.3, U3): the apps' door, which reads and never writes. */
export type AppDataPort = {
  hasApp(input: {
    scope: { companyId: CompanyId; personId: PersonId }
    projectId: ProjectId
  }): Promise<boolean>
  /** The app's tables and their columns, which the Construtor reads as the Dados page does. */
  tables(input: {
    scope: { companyId: CompanyId; personId: PersonId }
    projectId: ProjectId
    signal: AbortSignal
  }): Promise<AppTablesRead>
  read(input: {
    scope: { companyId: CompanyId; personId: PersonId }
    projectId: ProjectId
    statement: SqlStatement
    signal: AbortSignal
  }): Promise<AppRead>
}

/** One statement of at most 4000 characters: the database refuses what is more or less than a read. */
const AppDataInput = z.object({ sql: z.string().trim().min(1).max(4000) })

const TOO_LARGE = 'A consulta trouxe dados demais. Peça menos linhas.'

/** What the model reads of a read: cut as `connector_read` cuts (code C26), its columns kept whole. */
function cut(read: Extract<AppRead, { kind: 'ROWS' }>) {
  const { value, complete } = shaped({ columns: read.columns, linhas: read.rows })
  const listed = z.object({ columns: z.array(z.string()), linhas: z.array(z.array(z.unknown())) })
  const kept = listed.safeParse(value)
  if (!kept.success)
    return { kind: 'FAILED', code: 'APP_DATA_TOO_LARGE', message: TOO_LARGE } as const
  return { kind: 'ROWS', columns: kept.data.columns, rows: kept.data.linhas, complete } as const
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
      description:
        'Reads the data of this Projeto’s app with one PostgreSQL SELECT, on its tables by name, with no schema. List the tables and columns with information_schema.columns where table_schema = current_schema(). One statement only, and it cannot write. A refusal carries PostgreSQL’s SQLSTATE: 42P01 or 42703 is a table or column that does not exist, 42601 a syntax error, 25006 or 42501 a write or a table you cannot read; fix the query and try again. The answer is cut to the first rows. Ask for the columns and rows you need.',
      inputSchema: AppDataInput,
      execute: async ({ sql }, { abortSignal }) => {
        const deadline = AbortSignal.timeout(APP_CALL_LIMITS.callDeadlineMs)
        const read = await deps.appData.read({
          ...deps,
          statement: { text: sql },
          signal: abortSignal === undefined ? deadline : AbortSignal.any([abortSignal, deadline]),
        })
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
      },
    }),
  }
}
