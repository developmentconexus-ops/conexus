import { randomUUID } from 'node:crypto'
import type { ConnectionId, OfProject, PersonId, RunId } from '@conexus/hub-api'
import { CONVERSATION_TOOL } from '@conexus/hub-api'
import type { ToolsInput } from '@mastra/core/agent'
import type { RequestContext } from '@mastra/core/request-context'
import { createTool } from '@mastra/core/tools'
import type { WorkspaceFilesystem } from '@mastra/core/workspace'
import { z } from 'zod'
import type { Connectors, Native } from '../../../hub/connectors/public.ts'
import { CONNECTOR_CALLS_PER_TURN, deniesAccess } from '../../../hub/connectors/public.ts'
import type { FailureLog } from '../../../platform/failure.ts'
import { Failure, logFailure } from '../../../platform/failure.ts'
import { toldNative } from '../../../platform/model-text.ts'
import { personsAnswer } from '../../spec/public.ts'
import { INSTANTS_NOTE, inZone, zoneOf } from '../data/reader-zone.ts'

/** What a conversation's tools ask of the Hub: the connections granted to its Projeto, its reads and its notebook. */
export type ConnectorPort = Connectors['builder']
export type GrantedConnection = Awaited<ReturnType<ConnectorPort['granted']>>[number]
type Notes = Awaited<ReturnType<ConnectorPort['notes']>>
type Answer = Awaited<ReturnType<ConnectorPort['read']>>
/** An OK read that also carries the connector's answer before the cut: the Assistant's, for its machine. */
type WholeAnswer = Extract<Answer, { kind: 'OK' }> & { whole: unknown }
type Saved = Awaited<ReturnType<ConnectorPort['saveNote']>>

/** Who asks, and the run the port counts its `CONNECTOR_CALLS_PER_TURN` calls by, known only when a tool runs. */
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
  connections: readonly (Pick<GrantedConnection, 'connectionId' | 'connector' | 'name'> & {
    reads: readonly Pick<GrantedConnection['reads'][number], 'operation' | 'label' | 'summary'>[]
  })[]
  read(
    call: { connectionId: ConnectionId; operation: string; input: unknown; signal?: AbortSignal },
    requestContext: RequestContext,
  ): Promise<Answer | WholeAnswer>
  /** With a machine: the path (inside its folder) the turn's next read is saved whole at. */
  savedAt?: (requestContext: RequestContext) => string
  /** Where a refused call and a failed save are logged. */
  log: FailureLog
  notes(connectionId: ConnectionId): Promise<Notes>
  wording: { whose: string }
}

/** The notebook's write, once the person said yes on the card: the Builder's, and the Assistant's for who manages the connections. */
export type NoteSave = (
  call: { connectionId: ConnectionId; concept: string; mapping: string; provingQuery: string },
  requestContext: RequestContext,
) => Promise<Saved>

type Connection = ConnectorAccess['connections'][number]

export const NOT_GRANTED = { kind: 'NOT_GRANTED' } as const

/** The person said no on the notebook's card: nothing was proved and nothing written. */
const NOT_SAVED = { kind: 'NOT_SAVED' } as const

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

/**
 * The connection's name, one of the names this scope offers: a name the model makes up, such as
 * the connector's id for the connection's name, is refused by the tool's own schema, which tells
 * the model the names there are.
 */
export function connectionField(connections: readonly { name: string }[]) {
  const [first, ...rest] = [...new Set(connections.map((each) => each.name))]
  if (first === undefined) return z.never()
  return z.enum([first, ...rest]).describe("The connection's name, exactly as listed")
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
  save: { path: string; log: FailureLog },
  whole: unknown,
  cut: T,
) {
  try {
    await files.writeFile(save.path, JSON.stringify(whole), { recursive: true })
  } catch (error) {
    // A machine that did not start says so; one that started and lost the write is the same to the
    // model: the cut stands, the file does not. The reason is logged, typed, with scalars alone.
    const failure =
      error instanceof Failure
        ? error
        : new Failure('MACHINE_UNAVAILABLE', { cause: error, details: { reason: 'READS_WRITE' } })
    logFailure(save.log, failure)
    return { ...cut, saved: false, reason: failure.code }
  }
  return { ...cut, file: save.path }
}

