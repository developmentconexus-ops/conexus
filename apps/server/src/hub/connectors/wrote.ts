import type { Answered, Native, ProviderAnswer, WriteOperation } from '@conexus/connectors'
import type { Unreachable } from './send.ts'
import type { Unreadable } from './wire.ts'
import { isOk } from './wire.ts'

/**
 * What a write ended as: the kit's answer, a provider never reached (nothing was sent), or a send
 * whose end is unknown (`UNCERTAIN`: a cut, a 5xx, what the write declares uncertain or a 2xx that does not read,
 * after the request left): the order may exist, so the caller never sends it again.
 */
export type Wrote<O> =
  | Answered<O>
  | Readonly<{ kind: 'UNREACHABLE'; native: null }>
  | Readonly<{ kind: 'UNCERTAIN'; native: Native | null }>

function uncertain(native: Native | null) {
  return { kind: 'UNCERTAIN', native } as const
}

/** After the request left, only what the write declares uncertain and a 2xx that does not read leave the order's fate unknown; every other answer says it was refused. */
function endsUnknown(
  answered: Exclude<Answered<unknown>, { kind: 'OK' }>,
  operation: WriteOperation<unknown, unknown>,
): boolean {
  if (operation.uncertain(answered.native)) return true
  return answered.kind === 'UNREADABLE' && isOk(answered.native.status)
}

/** A write's end: only a connection never made is a plain failure, and what came back after the request left is `UNCERTAIN` unless the provider's answer proves it refused. */
export function wroteOf<O>(
  sent: ProviderAnswer | Unreadable | Unreachable,
  operation: WriteOperation<unknown, O>,
): Wrote<O> {
  if ('kind' in sent && sent.kind === 'UNREACHABLE')
    return sent.notSent === true ? { kind: 'UNREACHABLE', native: null } : uncertain(sent.native)
  const answered = 'kind' in sent ? sent : operation.answer(sent)
  return answered.kind !== 'OK' && endsUnknown(answered, operation)
    ? uncertain(answered.native)
    : answered
}
