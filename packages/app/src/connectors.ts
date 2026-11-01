import type { ConnectionsAnswer, ConnectorAnswer, Context } from '@conexus/app-contract'
import type { ConnectorReads, PerProject } from '@conexus/connectors/calls'

type Connector = keyof ConnectorReads

/** The reads an app calls, by connector and the kit's operation ids: what `shared/operations.ts` exports as `connectors`. */
export type Declared = Readonly<{
  [C in Connector]?: readonly (keyof ConnectorReads[C] & string)[]
}>

/** A connector's answer with the value its read gives on `OK`; every other kind is the platform's, as it came. */
export type Answered<O> =
  | Readonly<{ kind: 'OK'; value: O; empty?: true }>
  | Exclude<ConnectorAnswer, Readonly<{ kind: 'OK' }>>

type Read<C extends Connector, R> =
  R extends Readonly<{ input: infer I; output: infer O }>
    ? (
        input: I,
        ...connection: PerProject[C] extends 'many' ? [name: string] : []
      ) => Promise<Answered<O>>
    : never

/** The names of a connector's connections released to the Projeto, for a connector that allows many. */
type Listed<C extends Connector> = PerProject[C] extends 'many'
  ? Readonly<{ connections(): Promise<ConnectionsAnswer> }>
  : unknown

type ClientOf<D extends Declared> = {
  readonly [C in keyof D & Connector]: Readonly<{
    [K in NonNullable<D[C]>[number] & keyof ConnectorReads[C]]: Read<C, ConnectorReads[C][K]>
  }> &
    Listed<C>
}

/**
 * Declares once the connectors' reads the app calls (code C26): the check carries them to the
 * manifest, which the Hub checks at Publicar and at each call, and `connectorsOf` gives the handler
 * exactly these.
 */
export function defineConnectors<const D extends Declared>(declared: D): D {
  return declared
}

/**
 * What a handler calls: `connectors.sankhya.pedidos(input)`, typed by the kit; a connector that
 * allows many connections takes the connection's name, from its `connections()`.
 */
export function connectorsOf<const D extends Declared>(context: Context, declared: D): ClientOf<D>
export function connectorsOf(context: Context, declared: Declared): unknown {
  const { connectors } = context
  return Object.fromEntries(
    Object.entries(declared).map(([connector, operations = []]) => [
      connector,
      Object.fromEntries([
        ['connections', () => connectors.connections(connector)],
        ...operations.map((operation) => [
          operation,
          (input: unknown, connection?: string) =>
            connectors.call(connector, operation, input, connection),
        ]),
      ]),
    ]),
  )
}
