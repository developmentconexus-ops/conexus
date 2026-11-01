import type { ConnectionId, OfProject, PersonId, RunId } from '@conexus/hub-api'
import { BUILDER_TOOL } from '@conexus/hub-api'
import type { ToolsInput } from '@mastra/core/agent'
import type { RequestContext } from '@mastra/core/request-context'
import { createTool } from '@mastra/core/tools'
import type { WorkspaceFilesystem } from '@mastra/core/workspace'
import { z } from 'zod'
import type { Connectors } from '../../hub/connectors/public.ts'
import { Failure } from '../../platform/failure.ts'

export type BuilderConnectors = Connectors['builder']
export type GrantedConnection = Awaited<ReturnType<BuilderConnectors['granted']>>[number]
type Notes = Awaited<ReturnType<BuilderConnectors['notes']>>
type Answer = Awaited<ReturnType<BuilderConnectors['read']>>
/** An OK read that also carries the connector's answer before the cut: the Assistant's, for its machine. */
type WholeAnswer = Extract<Answer, { kind: 'OK' }> & { whole: unknown }
type Saved = Awaited<ReturnType<BuilderConnectors['saveNote']>>

/** Who asks, and the run the port counts the 50 calls by, known only when a tool runs. */
export type Asker = OfProject & {
  personId: PersonId
  runIdOf: (requestContext: RequestContext) => RunId | undefined
}

/**
 * What a caller binds the connector tools to (step 24.1, U2): the connections its scope offers
 * for this turn, its door's read and notebook, and the words that say whose they are and the
 * limit. The tools never decide what may be read: the door behind `read` and `notes` does.
 */
export type ConnectorAccess = {
  connections: readonly Pick<GrantedConnection, 'connectionId' | 'connector' | 'name' | 'reads'>[]
  read(
    call: { connectionId: ConnectionId; operation: string; input: unknown },
    requestContext: RequestContext,
  ): Promise<Answer | WholeAnswer>
  /** With a machine, the path (inside its folder) the turn's next read is saved whole at. */
  savedAt?(requestContext: RequestContext): string
  notes(connectionId: ConnectionId): Promise<Notes>
  wording: { whose: string; limit: string }
}

/** The notebook's write, only the Builder's: the Assistant reads the notebook and never writes it. */
type NoteSave = (
  call: { connectionId: ConnectionId; concept: string; mapping: string; provingQuery: string },
  requestContext: RequestContext,
) => Promise<Saved>

type Connection = ConnectorAccess['connections'][number]

const NOT_GRANTED = { kind: 'NOT_GRANTED' } as const

function runIn(who: Asker, requestContext: RequestContext): RunId {
  const runId = who.runIdOf(requestContext)
  if (runId === undefined) {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'CONNECTOR_TOOL_WITHOUT_RUN' } })
  }
  return runId
}

/** The Builder's access: its Projeto's granted connections through its door, counted by run. */
export function builderAccess(
  port: BuilderConnectors,
  granted: readonly GrantedConnection[],
  who: Asker,
): { access: ConnectorAccess; save: NoteSave } {
  const access: ConnectorAccess = {
    connections: granted,
    read: (call, requestContext) =>
      port.read(who, {
        ...call,
        personId: who.personId,
        runId: runIn(who, requestContext),
      }),
    notes: (connectionId) => port.notes(who, connectionId),
    wording: { whose: "this Project's owner released", limit: '50 connector calls per run' },
  }
  const save: NoteSave = (call, requestContext) =>
    port.saveNote(who, { ...call, personId: who.personId, runId: runIn(who, requestContext) })
  return { access, save }
}

/** The connection a name says; the connector too when the call names one, since two systems may share a name. */
function named(connections: readonly Connection[], name: string, connector?: string) {
  return connections.find(
    (each) => each.name === name && (connector === undefined || each.connector === connector),
  )
}

const AMBIGUOUS = { kind: 'AMBIGUOUS_CONNECTION' } as const

/** The connection for the notebook tools: `connector` is needed only when two systems share the name. */
function inNotebook(connections: readonly Connection[], name: string, connector?: string) {
  const sameName = connections.filter((each) => each.name === name)
  if (connector === undefined && sameName.length > 1) return AMBIGUOUS
  return named(connections, name, connector)
}

