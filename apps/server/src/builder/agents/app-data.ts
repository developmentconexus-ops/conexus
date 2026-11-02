import { APP_CALL_LIMITS } from '@conexus/app-contract'
import type { CompanyId, PersonId, ProjectId } from '@conexus/hub-api'
import { AGENT_TOOL } from '@conexus/hub-api'
import type { ToolsInput } from '@mastra/core/agent'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import type { AppRead } from '../../hub/apps/public.ts'
import { CUT_BYTES, CUT_ROWS } from '../../hub/connectors/public.ts'

/** What an agent asks of its Projeto's app (step 24.3, U3): the apps' door, which reads and never writes. */
export type AppDataPort = {
  hasApp(input: {
    scope: { companyId: CompanyId; personId: PersonId }
    projectId: ProjectId
  }): Promise<boolean>
  read(input: {
    scope: { companyId: CompanyId; personId: PersonId }
    projectId: ProjectId
    sql: string
    signal: AbortSignal
  }): Promise<AppRead>
}

/** One statement of at most 4000 characters: the database refuses what is more or less than a read. */
const AppDataInput = z.object({ sql: z.string().trim().min(1).max(4000) })

const TOO_LARGE = 'A consulta trouxe dados demais. Peça menos linhas.'

function size(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value))
}

/**
 * What the model reads of a read, cut as `connector_read` cuts: up to `CUT_ROWS` rows, then rows
 * dropped from the end until it is at most `CUT_BYTES`; `complete` says nothing was left out.
 */
function cut(read: Extract<AppRead, { kind: 'ROWS' }>) {
  let rows = read.rows.slice(0, CUT_ROWS)
  while (rows.length > 0 && size({ columns: read.columns, rows }) > CUT_BYTES) {
    rows = rows.slice(0, -1)
  }
  return { kind: 'ROWS', columns: read.columns, rows, complete: rows.length === read.rows.length }
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
        'Reads the data of this Projeto’s app with one PostgreSQL SELECT, on its tables by name, with no schema. One statement only: the database refuses anything that writes, and the answer is cut to the first rows. Ask for the columns and rows you need.',
      inputSchema: AppDataInput,
      execute: async ({ sql }, { abortSignal }) => {
        const deadline = AbortSignal.timeout(APP_CALL_LIMITS.callDeadlineMs)
        const read = await deps.appData.read({
          ...deps,
          sql,
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
