import assert from 'node:assert/strict'
import { z } from 'zod'
import type { Connector } from './definition.ts'
import { inProbeOrder } from './definition.ts'
import { requestOf } from './operation.ts'

/** The instant the conformance builds its requests at: fixed, so a stamped request reads the same every run. */
export const SENT_AT = new Date('2026-11-09T13:00:00Z')

/** The keys under which a refusal's body keeps text a person reads; `code` is a label, not text. */
const TEXT_KEYS = new Set(['message', 'details', 'mensagem', 'descricao'])

function textsOf(body: unknown): string[] {
  if (Array.isArray(body)) return body.flatMap(textsOf)
  if (typeof body !== 'object' || body === null) return []
  return Object.entries(body).flatMap(([key, found]) =>
    typeof found === 'string' ? (TEXT_KEYS.has(key) ? [found] : []) : textsOf(found),
  )
}

/** Each recorded refusal goes through its operation's `answer`: the kind recorded beside it, and every text of its body in `native.message` (a reader that drops one hides the cause from the model). */
export function assertRefusalsRead(connector: Connector): void {
  const operations = [...inProbeOrder(connector), ...(connector.writes ?? [])]
  for (const recorded of connector.refusals ?? []) {
    const operation = operations.find((each) => each.id === recorded.operation)
    assert.ok(operation, `${recorded.operation} is an operation of ${connector.id}`)
    const answered = operation.answer({ status: recorded.status, body: recorded.body })
    assert.equal(answered.kind, recorded.kind, `${recorded.operation} reads its recorded refusal`)
    const texts = textsOf(recorded.body)
    assert.ok(texts.length > 0, `${recorded.operation}'s recorded body has a text to read`)
    for (const text of texts)
      assert.ok(
        answered.native.message?.includes(text),
        `${recorded.operation}: "${text}" is in native.message`,
      )
  }
}

const A_MARK = 'Conexus 0123456789abcdef'

/** For each write, its `mark` gives an input the operation accepts, and the mark reaches the request the kit builds: a mark put in a field `request` does not send would be lost. */
export function assertMarkReachesRequest(connector: Connector): void {
  for (const operation of connector.writes ?? []) {
    const input = operation.probe(new Map())
    assert.notEqual(input, null, `${operation.id} has a probe`)
    const marked = operation.mark(input, A_MARK)
    assert.ok(operation.input.safeParse(marked).success, `${operation.id}: the marked input reads`)
    const sent = JSON.stringify(requestOf(operation, marked, { ref: null }, SENT_AT))
    assert.ok(sent.includes(A_MARK), `${operation.id}: the mark is in the request`)
  }
}

/** Each key an operation lists in `fixed` is a top-level field of its input: a misspelt one would fix nothing. */
export function assertFixedExist(connector: Connector): void {
  for (const operation of [...inProbeOrder(connector), ...(connector.writes ?? [])]) {
    for (const key of operation.fixed ?? []) {
      assert.ok(
        operation.input instanceof z.ZodObject && key in operation.input.shape,
        `${operation.id}: "${key}" is a field of its input`,
      )
    }
  }
}

/** Bodies a 2xx may carry that prove neither the id nor a refusal. */
const NOT_PROOF = [
  undefined,
  null,
  {},
  [],
  'texto',
  { a: 1 },
  { mensagem: 'ok' },
  { retornoPedido: {} },
]

/** A write refuses only with proof: a 2xx whose body has no id and no refusal mark is `UNREADABLE`, never `REFUSED`, since the order may exist (a new write that reads a missing id as a refusal fails here). */
export function assertWriteNeedsProofToRefuse(connector: Connector): void {
  for (const operation of connector.writes ?? [])
    for (const body of NOT_PROOF)
      assert.equal(
        operation.answer({ status: 200, body }).kind,
        'UNREADABLE',
        `${operation.id}: a 200 with ${JSON.stringify(body) ?? 'no body'} is unreadable, not refused`,
      )
}

/** What a connector declares of its provider: the recorded refusals, the writes' proof to refuse, the marks and the fixed fields. */
export function assertDeclaredByProvider(connector: Connector): void {
  assertRefusalsRead(connector)
  assertWriteNeedsProofToRefuse(connector)
  assertMarkReachesRequest(connector)
  assertFixedExist(connector)
}
