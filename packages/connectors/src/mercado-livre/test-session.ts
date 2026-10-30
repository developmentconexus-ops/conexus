import assert from 'node:assert/strict'
import { createHash, randomBytes } from 'node:crypto'
import { z } from 'zod'
import { inProbeOrder } from '../kernel/definition.ts'
import type { GrantAnswered } from '../kernel/oauth.ts'
import { authorizeUrl, codeRequest, readGrant } from '../kernel/oauth.ts'
import type {
  Operation,
  OperationId,
  ProviderAnswer,
  ProviderRequest,
} from '../kernel/operation.ts'
import { AccountRef, requestOf } from '../kernel/operation.ts'
import { toRequest } from '../kernel/request.ts'
import { mercadoLivre } from './definition.ts'
import type { mercadoLivreFake } from './fake.ts'

type Fake = ReturnType<typeof mercadoLivreFake>

export async function answerOf(response: Response): Promise<ProviderAnswer> {
  const text = await response.text()
  return {
    status: response.status,
    body: text === '' ? undefined : z.unknown().parse(JSON.parse(text)),
  }
}

/** The token endpoint's answer to a request the kit built, read by the kit. */
export async function grant(
  fake: Fake,
  request: Parameters<typeof toRequest>[1],
): Promise<GrantAnswered> {
  return readGrant(
    mercadoLivre.auth,
    await answerOf(await fake.handle(toRequest(mercadoLivre, request, null))),
  )
}

/** The person's trip to the authorization page of the double: the code they come back with, and the exchange of it with what is given. */
export async function startSignIn(fake: Fake) {
  const verifier = randomBytes(32).toString('base64url')
  const page = authorizeUrl(
    mercadoLivre.auth,
    {
      clientId: fake.app.clientId,
      redirectUri: fake.redirectUri,
      state: 's',
      challenge: createHash('sha256').update(verifier).digest('base64url'),
    },
    mercadoLivre.origin,
  )
  const back = new URL((await fake.handle(new Request(page))).headers.get('location') ?? '')
  const code = back.searchParams.get('code') ?? ''
  return {
    back,
    exchange: (a: { code?: string; verifier?: string; redirectUri?: string } = {}) =>
      grant(
        fake,
        codeRequest(mercadoLivre.auth, fake.app, {
          code: a.code ?? code,
          verifier: a.verifier ?? verifier,
          redirectUri: a.redirectUri ?? fake.redirectUri,
        }),
      ),
  }
}

/** A whole authorization of the account the double is set to. */
export async function authorize(fake: Fake): Promise<GrantAnswered> {
  return (await startSignIn(fake)).exchange()
}

/** The account the double is set to by default. */
export const ACCOUNT = { ref: AccountRef.parse('123456789') }

/** Every read, in probe order, from the answers before it: the request it built and the value it gave. */
export async function probeAll(
  fake: Fake,
): Promise<{ operation: Operation<unknown, unknown>; request: ProviderRequest; value: unknown }[]> {
  const granted = await authorize(fake)
  assert.equal(granted.kind, 'OK')
  if (granted.kind !== 'OK') return []
  const earlier = new Map<OperationId, unknown>()
  const done = []
  for (const operation of inProbeOrder(mercadoLivre)) {
    const input = operation.probe(earlier)
    if (input === null) continue
    const request = requestOf(operation, input, ACCOUNT)
    const answered = operation.answer(
      await answerOf(await fake.handle(toRequest(mercadoLivre, request, granted.accessToken))),
    )
    assert.equal(answered.kind, 'OK', operation.id)
    if (answered.kind !== 'OK') continue
    earlier.set(operation.id, answered.value)
    done.push({ operation, request, value: answered.value })
  }
  return done
}

/** A read of the double with a key. */
export async function getWith(
  fake: Fake,
  path: `/${string}`,
  key: string,
): Promise<ProviderAnswer> {
  const request = { method: 'GET', path, query: {}, body: undefined } as const
  return answerOf(await fake.handle(toRequest(mercadoLivre, request, key)))
}
