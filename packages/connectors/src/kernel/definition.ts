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
  subjects: Readonly<Record<string, string>> // subject id → label ("vendas" → "Vendas"); each has an operation
  operations: readonly Operation<unknown, unknown>[] // typed, the same for every company
  readDoor?: ReadDoor // for what each company has of its own
  // What the Builder reads (decision 0055): SKILL.md and its references by file name, the shape
  // createSkill takes in step 20; a reference is read on demand through Mastra's skill_read.
  skill: Readonly<{ content: string; references: Readonly<Record<string, string>> }>
}>

const Version = z.string().regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/)
const Origin = z
  .string()
  .refine(
    (value) =>
      URL.canParse(value) && new URL(value).origin === value && value.startsWith('https://'),
  )

/** Takes `id` as a plain string and brands it; throws on a repeated operation id, a bad version or origin, a door entry that is not 'read', an operation of a subject the connector lacks or a subject with no operation. */
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
  const named = new Set([
    ...connector.operations.map((operation) => operation.subject),
    ...door.map(([, operation]) => operation.subject),
  ])
  for (const subject of named)
    if (!(subject in connector.subjects)) throw new Error(`Unknown subject ${subject}`)
  for (const subject of Object.keys(connector.subjects))
    if (!named.has(subject)) throw new Error(`Subject without operation: ${subject}`)
  return Object.freeze({ ...connector, id: ConnectorId.parse(connector.id) })
}

/** A door of read operations only: a write or destructive entry does not compile. */
export function defineReadDoor<D extends ReadDoor>(door: D): D {
  return Object.freeze(door)
}
