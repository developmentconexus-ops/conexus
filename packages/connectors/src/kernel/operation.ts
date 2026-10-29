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

/** An operation's outcome as data: a refusal is never an empty list (architecture §1). */
export type Answered<O> = Readonly<
  | { kind: 'OK'; value: O }
  | { kind: 'REFUSED'; reason: 'NO_PERMISSION' | 'INPUT' | 'VENDOR' }
  | { kind: 'AUTH_REFUSED' }
  | { kind: 'TOKEN_EXPIRED' } // the executor asks a new token once and repeats; a second time is AUTH_REFUSED
  | { kind: 'UNREADABLE' }
>

export const OperationId = z
  .string()
  .regex(/^[a-z][a-zA-Z0-9]{1,39}$/)
  .brand('OperationId')
export type OperationId = z.infer<typeof OperationId>

export type Operation<I, O, C extends OperationClass = OperationClass> = Readonly<{
  id: OperationId
  class: C // required, no default
  idempotent: boolean
  summary: string // one line, Portuguese: the skill and, later, the tool read it
  label: string // what Testar shows ("Pedidos")
  input: z.ZodType<I>
  output: z.ZodType<O>
  // The smallest input, for Testar and the conformance, from the values the earlier probes read
  // (pedidos needs a company code); null when there is nothing to read (impostos with no pedido).
  probe(earlier: ReadonlyMap<OperationId, unknown>): I | null
  request(input: I): ProviderRequest
  answer(answer: ProviderAnswer): Answered<O>
}>

/** Takes `id` as a plain string and brands it (throws on a bad one), so a definition writes `id: 'pedidos'`. */
export function defineOperation<I, O, C extends OperationClass>(
  operation: Omit<Operation<I, O, C>, 'id'> & { id: string },
): Operation<I, O, C> {
  return Object.freeze({ ...operation, id: OperationId.parse(operation.id) })
}
