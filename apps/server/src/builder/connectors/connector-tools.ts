import type { ConnectionId, OfProject, PersonId, RunId } from '@conexus/hub-api'
import { BUILDER_TOOL } from '@conexus/hub-api'
import type { ToolsInput } from '@mastra/core/agent'
import type { RequestContext } from '@mastra/core/request-context'
import { createTool } from '@mastra/core/tools'
import type { WorkspaceFilesystem } from '@mastra/core/workspace'
import { z } from 'zod'
import type { Connectors, Native } from '../../hub/connectors/public.ts'
import { deniesAccess } from '../../hub/connectors/public.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { InventoryAsk, OntologyDoor } from '../ontology/public.ts'
import { inventorySearchTool } from '../ontology/public.ts'
import { conversationIn } from '../runs/public.ts'
import type { ConceptProposeCall } from './concept-propose.ts'
import { conceptProposeTool } from './concept-propose.ts'
import type { ProposeCall } from './copy-propose.ts'
import { copyProposeTool } from './copy-propose.ts'

export type BuilderConnectors = Connectors['builder']
export type GrantedConnection = Awaited<ReturnType<BuilderConnectors['granted']>>[number]
type Answer = Awaited<ReturnType<BuilderConnectors['read']>>
/** An OK read that also carries the connector's answer before the cut: the Assistant's, for its machine. */
type WholeAnswer = Extract<Answer, { kind: 'OK' }> & { whole: unknown }

/** Who asks, and the run the port counts the 50 calls by, known only when a tool runs. */
export type Asker = OfProject & {
  personId: PersonId
  runIdOf: (requestContext: RequestContext) => RunId | undefined
}

/**
 * What a caller binds the connector tools to (step 24.1, U2): the connections its scope offers
 * for this turn, its door's read, and the words that say whose they are and the limit. The tools
 * never decide what may be read: the door behind `read` does.
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
  wording: { whose: string; limit: string }
}

type Connection = ConnectorAccess['connections'][number]

export const NOT_GRANTED = { kind: 'NOT_GRANTED' } as const

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
  ontology: OntologyDoor,
  granted: readonly GrantedConnection[],
  who: Asker,
  log: FailureLog,
): { access: ConnectorAccess; concepts: ConceptProposeCall; propose: ProposeCall } {
  const { companyId, personId } = who
  const access: ConnectorAccess = {
    connections: granted,
    log,
    read: (call, requestContext) =>
      port.read(who, {
        ...call,
        personId: who.personId,
        runId: runIn(who, requestContext),
      }),
    wording: { whose: "this Project's owner released", limit: '50 connector calls per run' },
  }
  const concepts: ConceptProposeCall = async (call, requestContext) => {
    const runId = runIn(who, requestContext)
    const door = await port.concepts(who, { connectionId: call.connectionId, personId, runId })
    if (door === undefined) return NOT_GRANTED
    const conversationId = conversationIn(requestContext) ?? null
    return ontology.propose({
      ...call,
      companyId,
      personId,
      agent: 'builder',
      conversationId,
      door,
    })
  }
  const propose: ProposeCall = ({ signal, ...call }, requestContext) =>
    port.propose(who, {
      ...call,
      personId: who.personId,
      runId: runIn(who, requestContext),
      // A call Mastra gives no signal is one nobody can stop: the proof's own deadline still holds.
      signal: signal ?? new AbortController().signal,
    })
  return { access, concepts, propose }
}

/** The connection a name says; the connector too when the call names one, since two systems may share a name. */
function named(connections: readonly Connection[], name: string, connector?: string) {
  return connections.find(
    (each) => each.name === name && (connector === undefined || each.connector === connector),
  )
}

const AMBIGUOUS = { kind: 'AMBIGUOUS_CONNECTION' } as const

/** The connection a tool names: `connector` is needed only when two systems share the name. */
function inScope(connections: readonly Connection[], name: string, connector?: string) {
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

/** What every read tool says of its answer: the cut, the file and the limit (`connector_read` and the Assistant's typed reads). */
export function answerWords(limit: string): string {
  return `The answer is cut to 20 rows and 16 KB (\`complete: false\` says rows were left out; long strings are shortened), and \`rows\` and \`bytes\` size it. ${WHOLE_FILE} At most ${limit}.`
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

/** One read through the access's door: the model gets the cut, and the whole answer goes to the machine's file when there is one. */
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
  if (answered.kind === 'REFUSED' && !deniesAccess(answered.native)) return failedRead(answered)
  if (answered.kind !== 'OK' || !('whole' in answered)) return answered
  const { whole, ...cut } = answered
  if (workspace?.filesystem === undefined || access.savedAt === undefined) return cut
  const save = { path: access.savedAt(requestContext), log: access.log }
  return saveWhole(workspace.filesystem, save, whole, cut)
}

function readTool(access: ConnectorAccess): ToolsInput {
  const { connections } = access
  if (!connections.some((each) => each.reads.length > 0)) return {}
  return {
    [BUILDER_TOOL.connectorRead]: createTool({
      id: BUILDER_TOOL.connectorRead,
      description: [
        `Reads from a company system ${access.wording.whose}, by the connection's name. ${answerWords(access.wording.limit)}`,
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

/**
 * The connector tools for a scope that offers at least one connection; {} otherwise.
 * `concept_propose` comes only with `concepts`, `inventory_search` only with `inventory`, and
 * `reads: false` leaves `connector_read` out (the Assistant's reads are typed).
 */
export function connectorTools(
  access: ConnectorAccess,
  include: {
    /** The Builder's and the Assistant's: `concept_propose` on the connections of the scope. */
    concepts?: ConceptProposeCall
    reads?: false
    /** `inventory_search` on the connections of the scope, reading what the inventory kept. */
    inventory?: InventoryAsk
    /** The Builder's: `copy_propose` on the connections whose connector copies (Capacidade 3). */
    propose?: {
      copying: readonly Pick<GrantedConnection, 'connectionId' | 'connector' | 'name' | 'reads'>[]
      call: ProposeCall
    }
  } = {},
): ToolsInput {
  if (access.connections.length === 0) return {}
  return {
    ...(include.reads === false ? {} : readTool(access)),
    ...(include.inventory === undefined
      ? {}
      : inventorySearchTool({
          connection: connectionField(access.connections),
          connector: CONNECTOR_FIELD,
          resolve: (connection, connector) => inScope(access.connections, connection, connector),
          notGranted: NOT_GRANTED,
          ask: include.inventory,
        })),
    ...(include.concepts === undefined
      ? {}
      : conceptProposeTool({
          connection: connectionField(access.connections),
          connector: CONNECTOR_FIELD,
          resolve: (connection, connector) => inScope(access.connections, connection, connector),
          call: include.concepts,
        })),
    ...(include.propose === undefined
      ? {}
      : copyProposeTool(include.propose.copying, include.propose.call)),
  }
}
