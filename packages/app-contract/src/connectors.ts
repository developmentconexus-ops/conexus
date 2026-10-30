import { z } from 'zod'

// What an app's call to a connector answers (step 20): the kit's outcomes as data, never the
// provider's body, plus the platform's own refusals (code C26: this file owns the shape).

/** What the provider said, as far as an app may see it: the status, its code and its message. */
const NativeSummary = z.strictObject({
  status: z.int(),
  code: z.string().nullable(),
  message: z.string().nullable(),
})

/**
 * `NOT_GRANTED`: the connection is not released to the Projeto, the operation is not the kit's or the
 * version did not declare it, or the key must be connected again, all alike (security S10).
 * `DEADLINE`: the click's time ran out first.
 */
export const ConnectorAnswer = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('OK'), value: z.unknown(), empty: z.literal(true).optional() }),
  z.strictObject({ kind: z.literal('NOT_GRANTED') }),
  z.strictObject({
    kind: z.enum(['REFUSED', 'AUTH_REFUSED', 'UNREADABLE']),
    native: NativeSummary,
  }),
  z.strictObject({ kind: z.literal('BUSY'), waitMs: z.int().nonnegative().nullable() }),
  z.strictObject({ kind: z.enum(['UNREACHABLE', 'DEADLINE']) }),
])
export type ConnectorAnswer = z.infer<typeof ConnectorAnswer>

/** What `connections()` answers: the names, or why there are none to give, as `call` answers (code C26). */
export const ConnectionsAnswer = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('OK'), names: z.array(z.string()) }),
  z.strictObject({ kind: z.enum(['UNREACHABLE', 'DEADLINE']) }),
])
export type ConnectionsAnswer = z.infer<typeof ConnectionsAnswer>

/** The stub in `props.connectors`: `connection` is the connection's name, given only for a connector that allows many. */
export type Connectors = Readonly<{
  call(
    connector: string,
    operation: string,
    input: unknown,
    connection?: string,
  ): Promise<ConnectorAnswer>
  connections(connector: string): Promise<ConnectionsAnswer>
}>
