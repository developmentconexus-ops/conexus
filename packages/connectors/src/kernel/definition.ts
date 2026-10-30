import { z } from 'zod'
import type { Auth } from './auth.ts'
import type { AccountOf, Operation, OperationId } from './operation.ts'

export const ConnectorId = z
  .string()
  .regex(/^[a-z][a-z0-9-]{1,31}$/)
  .brand('ConnectorId')
export type ConnectorId = z.infer<typeof ConnectorId>

/** `unknown` erases an operation's types: its methods are bivariant, so a typed operation is a member. */
export type ReadDoor = Readonly<Record<string, Operation<unknown, unknown, 'read'>>>

/** What the provider says about the account behind a connection (several connections per connector, founder 2026-10-29). */
type AccountIdentity =
  // No account in the login's answer (Sankhya): the name the company gives tells connections apart.
  | Readonly<{ kind: 'none' }>
  // The provider says whose the grant is; `exclusive`: one connection per account in all of Conexus.
  | Readonly<{
      kind: 'reported'
      exclusive: true
      who: Readonly<{ path: `/${string}`; answer: z.ZodType<AccountOf> }>
    }>

export type Connector = Readonly<{
  id: ConnectorId
  name: string
  version: `${number}.${number}.${number}`
  origin: `https://${string}` // the one published origin
  auth: Auth
  account: AccountIdentity // required, no default
  category: string // "ERP": the catalog and the list group show it
  summary: string // one line, Portuguese: what the system is
  logo: string // the provider's official logo, an SVG read from the connector's folder; the screen shows it as a data: image
  oneRequestAtATime: boolean // a token is one session (Sankhya's envelope "4")
  subjects: Readonly<Record<string, string>> // subject id → label ("vendas" → "Vendas"); each has an operation
  operations: readonly Operation<unknown, unknown>[] // typed, the same for every company
  readDoor?: ReadDoor // for what each company has of its own
  // The one read Testar sends (Nango's `verification`, n8n's credential `test`): one of
  // `operations`, reading from no earlier one; each read's own health is the platform's.
  check: Operation<unknown, unknown, 'read'>
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

/** Takes `id` as a plain string and brands it; throws on a reported account with a login that is not OAuth, a repeated operation id, a bad version or origin, a door entry that is not 'read', an operation of a subject the connector lacks, a subject with no operation, a `from` that is not an earlier operation, or a check that is not one of its operations or needs an earlier one. */
export function defineConnector<A extends Auth>(
  connector: Omit<Connector, 'id' | 'auth'> & { id: string; auth: A },
): Connector & Readonly<{ auth: A }> {
  Version.parse(connector.version)
  Origin.parse(connector.origin)
  if (connector.account.kind === 'reported' && connector.auth.kind !== 'oauth2_code')
    throw new Error(`Reported account without an OAuth login in ${connector.id}`)
  const all = inProbeOrder(connector)
  const ids = all.map((operation) => operation.id)
  if (new Set(ids).size !== ids.length) throw new Error(`Repeated operation id in ${connector.id}`)
  for (const [key, operation] of Object.entries(connector.readDoor ?? {})) {
    if (operation.class !== 'read') throw new Error(`Door entry not read: ${key}`)
    if (operation.id !== key) throw new Error(`Door entry ${key} is named ${operation.id}`)
  }
  const named = new Set(all.map((operation) => operation.subject))
  for (const subject of named)
    if (!(subject in connector.subjects)) throw new Error(`Unknown subject ${subject}`)
  for (const subject of Object.keys(connector.subjects))
    if (!named.has(subject)) throw new Error(`Subject without operation: ${subject}`)
  assertSourcesEarlier(all)
  const { check } = connector
  if (!connector.operations.includes(check)) throw new Error(`Check ${check.id} is no operation`)
  if (check.from.length > 0 || check.probe(new Map()) === null)
    throw new Error(`Check ${check.id} needs an earlier read`)
  return Object.freeze({ ...connector, id: ConnectorId.parse(connector.id) })
}

function assertSourcesEarlier(all: readonly Operation<unknown, unknown>[]): void {
  const before = new Set<OperationId>()
  for (const operation of all) {
    for (const source of operation.from)
      if (!before.has(source)) throw new Error(`${operation.id} reads ${source}, not earlier`)
    before.add(operation.id)
  }
}

/** The order every probe runs in, the door first: each operation's `from` is before it. */
export function inProbeOrder(
  connector: Pick<Connector, 'operations' | 'readDoor'>,
): readonly Operation<unknown, unknown>[] {
  return [...Object.values(connector.readDoor ?? {}), ...connector.operations]
}

/** A door of read operations only: a write or destructive entry does not compile. */
export function defineReadDoor<D extends ReadDoor>(door: D): D {
  return Object.freeze(door)
}