/**
 * The named connection is of another system than the operation's: the schema let both through,
 * each from its own list, and the tool refuses the pair, saying whose each one is.
 */
function otherSystem(access: ConnectorAccess, connection: string, operation: string) {
  const of = access.connections.filter((each) => each.name === connection)
  const systems = of.map((each) => each.connector).join(', ')
  access.log.info(
    {
      connectionIds: of.map((each) => each.connectionId).join(','),
      operation,
      reason: 'OTHER_SYSTEM',
    },
    'CONNECTOR_READ_REFUSED',
  )
  return {
    ...NOT_GRANTED,
    reason: `The connection "${connection}" is of ${systems}; the operation ${operation} is of another system. Read it through a connection of that system.`,
  }
}

/** The operation as the model writes it, bounded because a refusal logs it: a string that is not `connector.operation` never reaches the door (S41). */
const OPERATION_MAX = 80
const OPERATION_FORMAT = /^[a-z0-9-]+\.[A-Za-z0-9_]+$/

const WHOLE_FILE =
  'When `complete` is false and `file` is set, the whole answer is in that file: open it with Python on the machine. Do not read again to see the rest; read again only to filter what the file does not hold. When `saved` is false there is no file: filter with WHERE and COUNT.'

/** What every read tool says of its answer: the cut, the file, the limit and the hour (`connector_read` and the Assistant's typed reads). */
export function answerWords(): string {
  return `The answer is cut to 20 rows and 16 KB (\`complete: false\` says rows were left out; long strings are shortened), and \`rows\` and \`bytes\` size it. ${WHOLE_FILE} At most ${CONNECTOR_CALLS_PER_TURN} connector calls per answer. ${INSTANTS_NOTE}`
}

/**
 * What the model reads of a read the provider refused for any reason but withholding access
 * (`deniesAccess`): what it proves is only that access was not shown to be withheld (a Sankhya
 * refusal comes as HTTP 200 in an envelope), so it says no more. It is the one place the model is told
 * how to treat a failed read; the prompts and the skills point here. The contract and the log keep
 * `REFUSED`; only this text changes.
 */
function failedRead(answered: { native: Native }) {
  const said =
    answered.native.message === null ? '' : ` The provider said: ${answered.native.message}`
  return {
    kind: 'READ_FAILED',
    native: answered.native,
    reason: `The read failed.${said} This does not show a refusal of access: read the message, correct the request and try another way.`,
  } as const
}

/** What the model reads of a read that did not answer OK: the provider's refusal within the ceiling of C79, with the failed-read words when it was not a refusal of access. */
export function unansweredRead(answered: Exclude<Answer, { kind: 'OK' }>) {
  if (!('native' in answered)) return answered
  const told = { ...answered, native: toldNative(answered.native) }
  return answered.kind === 'REFUSED' && !deniesAccess(answered.native) ? failedRead(told) : told
}

/** One read through the access's door: the model gets the cut with the time the answer came back, and the whole answer goes to the machine's file when there is one. */
export async function readOn(
  access: ConnectorAccess,
  call: { connectionId: ConnectionId; operation: string; input: unknown },
  context: {
    requestContext: RequestContext
    workspace?: { filesystem?: WorkspaceFilesystem } | undefined
    abortSignal?: AbortSignal | undefined
  },
) {
  const { requestContext, workspace, abortSignal } = context
  const answered = await access.read({ ...call, signal: abortSignal }, requestContext)
  if (answered.kind !== 'OK') return unansweredRead(answered)
  const at = inZone(new Date(), zoneOf(requestContext))
  if (!('whole' in answered)) return { ...answered, at }
  const { whole, ...rest } = answered
  const cut = { ...rest, at }
  if (workspace?.filesystem === undefined || access.savedAt === undefined) return cut
  const save = { path: access.savedAt(requestContext), log: access.log }
  return saveWhole(workspace.filesystem, save, whole, cut)
}

