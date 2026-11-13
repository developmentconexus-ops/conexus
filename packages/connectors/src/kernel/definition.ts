import { z } from 'zod'
import type { Auth } from './auth.ts'
import type { ConnectorCopy } from './copy.ts'
import { CopyDefinitionV1 } from './copy.ts'
import type { ConnectorInventory } from './inventory.ts'
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
  // The paged read and the templates of copies (Capacity 2): outside `operations` and the door, so no role, tool or probe sees it.
  copy?: ConnectorCopy
  // The paged read of the system's own dictionary (the Ontology's inventory): outside `operations` too, so no role, tool or probe sees it.
  inventory?: ConnectorInventory
  // The writes the connector declares, the one list the Hub's write funnel reads (the read door and `operations` refuse a write); never probed.
  writes?: readonly WriteOperation<unknown, unknown>[]
  // The refusals recorded from the real service (see `RecordedRefusal`); the conformance reads each one through its operation.
  refusals?: readonly RecordedRefusal[]
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

/** Takes `id` as a plain string and brands it; throws on a `perProject` other than 'one' or 'many', a reported account with a login that is not OAuth, a repeated operation id, a bad version or origin, a door entry that is not 'read', a copy read that is not 'read' or repeats an operation id, a repeated copy template id or a template the `CopyDefinitionV1` refuses, a list read in a connector with no `callLimit`, a write that is not 'write' or repeats an id, an operation of a subject the connector lacks, a subject with no operation, a `from` that is not an earlier operation, or a check that is not one of its operations or needs an earlier one. */
export function defineConnector<A extends Auth>(
  connector: Omit<Connector, 'id' | 'auth'> & { id: string; auth: A },
): Connector & Readonly<{ auth: A }> {
  Version.parse(connector.version)
  Origin.parse(connector.origin)
  PerProject.parse(connector.perProject)
  if (connector.account.kind === 'reported' && connector.auth.kind !== 'oauth2_code')
    throw new Error(`Reported account without an OAuth login in ${connector.id}`)
  const all = inProbeOrder(connector)
  const declared = declaredOf(connector)
  const ids = declared.map((operation) => operation.id)
  if (new Set(ids).size !== ids.length) throw new Error(`Repeated operation id in ${connector.id}`)
  assertWritesWrite(connector)
  assertCopy(connector.copy, new Set(ids))
  assertInventory(connector.inventory, new Set(ids), connector.copy)
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
  return Object.freeze({ ...connector, id: ConnectorId.parse(connector.id) })
}

/** Every operation the connector declares: the door's, the reads and the writes. */
function declaredOf(connector: Pick<Connector, 'operations' | 'readDoor' | 'writes'>) {
  return [...inProbeOrder(connector), ...(connector.writes ?? [])]
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

function assertCopy(copy: ConnectorCopy | undefined, ids: ReadonlySet<string>): void {
  if (copy === undefined) return
  if (copy.read.class !== 'read') throw new Error(`Copy read not read: ${copy.read.id}`)
  if (ids.has(copy.read.id)) throw new Error(`Copy read repeats operation id ${copy.read.id}`)
  const models = copy.models.map((model) => model.id)
  if (new Set(models).size !== models.length) throw new Error('Repeated copy template id')
  for (const model of copy.models) CopyDefinitionV1.parse(model.definition)
}

function assertInventory(
  inventory: ConnectorInventory | undefined,
  ids: ReadonlySet<string>,
  copy: ConnectorCopy | undefined,
): void {
  if (inventory === undefined) return
  const { read } = inventory
  if (read.class !== 'read') throw new Error(`Inventory read not read: ${read.id}`)
  if (ids.has(read.id) || read.id === copy?.read.id)
    throw new Error(`Inventory read repeats operation id ${read.id}`)
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
