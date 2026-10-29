import { z } from 'zod'
import type { Auth } from './auth.ts'
import type { Operation, OperationId } from './operation.ts'

export const ConnectorId = z
  .string()
  .regex(/^[a-z][a-z0-9-]{1,31}$/)
  .brand('ConnectorId')
export type ConnectorId = z.infer<typeof ConnectorId>

/** `unknown` erases an operation's types: its methods are bivariant, so a typed operation is a member. */
export type ReadDoor = Readonly<Record<string, Operation<unknown, unknown, 'read'>>>

export type Connector = Readonly<{
  id: ConnectorId
  name: string
  version: `${number}.${number}.${number}`
  origin: `https://${string}` // the one published origin
  auth: Auth
  oneRequestAtATime: boolean // a token is one session (Sankhya's envelope "4")
  operations: readonly Operation<unknown, unknown>[] // typed, the same for every company
  readDoor?: ReadDoor // for what each company has of its own
  skill: string // what the Builder reads to use the connector (decision 0055); the conformance checks it names every operation
}>

const Version = z.string().regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/)
const Origin = z
  .string()
  .refine(
    (value) =>
      URL.canParse(value) && new URL(value).origin === value && value.startsWith('https://'),
  )

/** Takes `id` as a plain string and brands it; throws on a repeated operation id, a bad version or origin, a door entry that is not 'read'. */
export function defineConnector(connector: Omit<Connector, 'id'> & { id: string }): Connector {
  Version.parse(connector.version)
  Origin.parse(connector.origin)
  const door = Object.entries(connector.readDoor ?? {})
  const ids: OperationId[] = [
    ...connector.operations.map((operation) => operation.id),
    ...door.map(([, operation]) => operation.id),
  ]
  if (new Set(ids).size !== ids.length) throw new Error(`Repeated operation id in ${connector.id}`)
  for (const [key, operation] of door) {
    if (operation.class !== 'read') throw new Error(`Door entry not read: ${key}`)
    if (operation.id !== key) throw new Error(`Door entry ${key} is named ${operation.id}`)
  }
  return Object.freeze({ ...connector, id: ConnectorId.parse(connector.id) })
}

/** A door of read operations only: a write or destructive entry does not compile. */
export function defineReadDoor<D extends ReadDoor>(door: D): D {
  return Object.freeze(door)
}
