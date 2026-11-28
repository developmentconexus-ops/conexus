import type { ToolSearchProcessorOptions } from '@mastra/core/processors'
import type { RequestContext } from '@mastra/core/request-context'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import type { Connector, Operation } from '../../../hub/connectors/public.ts'
import { CONNECTORS, toolNameOf } from '../../../hub/connectors/public.ts'
import type { ConnectorAccess } from './connector-tools.ts'
import { answerWords, NOT_GRANTED, readOn } from './connector-tools.ts'

type Read = Operation<unknown, unknown, 'read'>
type TypedRead = Readonly<{ connector: Connector; operation: Read }>

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
      toolNameOf(connector, operation.id),
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
type AccessOf = (requestContext: RequestContext) => Promise<ConnectorAccess | undefined>

/** The connector and the operation a typed read's name stands for; none for a name of no read. */
export function readTarget(
  name: string,
): Readonly<{ connector: string; operation: string }> | undefined {
  const read = CATALOG.get(name)
  return read === undefined
    ? undefined
    : { connector: read.connector.id, operation: read.operation.id }
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

/**
 * One tool for one read. `strict: false`: a read's optional fields are really optional, and some are
 * exclusive (`offset` against `scan` and `scrollId`). Mastra's OpenAI compatibility layer, which
 * makes every field required and nullable, never reaches a tool that `search_tools` loads (the loop
 * converts it without the model), so OpenAI's default strict mode would force the model to fill
 * every field, and it fills the exclusive ones. Not strict, the model omits what it does not need,
 * as Claude does. Mastra defect, still in 1.86.0 (`@mastra/core` `run-registry-Bx06ZIN_.js:99571-99590`):
 * the loop calls `makeProcessorCoreTool` without `model`.
 */
function typedTool(name: string, read: TypedRead, accessOf: AccessOf) {
  const { connector, operation } = read
  const open = openInputOf(operation)
  if ('connection' in open.shape) {
    throw new Error(`The read ${name} has its own connection field`)
  }
  return createTool({
    id: name,
    description: `${operation.summary} (${connector.name}, by the connection's name.) ${answerWords()}`,
    strict: false,
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
 * the same for every request; who may see one decides per request (the search's `filter`), and each read
 * goes through the conversation's door, with its cut, its file and its count.
 */
export function typedReads(accessOf: AccessOf): ToolSearchProcessorOptions['tools'] {
  return Object.fromEntries(
    [...CATALOG].map(([name, read]) => [name, typedTool(name, read, accessOf)]),
  )
}
