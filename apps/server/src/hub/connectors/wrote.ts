import type { Answered, ProviderAnswer, WriteOperation } from '@conexus/connectors'
import type { Unreachable } from './send.ts'
import type { Unreadable } from './wire.ts'

/** What the provider answered to a write, as the wire read it and before the kit: the status and the whole body, secrets replaced. */
export type Returned = Readonly<{ status: number; body: unknown }>

/**
 * What a write ended as: the kit's answer, a provider never reached (nothing was sent), or a send
 * whose end is unknown (`UNCERTAIN`: a cut, a 5xx, what the write declares uncertain or an answer that does not read,
 * after the request left): the order may exist, so the caller never sends it again. `returned` is
 * what came back, null when nothing did.
 */
export type Wrote<O> =
  | Readonly<{ kind: 'OK'; value: O; returned: Returned }>
  | Exclude<Answered<O>, { kind: 'OK' }>
  | Readonly<{ kind: 'UNREACHABLE'; native: null }>
  | Readonly<{ kind: 'UNCERTAIN'; returned: Returned | null }>

/** After the request left, only an answer the kit read as a refusal says it was refused: what the write declares uncertain and any answer that does not read, whatever its status, leave the order's fate unknown. */
function endsUnknown(
  answered: Exclude<Answered<unknown>, { kind: 'OK' }>,
  operation: WriteOperation<unknown, unknown>,
): boolean {
  return operation.uncertain(answered.native) || answered.kind === 'UNREADABLE'
}

/**
 * A write's end: only a connection never made is a plain failure; what came back after the request
 * left is `UNCERTAIN` unless the kit read it as a refusal, and an answer the wire could not read
 * (past the cap, or a 2xx that is not JSON) never reached the kit.
 */
export function wroteOf<O>(
  sent: ProviderAnswer | Unreadable | Unreachable,
  operation: WriteOperation<unknown, O>,
): Wrote<O> {
  if ('kind' in sent) {
    if (sent.kind === 'UNREADABLE')
      return {
        kind: 'UNCERTAIN',
        returned: { status: sent.native.status, body: sent.text ?? null },
      }
    if (sent.notSent === true) return { kind: 'UNREACHABLE', native: null }
    const { native } = sent
    return { kind: 'UNCERTAIN', returned: native && { status: native.status, body: native.body } }
  }
  const returned = { status: sent.status, body: sent.body }
  const answered = operation.answer(sent)
  if (answered.kind === 'OK') return { kind: 'OK', value: answered.value, returned }
  return endsUnknown(answered, operation) ? { kind: 'UNCERTAIN', returned } : answered
}
