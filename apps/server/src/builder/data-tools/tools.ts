import type { CompanyData, DataResult, ReadAnswer } from '@conexus/hub-api'
import { DATA_TOOL, QUERY_SQL_MAX } from '@conexus/hub-api'
import type { ToolsInput } from '@mastra/core/agent'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

type Described = Extract<Awaited<ReturnType<CompanyData['describe']>>, { kind: 'CATALOG' }>

/**
 * The failure a data tool throws for each refusal (code C79): Mastra wraps it in
 * `TOOL_EXECUTION_FAILED` and hands the model its message, the JSON `{ kind, status, code, message,
 * body, reason }`, as a tool failure. The screen reads it back with `thrownOf`.
 */
class DataRefused extends Error {
  override readonly name = 'DataRefused'
}

const REASONS = {
  NOT_IN_CATALOG: 'No such table in the catalog. Call data_describe with no table to list them.',
  TABLE_UNAVAILABLE:
    "The company's database did not answer. Do not read the system live in its place; tell the person to try again.",
  CATALOG_UNAVAILABLE: 'The catalog did not answer. Tell the person to try again.',
} as const

function refused(kind: keyof typeof REASONS): never {
  const told = { code: null, message: null, reason: REASONS[kind] }
  throw new DataRefused(JSON.stringify({ kind, status: null, body: null, ...told }))
}

/** Throws the refusal an answer of the contract stands for; an answer a table or a query read never gets is a defect, thrown as one. */
function refusedBy(answer: ReadAnswer): never {
  switch (answer.kind) {
    case 'NOT_IN_CATALOG':
    case 'TABLE_UNAVAILABLE':
    case 'CATALOG_UNAVAILABLE':
      return refused(answer.kind)
    case 'LIVE':
    case 'REFUSED':
    case 'AUTH_REFUSED':
    case 'TOKEN_EXPIRED':
    case 'UNREADABLE':
    case 'BUSY':
    case 'UNREACHABLE':
    case 'DEADLINE':
    case 'NOT_GRANTED':
    case 'NOT_IN_ROLE':
    case 'CALLS_SPENT':
      throw new Error(`The contract answered ${answer.kind} to a table or query read`)
    default:
      return answer satisfies never
  }
}

const DESCRIBE_DESCRIPTION =
  "Lists the company's systems this person may reach, each with the reads it offers. No table of the company's data is kept yet: given a table, it answers NOT_IN_CATALOG."

const QUERY_DESCRIPTION =
  "Reads a table of the company's data with one PostgreSQL SELECT. No table is kept yet, so every query answers NOT_IN_CATALOG: say so to the person, and never stand in for the data."

type Signal = AbortSignal | undefined

async function catalogOf(data: CompanyData, signal: Signal): Promise<Described> {
  const described = await data.describe({ signal })
  return described.kind === 'CATALOG' ? described : refused(described.kind)
}

function listed(catalog: Described): DataResult {
  return {
    kind: 'CATALOG',
    systems: catalog.systems.map(({ name, connector, reads }) => ({
      name,
      connector,
      reads: reads.map(({ operation, label, summary }) => ({ operation, label, summary })),
    })),
  }
}

/** The two tools of the company's data, the same for every agent, bound to the data of one run's place and person. */
export function dataTools(deps: { data: CompanyData }): ToolsInput {
  const { data } = deps
  return {
    [DATA_TOOL.describe]: createTool({
      id: DATA_TOOL.describe,
      description: DESCRIBE_DESCRIPTION,
      inputSchema: z.object({ table: z.string().max(40).optional() }),
      execute: async ({ table }, { abortSignal: signal }) =>
        table === undefined
          ? listed(await catalogOf(data, signal))
          : refusedBy(await data.read({ kind: 'TABLE', table, signal })),
    }),
    [DATA_TOOL.query]: createTool({
      id: DATA_TOOL.query,
      description: QUERY_DESCRIPTION,
      inputSchema: z.object({ sql: z.string().trim().min(1).max(QUERY_SQL_MAX) }),
      execute: async ({ sql }, { abortSignal: signal }) =>
        refusedBy(await data.read({ kind: 'QUERY', sql, signal })),
    }),
  }
}
