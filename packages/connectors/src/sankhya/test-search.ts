import assert from 'node:assert/strict'
import { z } from 'zod'
import { readToken, tokenRequest } from '../kernel/auth.ts'
import { SENT_AT } from '../kernel/conformance-declared.ts'
import type { Operation } from '../kernel/operation.ts'
import { requestOf } from '../kernel/operation.ts'
import { toRequest } from '../kernel/request.ts'
import { sankhya } from './definition.ts'
import { sankhyaFake } from './fake.ts'

/** The double without a socket, signed in once: `read` sends an operation's input and gives what the kit reads from the answer. */
export async function withDouble(
  use: (
    read: <I, O>(
      operation: Operation<I, O>,
      input: unknown,
    ) => Promise<ReturnType<typeof answerOf<O>>>,
    fake: ReturnType<typeof sankhyaFake>,
  ) => Promise<void>,
) {
  const fake = sankhyaFake()
  const login = await fake.handle(
    toRequest(sankhya, tokenRequest(sankhya.auth, fake.credential), null),
  )
  const token = readToken(sankhya.auth, { status: login.status, body: await login.json() })
  assert.equal(token.kind, 'OK')
  if (token.kind !== 'OK') return
  await use(async (operation, input) => {
    const request = requestOf(operation, input, { ref: null }, SENT_AT)
    const response = await fake.handle(toRequest(sankhya, request, token.accessToken))
    return answerOf(operation, response.status, z.unknown().parse(await response.json()))
  }, fake)
}

function answerOf<O>(operation: Operation<unknown, O>, status: number, body: unknown) {
  return operation.answer({ status, body })
}

/** The rows of an OK answer, or the failure it was. */
export function rowsOf(answered: { kind: string; value?: unknown }) {
  assert.equal(answered.kind, 'OK', JSON.stringify(answered))
  return z
    .object({ linhas: z.array(z.record(z.string(), z.unknown())), temMais: z.boolean() })
    .parse(answered.value)
}

export function codes(answered: { kind: string; value?: unknown }, field: string) {
  return rowsOf(answered).linhas.map((row) => row[field])
}
