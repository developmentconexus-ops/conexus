// What an app's typed client reads of the kit (`@conexus/connectors/calls`): types only, nothing
// that runs, so the app's bundle carries no line of the kit (security S36).
import type { z } from 'zod'
import type { Operation } from './kernel/operation.ts'
import type { mercadoLivreReads } from './mercado-livre/operations/index.ts'
import type { sankhyaReads } from './sankhya/operations/index.ts'

// A brand (sankhya/door.ts, ReadSql) is the kit's own check: the app writes the plain string, and the Hub parses it.
type Unbranded<T> = T extends string & z.$brand<string>
  ? string
  : T extends object
    ? { [K in keyof T]: Unbranded<T[K]> }
    : T

type ReadsOf<R> = {
  readonly [K in keyof R]: R[K] extends Operation<infer I, infer O>
    ? Readonly<{ input: Unbranded<I>; output: O }>
    : never
}

/** Each connector's reads by operation id, with the input the app sends and the value an `OK` carries. */
export type ConnectorReads = Readonly<{
  sankhya: ReadsOf<typeof sankhyaReads>
  'mercado-livre': ReadsOf<typeof mercadoLivreReads>
}>

/** Each connector's `perProject`, as its definition declares it (checked by a test). */
export type PerProject = Readonly<{ sankhya: 'one'; 'mercado-livre': 'many' }>
