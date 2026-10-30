import type { OfProject, PersonId, RunId } from '@conexus/hub-api'
import { BUILDER_TOOL } from '@conexus/hub-api'
import type { ToolsInput } from '@mastra/core/agent'
import type { RequestContext } from '@mastra/core/request-context'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import type { Connectors } from '../../hub/connectors/public.ts'
import { Failure } from '../../platform/failure.ts'

export type BuilderConnectors = Connectors['builder']
export type GrantedConnection = Awaited<ReturnType<BuilderConnectors['granted']>>[number]

/** Who asks, and the run the port counts the 50 calls by, known only when a tool runs. */
export type Asker = OfProject & {
  personId: PersonId
  runIdOf: (requestContext: RequestContext) => RunId | undefined
}

const NOT_GRANTED = { kind: 'NOT_GRANTED' } as const

function runIn(who: Asker, requestContext: RequestContext): RunId {
  const runId = who.runIdOf(requestContext)
  if (runId === undefined) {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'CONNECTOR_TOOL_WITHOUT_RUN' } })
  }
  return runId
}

/** The connection a name says; the connector too when the call names one, since two systems may share a name. */
function named(granted: readonly GrantedConnection[], name: string, connector?: string) {
  return granted.find(
    (each) => each.name === name && (connector === undefined || each.connector === connector),
  )
}

const AMBIGUOUS = { kind: 'AMBIGUOUS_CONNECTION' } as const

/** The connection for the notebook tools: `connector` is needed only when two granted systems share the name. */
function inNotebook(granted: readonly GrantedConnection[], name: string, connector?: string) {
  const sameName = granted.filter((each) => each.name === name)
  if (connector === undefined && sameName.length > 1) return AMBIGUOUS
  return named(granted, name, connector)
}

const CONNECTOR_FIELD = z
  .string()
  .optional()
  .describe('The connector, needed when two connections share the name')

function describeReads(granted: readonly GrantedConnection[]): string {
  return granted
    .map((each) => {
      const reads = each.reads.map((read) => `${each.connector}.${read.operation}: ${read.summary}`)
      return `- Connection "${each.name}" (${each.connector}):\n${reads.map((line) => `  - ${line}`).join('\n')}`
    })
    .join('\n')
}

function readTool(
  port: BuilderConnectors,
  granted: readonly GrantedConnection[],
  who: Asker,
): ToolsInput {
  const operations = [
    ...new Set(granted.flatMap((g) => g.reads.map((read) => `${g.connector}.${read.operation}`))),
  ]
  const [first, ...rest] = operations
  if (first === undefined) return {}
  return {
    [BUILDER_TOOL.connectorRead]: createTool({
      id: BUILDER_TOOL.connectorRead,
      description: [
        "Reads from a company system this Project's owner released, by the connection's name. The answer is cut to 20 rows and 16 KB (`complete: false` says rows were left out; long strings are shortened): to count or see more rows, run your own SQL read with WHERE and COUNT. At most 50 connector calls per run.",
        describeReads(granted),
      ].join('\n'),
      inputSchema: z.object({
        connection: z.string().describe("The connection's name"),
        operation: z.enum([first, ...rest]),
        input: z.record(z.string(), z.unknown()),
      }),
      execute: async ({ connection, operation, input }, { requestContext }) => {
        const [connector, ...id] = operation.split('.')
        const found = named(granted, connection, connector)
        if (found === undefined || requestContext === undefined) return NOT_GRANTED
        return port.read(who, {
          connectionId: found.connectionId,
          personId: who.personId,
          runId: runIn(who, requestContext),
          operation: id.join('.'),
          input,
        })
      },
    }),
  }
}

function notesTool(port: BuilderConnectors, granted: readonly GrantedConnection[], who: Asker) {
  return {
    [BUILDER_TOOL.connectorNotes]: createTool({
      id: BUILDER_TOOL.connectorNotes,
      description:
        'The notebook of a connection: each concept the Builder proved before, with its mapping and the query that proved it. Read it before you ask the person what a code means.',
      inputSchema: z.object({ connection: z.string(), connector: CONNECTOR_FIELD }),
      execute: async ({ connection, connector }) => {
        const found = inNotebook(granted, connection, connector)
        if (found === undefined) return NOT_GRANTED
        if ('kind' in found) return found
        return (await port.notes(who, found.connectionId)) ?? NOT_GRANTED
      },
    }),
  }
}

function noteSaveTool(port: BuilderConnectors, granted: readonly GrantedConnection[], who: Asker) {
  return {
    [BUILDER_TOOL.connectorNoteSave]: createTool({
      id: BUILDER_TOOL.connectorNoteSave,
      description:
        "Saves in a connection's notebook what a code or a field means in this company. It runs `provingQuery` once through the connection's read door and keeps the mapping, the query, the date and the number of rows it returned, never a row. Names and codes only, never a value.",
      inputSchema: z.object({
        connection: z.string(),
        connector: CONNECTOR_FIELD,
        concept: z.string().min(1).max(120),
        mapping: z.string().min(1).max(500),
        provingQuery: z.string().min(1).max(4000),
      }),
      execute: async (
        { connection, connector, concept, mapping, provingQuery },
        { requestContext },
      ) => {
        const found = inNotebook(granted, connection, connector)
        if (found === undefined || requestContext === undefined) return NOT_GRANTED
        if ('kind' in found) return found
        return port.saveNote(who, {
          connectionId: found.connectionId,
          personId: who.personId,
          runId: runIn(who, requestContext),
          concept,
          mapping,
          provingQuery,
        })
      },
    }),
  }
}

/** The three tools for a conversation whose Projeto has at least one grant; {} otherwise. */
export function connectorTools(
  port: BuilderConnectors,
  granted: readonly GrantedConnection[],
  who: Asker,
): ToolsInput {
  if (granted.length === 0) return {}
  return {
    ...readTool(port, granted, who),
    ...notesTool(port, granted, who),
    ...noteSaveTool(port, granted, who),
  }
}
