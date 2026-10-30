import { z } from 'zod'

/** What an operation does to the provider's data (founder, M1): a grant's ceiling and an agent's approval read it. */
export const OPERATION_CLASSES = ['read', 'write', 'destructive'] as const
export type OperationClass = (typeof OPERATION_CLASSES)[number]

/** A request the connector builds; the executor sends it to the connector's pinned origin, never elsewhere. */
export type ProviderRequest = Readonly<{
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: `/${string}`
  query: Readonly<Record<string, string>>
  body: unknown // JSON, or undefined
}>

/** What came back, already parsed as JSON by the executor; the raw text never reaches the kit. */
export type ProviderAnswer = Readonly<{ status: number; body: unknown }>

/**
 * Why a 2xx did not read, never a value from it: the body passed the executor's cap, or its envelope
 * is not in the shape the kit reads (each Zod issue's path, the type it expected and the type that came).
 */
export type Unread =
  | Readonly<{ kind: 'TOO_LARGE'; limitBytes: number }>
  | Readonly<{
      kind: 'SHAPE'
      issues: Readonly<{ path: string; expected: string; received: string }>[]
    }>

/** What the provider said when it refused, as it came: the status, where its code and message sit, and the body unchanged; `reason` on a 2xx that did not read. */
export type Native = Readonly<{
  status: number
  code: string | null
  message: string | null
  body: unknown
  reason?: Unread
}>

/** A call that gave no rows. `TOKEN_EXPIRED`: the executor asks a new token once and repeats; a second time is `AUTH_REFUSED`. */
export type Failure = Readonly<{
  kind: 'REFUSED' | 'AUTH_REFUSED' | 'TOKEN_EXPIRED' | 'UNREADABLE'
  native: Native
}>

/** An operation's outcome as data: a refusal is never an empty list (architecture §1), and carries what the provider said. `empty` marks an OK read that had nothing to look at. */
export type Answered<O> = Readonly<{ kind: 'OK'; value: O; empty?: true }> | Failure

/** What a status outside 2xx means when the connector documents no exception: the key is refused, the request is, or the answer is not understood. */
export function outcomeOf(status: number): 'AUTH_REFUSED' | 'REFUSED' | 'UNREADABLE' {
  if (status === 401) return 'AUTH_REFUSED'
  if (status === 400 || status === 403 || status === 404 || status === 409 || status === 422)
    return 'REFUSED'
  return 'UNREADABLE'
}

/** Where a body usually keeps its code and message, for the logins and the connectors that declare no better place. */
export function locateOf(body: unknown): Pick<Native, 'code' | 'message'> {
  const found = z
    .looseObject({
      code: z.union([z.string(), z.number()]).optional(),
      message: z.string().optional(),
    })
    .safeParse(body)
  return {
    code: found.success && found.data.code !== undefined ? String(found.data.code) : null,
    message: found.success ? (found.data.message ?? null) : null,
  }
}

/** The kind of a value, by the names Zod's issues use, so the expected and the received read alike. */
function kindOf(value: unknown): string {
  if (Array.isArray(value)) return 'array'
  return value === null ? 'null' : typeof value
}

/** The Zod issues of a body that did not parse, as an Unread: the type found at each path, never what it held. */
export function shapeOf(error: z.ZodError, body: unknown): Unread {
  const issues = error.issues.slice(0, 3).map((issue) => {
    const found = issue.path.reduce<unknown>(
      (at, key) => (typeof at === 'object' && at !== null ? Reflect.get(at, key) : undefined),
      body,
    )
    const expected =
      issue.code === 'invalid_type'
        ? issue.expected
        : issue.code === 'invalid_value'
          ? issue.values.map(String).join(' | ')
          : issue.code
    return { path: issue.path.map(String).join('.'), expected, received: kindOf(found) }
  })
  return { kind: 'SHAPE', issues }
}

export const OperationId = z
  .string()
  .regex(/^[a-z][a-zA-Z0-9]{1,39}$/)
  .brand('OperationId')
export type OperationId = z.infer<typeof OperationId>

const Subject = z.string().regex(/^[a-z]+$/)

export type Operation<I, O, C extends OperationClass = OperationClass> = Readonly<{
  id: OperationId
  class: C // required, no default
  subject: string // a key of the connector's `subjects`: what the skill groups it under
  idempotent: boolean
  summary: string // one line, Portuguese: the skill and, later, the tool read it
  label: string // what Testar shows ("Pedidos")
  input: z.ZodType<I>
  output: z.ZodType<O>
  // The earlier operations whose answers `probe` reads (pedidos reads empresas), so a caller
  // tells a source that never read apart from one that read nothing.
  from: readonly OperationId[]
  // The smallest input, for Testar and the conformance, from the values its `from` read
  // (pedidos needs a company code); null when there is nothing to read (impostos with no pedido).
  probe(earlier: ReadonlyMap<OperationId, unknown>): I | null
  request(input: I): ProviderRequest
  answer(answer: ProviderAnswer): Answered<O>
}>

/** Takes `id` as a plain string and brands it (throws on a bad one), so a definition writes `id: 'pedidos'`; `from` is empty unless given. */
export function defineOperation<I, O, C extends OperationClass>(
  operation: Omit<Operation<I, O, C>, 'id' | 'from'> & { id: string; from?: readonly string[] },
): Operation<I, O, C> {
  return Object.freeze({
    ...operation,
    id: OperationId.parse(operation.id),
    subject: Subject.parse(operation.subject),
    from: Object.freeze(z.array(OperationId).parse(operation.from ?? [])),
  })
}

/** The only way a request is built from an input: the operation's own schema parses it first, so a refused input never reaches `request`. */
export function requestOf<I>(operation: Operation<I, unknown>, input: unknown): ProviderRequest {
  return operation.request(operation.input.parse(input))
}