const CONNECTOR_FIELD = z
  .string()
  .optional()
  .describe('The connector, needed when two connections share the name')

function describeReads(connections: readonly Connection[]): string {
  return connections
    .map((each) => {
      const reads = each.reads.map((read) => `${each.connector}.${read.operation}: ${read.summary}`)
      return `- Connection "${each.name}" (${each.connector}):\n${reads.map((line) => `  - ${line}`).join('\n')}`
    })
    .join('\n')
}

/**
 * With a machine, the read's whole answer is written at `path` for the model's code to read, and
 * the model gets the cut with that path; a machine that does not start leaves the cut with the
 * failure (`saved: false`), for the model to say.
 */
async function saveWhole<T extends object>(
  files: WorkspaceFilesystem,
  path: string,
  whole: unknown,
  cut: T,
) {
  try {
    await files.writeFile(path, JSON.stringify(whole), { recursive: true })
  } catch (error) {
    if (error instanceof Failure && error.code === 'MACHINE_UNAVAILABLE') {
      return { ...cut, saved: false, reason: error.code }
    }
    throw error
  }
  return { ...cut, file: path }
}

function readTool(access: ConnectorAccess): ToolsInput {
  const { connections } = access
  const operations = [
    ...new Set(
      connections.flatMap((g) => g.reads.map((read) => `${g.connector}.${read.operation}`)),
    ),
  ]
  const [first, ...rest] = operations
  if (first === undefined) return {}
  return {
    [BUILDER_TOOL.connectorRead]: createTool({
      id: BUILDER_TOOL.connectorRead,
      description: [
        `Reads from a company system ${access.wording.whose}, by the connection's name. The answer is cut to 20 rows and 16 KB (\`complete: false\` says rows were left out; long strings are shortened): to count or see more rows, run your own SQL read with WHERE and COUNT. At most ${access.wording.limit}.`,
        describeReads(connections),
      ].join('\n'),
      inputSchema: z.object({
        connection: z.string().describe("The connection's name"),
        operation: z.enum([first, ...rest]),
        input: z.record(z.string(), z.unknown()),
      }),
      execute: async ({ connection, operation, input }, { requestContext, workspace }) => {
        const [connector, ...id] = operation.split('.')
        const found = named(connections, connection, connector)
        if (found === undefined || requestContext === undefined) return NOT_GRANTED
        const answered = await access.read(
          { connectionId: found.connectionId, operation: id.join('.'), input },
          requestContext,
        )
        if (answered.kind !== 'OK' || !('whole' in answered)) return answered
        const { whole, ...cut } = answered
        if (workspace?.filesystem === undefined || access.savedAt === undefined) return cut
        return saveWhole(workspace.filesystem, access.savedAt(requestContext), whole, cut)
      },
    }),
  }
}

function notesTool(access: ConnectorAccess) {
  return {
    [BUILDER_TOOL.connectorNotes]: createTool({
      id: BUILDER_TOOL.connectorNotes,
      description:
        'The notebook of a connection: each concept the Builder proved before, with its mapping and the query that proved it. Read it before you ask the person what a code means.',
      inputSchema: z.object({ connection: z.string(), connector: CONNECTOR_FIELD }),
      execute: async ({ connection, connector }) => {
        const found = inNotebook(access.connections, connection, connector)
        if (found === undefined) return NOT_GRANTED
        if ('kind' in found) return found
        return (await access.notes(found.connectionId)) ?? NOT_GRANTED
      },
    }),
  }
}

function noteSaveTool(connections: readonly Connection[], save: NoteSave) {
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
        const found = inNotebook(connections, connection, connector)
        if (found === undefined || requestContext === undefined) return NOT_GRANTED
        if ('kind' in found) return found
        return save(
          { connectionId: found.connectionId, concept, mapping, provingQuery },
          requestContext,
        )
      },
    }),
  }
}

/**
 * The connector tools for a scope that offers at least one connection; {} otherwise. The notebook's
 * write comes only with `noteSave`, the Builder's.
 */
export function connectorTools(
  access: ConnectorAccess,
  include: { noteSave: false } | { noteSave: true; save: NoteSave },
): ToolsInput {
  if (access.connections.length === 0) return {}
  return {
    ...readTool(access),
    ...notesTool(access),
    ...(include.noteSave ? noteSaveTool(access.connections, include.save) : {}),
  }
}
