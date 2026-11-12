import type { Connector, Operation } from '@conexus/connectors'
import { CONNECTORS } from '@conexus/connectors'
import type { ToolSearchProcessorOptions } from '@mastra/core/processors'
import type { RequestContext } from '@mastra/core/request-context'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import type { ConnectorAccess } from './connector-tools.ts'
import { answerWords, NOT_GRANTED, readOn } from './connector-tools.ts'

type Read = Operation<unknown, unknown, 'read'>
type TypedRead = Readonly<{ connector: Connector; operation: Read }>

/** The tool's name for one read of a connector: `sankhya_pedidos`. */
export function typedReadName(connector: string, operation: string): string {
  return `${connector}_${operation}`
}

function isRead(operation: Operation<unknown, unknown>): operation is Read {
  return operation.class === 'read'
}

/** Every read a connector declares, its ready operations and its door's, as the Hub lists them. */
function readsIn(connector: Connector): readonly Read[] {
  return [...connector.operations, ...Object.values(connector.readDoor ?? {})].filter(isRead)
}

/** The static catalog: one read of each connector of `CONNECTORS` under its tool's name. */
const CATALOG: ReadonlyMap<string, TypedRead> = new Map(
  CONNECTORS.flatMap((connector) =>
    readsIn(connector).map((operation) => [
      typedReadName(connector.id, operation.id),
      { connector, operation },
    ]),
  ),
)

/** The names of every typed read, for the mode's closed set. */
export const TYPED_READ_NAMES: readonly string[] = [...CATALOG.keys()]

/** The fields of a read's input the model fills: all but those only whoever configures fixes (decision 0062). */
function openInputOf(operation: Read): z.ZodObject {
  const { input } = operation
  if (!(input instanceof z.ZodObject)) {
    throw new Error(`The read ${operation.id} takes no object, so it has no typed tool`)
  }
  const fixed = new Set(operation.fixed ?? [])
  return z.object(Object.fromEntries(Object.entries(input.shape).filter(([f]) => !fixed.has(f))))
}

/** The conversation's access for a run: its chosen connections and its door; none outside a conversation. */
export type AccessOf = (requestContext: RequestContext) => Promise<ConnectorAccess | undefined>

type Chosen = readonly Pick<ConnectorAccess['connections'][number], 'connector' | 'reads'>[]

/**
 * Whether the run may see the typed read: one of its chosen connections is of the read's connector
 * and lists the read, as the role allows it (`visibleTo`, the Hub's `mayUseEach`).
 */
export function offersRead(name: string, chosen: Chosen): boolean {
  const read = CATALOG.get(name)
  if (read === undefined) return false
  return chosen.some(
    (each) =>
      each.connector === read.connector.id &&
      each.reads.some((listed) => listed.operation === read.operation.id),
  )
}

/** A name that is none of the conversation's connections of this connector: refused with the names there are. */
function notChosen(access: ConnectorAccess, read: TypedRead) {
  const { connector, operation } = read
  access.log.info(
    { connector: connector.id, operation: operation.id, reason: 'NOT_CHOSEN' },
    'CONNECTOR_READ_REFUSED',
  )
  const names = access.connections
    .filter((each) => each.connector === connector.id)
    .map((each) => `"${each.name}"`)
  return {
    ...NOT_GRANTED,
    reason:
      names.length === 0
        ? `This conversation chose no connection of ${connector.name}.`
        : `The connections of ${connector.name} this conversation chose are ${names.join(', ')}. Name one of them exactly.`,
  }
}

function typedTool(name: string, read: TypedRead, accessOf: AccessOf, limit: string) {
  const { connector, operation } = read
  const open = openInputOf(operation)
  if ('connection' in open.shape) {
    throw new Error(`The read ${name} has its own connection field`)
  }
  return createTool({
    id: name,
    description: `${operation.summary} (${connector.name}, by the connection's name.) ${answerWords(limit)}`,
    inputSchema: z.strictObject({
      connection: z.string().describe("The connection's name, exactly as listed"),
      ...open.shape,
    }),
    execute: async ({ connection, ...input }, { requestContext, workspace, abortSignal }) => {
      if (requestContext === undefined) return NOT_GRANTED
      const access = await accessOf(requestContext)
      if (access === undefined) return NOT_GRANTED
      const found = access.connections.find(
        (each) => each.connector === connector.id && each.name === connection,
      )
      if (found === undefined) return notChosen(access, read)
      return readOn(
        access,
        { connectionId: found.connectionId, operation: operation.id, input },
        { requestContext, workspace, abortSignal },
      )
    },
  })
}

/**
 * The typed reads (step U6): one tool per read of each connector, with the operation's own input,
 * the same for every request; who may see one decides per request (`offersRead`), and each read
 * goes through the conversation's door, with its cut, its file and its count.
 */
export function typedReads(accessOf: AccessOf, limit: string): ToolSearchProcessorOptions['tools'] {
  return Object.fromEntries(
    [...CATALOG].map(([name, read]) => [name, typedTool(name, read, accessOf, limit)]),
  )
}