function readTool(access: ConnectorAccess): ToolsInput {
  const { connections } = access
  if (!connections.some((each) => each.reads.length > 0)) return {}
  return {
    [CONVERSATION_TOOL.connectorRead]: createTool({
      id: CONVERSATION_TOOL.connectorRead,
      description: [
        `Reads from a company system ${access.wording.whose}, by the connection's name. ${answerWords()}`,
        describeReads(connections),
      ].join('\n'),
      inputSchema: z.object({
        connection: connectionField(connections),
        // Not an enum of the listed reads: one the role lacks must reach the door, which answers `NOT_IN_ROLE` with the role's name, instead of a validation error that says nothing of the role.
        operation: z
          .string()
          .max(OPERATION_MAX)
          .regex(OPERATION_FORMAT)
          .describe(
            'The operation as "connector.operation", one of those listed under the connections',
          ),
        input: z.record(z.string(), z.unknown()),
      }),
      execute: async (
        { connection, operation, input },
        { requestContext, workspace, abortSignal },
      ) => {
        const [connector, ...id] = operation.split('.')
        const found = named(connections, connection, connector)
        if (found === undefined) return otherSystem(access, connection, operation)
        if (requestContext === undefined) return NOT_GRANTED
        return readOn(
          access,
          { connectionId: found.connectionId, operation: id.join('.'), input },
          { requestContext, workspace, abortSignal },
        )
      },
    }),
  }
}

function notesTool(access: ConnectorAccess) {
  return {
    [CONVERSATION_TOOL.connectorNotes]: createTool({
      id: CONVERSATION_TOOL.connectorNotes,
      description:
        'The notebook of a connection: each concept the Builder proved before, with its mapping and the query that proved it. Read it before you ask the person what a code means.',
      inputSchema: z.object({
        connection: connectionField(access.connections),
        connector: CONNECTOR_FIELD,
      }),
      execute: async ({ connection, connector }) => {
        const found = inNotebook(access.connections, connection, connector)
        if (found === undefined) return NOT_GRANTED
        if ('kind' in found) return found
        return (await access.notes(found.connectionId)) ?? NOT_GRANTED
      },
    }),
  }
}

/** What the person's card answers: the yes or the no. */
const NoteAnswer = z.object({ approved: z.boolean() })

function noteSaveTool(connections: readonly Connection[], save: NoteSave) {
  const asking = z.object({
    connection: connectionField(connections),
    connector: CONNECTOR_FIELD,
    concept: z.string().min(1).max(120),
    mapping: z.string().min(1).max(500),
    provingQuery: z.string().min(1).max(4000),
  })
  return {
    [CONVERSATION_TOOL.connectorNoteSave]: createTool({
      id: CONVERSATION_TOOL.connectorNoteSave,
      description:
        "Saves in a connection's notebook what a code or a field means in this company, after the person approves it on a card. It runs `provingQuery` once through the connection's read door and keeps the mapping, the query, the date and the number of rows it returned, never a row. Names and codes only, never a value.",
      inputSchema: asking,
      suspendSchema: asking,
      resumeSchema: NoteAnswer,
      execute: async (asked, { requestContext, agent }) => {
        const found = inNotebook(connections, asked.connection, asked.connector)
        if (found === undefined || requestContext === undefined) return NOT_GRANTED
        if ('kind' in found) return found
        const answer = personsAnswer(agent)
        if (answer === undefined) {
          await agent?.suspend?.(asked)
          return undefined
        }
        if (!answer.approved) return NOT_SAVED
        const { concept, mapping, provingQuery } = asked
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
 * write comes only with `noteSave`, and `reads: false` leaves `connector_read` out: an agent's
 * reads are its chosen tools, and its selected connections bring the notebook alone (decision E4).
 */
export function connectorTools(
  access: ConnectorAccess,
  include: ({ noteSave: false } | { noteSave: true; save: NoteSave }) & {
    reads?: false
  },
): ToolsInput {
  if (access.connections.length === 0) return {}
  return {
    ...(include.reads === false ? {} : readTool(access)),
    ...notesTool(access),
    ...(include.noteSave ? noteSaveTool(access.connections, include.save) : {}),
  }
}
