import { z } from 'zod'
import type { Auth } from './auth.ts'
import { CredentialClass } from './credential-class.ts'
import { Numbers } from './exact-json.ts'
import type { AccountOf, Failure, Operation, OperationId, WriteOperation } from './operation.ts'

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

/**
 * An answer the provider's real service gave to an operation, kept so the double sends it as it came
 * and the conformance checks the kit reads it: the body is invented in its values (S40), the
 * envelope, the code and the message are the measured ones.
 */
export type RecordedRefusal = Readonly<{
  operation: OperationId
  status: number
  body: unknown
  kind: Failure['kind'] // what `operation.answer` must make of it
}>

/** A skill as Mastra's `createSkill` takes it: `SKILL.md`, and each part of `references/` by file name. */
export type ConnectorSkill = Readonly<{
  content: string
  references: Readonly<Record<string, string>>
}>

const PerProject = z.enum(['one', 'many'])
type PerProject = z.infer<typeof PerProject>

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
  // How many of this connector's connections one Projeto may use (founder, 2026-10-29): a key, not code.
  perProject: PerProject // required, no default
  subjects: Readonly<Record<string, string>> // subject id → label ("vendas" → "Vendas"); each has an operation
  operations: readonly Operation<unknown, unknown>[] // typed, the same for every company
  readDoor?: ReadDoor // for what each company has of its own
  // Where the provider counts its call limit: by the Conexus app, one for every company, or by each account. Required when an operation declares `list`.
  callLimit?: Readonly<{ countedBy: 'APP' | 'ACCOUNT' }>
  // The writes the connector declares, the one list the Hub's write funnel reads (the read door and `operations` refuse a write); never probed.
  writes?: readonly WriteOperation<unknown, unknown>[]
  // The refusals recorded from the real service (see `RecordedRefusal`); the conformance reads each one through its operation.
  refusals?: readonly RecordedRefusal[]
  // The one read Testar sends (Nango's `verification`, n8n's credential `test`): one of
  // `operations`, reading from no earlier one; each read's own health is the platform's.
  check: Operation<unknown, unknown, 'read'>
  // EXACT keeps a number a double cannot hold as its source text; DOUBLE takes JavaScript's number
  numbers: Numbers
  // The part of the skill a person writes; the agents read `connectorSkill`
  skill: Readonly<{ written: ConnectorSkill }>
}>

const Version = z.string().regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/)
const Origin = z
  .string()
  .refine(
    (value) =>
      URL.canParse(value) && new URL(value).origin === value && value.startsWith('https://'),
  )

/** Takes `id` as a plain string and brands it; throws on a `perProject` other than 'one' or 'many', a login without its credential class, a `numbers` other than 'EXACT' or 'DOUBLE', a reported account with a login that is not OAuth, a repeated operation id, a bad version or origin, a door entry that is not 'read', a list read in a connector with no `callLimit`, a write that is not 'write' or repeats an id, an operation of a subject the connector lacks, a subject with no operation, a `from` that is not an earlier operation, a check that is not one of its operations or needs an earlier one, or a written skill that names one of its tools. */
export function defineConnector<A extends Auth>(
  connector: Omit<Connector, 'id' | 'auth'> & { id: string; auth: A },
): Connector & Readonly<{ auth: A }> {
  Version.parse(connector.version)
  Origin.parse(connector.origin)
  PerProject.parse(connector.perProject)
  CredentialClass.parse(connector.auth.credentialClass)
  Numbers.parse(connector.numbers)
  if (connector.account.kind === 'reported' && connector.auth.kind !== 'oauth2_code')
    throw new Error(`Reported account without an OAuth login in ${connector.id}`)
  const all = inProbeOrder(connector)
  const declared = declaredOf(connector)
  const ids = declared.map((operation) => operation.id)
  if (new Set(ids).size !== ids.length) throw new Error(`Repeated operation id in ${connector.id}`)
  assertWritesWrite(connector)
  assertCallLimit(connector, declared)
  for (const [key, operation] of Object.entries(connector.readDoor ?? {})) {
    if (operation.class !== 'read') throw new Error(`Door entry not read: ${key}`)
    if (operation.id !== key) throw new Error(`Door entry ${key} is named ${operation.id}`)
  }
  const named = new Set(declared.map((operation) => operation.subject))
  for (const subject of named)
    if (!(subject in connector.subjects)) throw new Error(`Unknown subject ${subject}`)
  for (const subject of Object.keys(connector.subjects))
    if (!named.has(subject)) throw new Error(`Subject without operation: ${subject}`)
  assertSourcesEarlier(all)
  assertCheckStandsAlone(connector)
  assertSkillNamesNoTool(connector, declared)
  return Object.freeze({ ...connector, id: ConnectorId.parse(connector.id) })
}

/** Every operation the connector declares: the door's, the reads and the writes. */
function declaredOf(connector: Pick<Connector, 'operations' | 'readDoor' | 'writes'>) {
  return [...inProbeOrder(connector), ...(connector.writes ?? [])]
}

/** The agent's tool for one operation of a connector (`sankhya_pedidos`): the Builder names its typed reads by it. */
export function toolNameOf(connector: Readonly<{ id: string }>, operation: string): string {
  return `${connector.id}_${operation}`
}

function assertSkillNamesNoTool(
  connector: Pick<Connector, 'skill'> & { id: string },
  declared: readonly Operation<unknown, unknown>[],
): void {
  const { content, references } = connector.skill.written
  const text = [content, ...Object.values(references)].join('\n')
  const named = declared
    .map((operation) => toolNameOf(connector, operation.id))
    .filter((tool) => text.includes(tool))
  if (named.length > 0) throw new Error(`The skill of ${connector.id} names ${named.join(', ')}`)
}

function assertWritesWrite(connector: Pick<Connector, 'writes'>): void {
  for (const operation of connector.writes ?? [])
    if (operation.class !== 'write') throw new Error(`Write not write: ${operation.id}`)
}

function assertCallLimit(
  connector: Pick<Connector, 'callLimit'> & { id: string },
  declared: readonly Operation<unknown, unknown>[],
): void {
  if (
    declared.some((operation) => operation.list !== undefined) &&
    connector.callLimit === undefined
  )
    throw new Error(`List read without callLimit in ${connector.id}`)
}

function assertCheckStandsAlone(connector: Pick<Connector, 'operations' | 'check'>): void {
  const { check } = connector
  if (!connector.operations.includes(check)) throw new Error(`Check ${check.id} is no operation`)
  if (check.from.length > 0 || check.probe(new Map()) === null)
    throw new Error(`Check ${check.id} needs an earlier read`)
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

/** The record of a connector's reads by id, the source of the app's types (`calls.ts`); throws when a key is not its operation's id. */
export function readsOf<
  const R extends Readonly<Record<string, Operation<unknown, unknown, 'read'>>>,
>(reads: R): R {
  for (const [key, operation] of Object.entries(reads))
    if (operation.id !== key) throw new Error(`Read ${key} is named ${operation.id}`)
  return Object.freeze(reads)
}

/** A door of read operations only: a write or destructive entry does not compile. */
export function defineReadDoor<D extends ReadDoor>(door: D): D {
  return Object.freeze(door)
}
