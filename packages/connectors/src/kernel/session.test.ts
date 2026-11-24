import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sankhya } from '../sankhya/definition.ts'
import type { SankhyaFake } from '../sankhya/fake.ts'
import { sankhyaFake } from '../sankhya/fake.ts'
import { empresas } from '../sankhya/operations/cadastros.ts'
import { answerOf } from './conformance-session.ts'
import type { ProviderRequest } from './operation.ts'
import { requestOf } from './operation.ts'
import { toRequest } from './request.ts'
import { openSession, RENEW_BEFORE_MS } from './session.ts'

type Unsent = Readonly<{ kind: 'UNREACHABLE' }>

/** A session on the double, read by a clock the test moves. */
function sessionOn(fake: SankhyaFake) {
  const clock = { at: Date.parse('2026-11-23T12:00:00Z') }
  const sent: string[] = []
  const session = openSession<Unsent>({
    auth: sankhya.auth,
    credential: fake.credential,
    now: () => clock.at,
    async send(request: ProviderRequest, a) {
      sent.push(
        request.path === '/authenticate' ? 'login' : (request.query.serviceName ?? request.path),
      )
      return answerOf(await fake.handle(toRequest(sankhya, request, a.token)), sankhya.numbers)
    },
  })
  return { session, clock, sent, fake }
}

function read(on: ReturnType<typeof sessionOn>, signal: AbortSignal) {
  const input = { page: 0 }
  return on.session.call(async (token) => {
    const request = requestOf(empresas, input, { ref: null }, new Date(on.clock.at))
    const answer = await answerOf(
      await on.fake.handle(toRequest(sankhya, request, token)),
      sankhya.numbers,
    )
    return empresas.answer(answer)
  }, signal)
}

test('a leitura mais longa que o token: renova antes do fim, desloga a velha primeiro, e no fim nada fica aberto', async () => {
  const fake = sankhyaFake()
  const on = sessionOn(fake)
  const signal = AbortSignal.timeout(5_000)
  const lifeMs = fake.switches.expiresInSeconds * 1000
  for (let page = 0; page < 4; page += 1) {
    const answered = await read(on, signal)
    assert.equal(typeof answered === 'object' && answered.kind, 'OK', `page ${page}`)
    on.clock.at += lifeMs - RENEW_BEFORE_MS
  }
  assert.equal(fake.logins(), 4, 'one token per stretch of the read')
  assert.equal(fake.open(), 1, 'each old token logged out before the next login')
  const renewal = ['MobileLoginSP.logout', 'login']
  assert.deepEqual(on.sent, ['login', ...renewal, ...renewal, ...renewal])
  await on.session.close(signal)
  assert.equal(fake.open(), 0)
  assert.equal(fake.logouts(), 4)
  await assert.rejects(on.session.token(signal), /closed session/)
})

test('o token vencido no meio: renova sem deslogar e repete uma vez; a segunda recusa é NEEDS_REAUTH', async () => {
  const fake = sankhyaFake()
  const on = sessionOn(fake)
  const signal = AbortSignal.timeout(5_000)
  assert.equal(typeof (await read(on, signal)) === 'object', true)
  fake.expireTokens()
  const renewed = await read(on, signal)
  assert.deepEqual(typeof renewed === 'object' && renewed.kind, 'OK', 'repeated on a new token')
  assert.equal(fake.logins(), 2)
  assert.equal(fake.logouts(), 0, 'an expired token is not logged out: its logout is refused')

  fake.switches.expireToken = true
  const refused = await read(on, signal)
  assert.partialDeepStrictEqual(refused, {
    kind: 'NEEDS_REAUTH',
    native: { status: 403, code: 'GTW3403' },
  })
  assert.equal(fake.logins(), 3, 'one new token, one repeat, never more')
})

test('a chave recusada no login volta como o login a leu, e nenhuma leitura sai', async () => {
  const fake = sankhyaFake()
  const sent: string[] = []
  const session = openSession<Unsent>({
    auth: sankhya.auth,
    credential: { ...fake.credential, clientSecret: 'outra' },
    now: () => 0,
    async send(request, a) {
      sent.push(request.path)
      return answerOf(await fake.handle(toRequest(sankhya, request, a.token)), sankhya.numbers)
    },
  })
  const answered = await session.call(
    async () => assert.fail('no read'),
    AbortSignal.timeout(5_000),
  )
  assert.partialDeepStrictEqual(answered, { kind: 'AUTH_REFUSED', native: { status: 401 } })
  assert.deepEqual(sent, ['/authenticate'])
})

test('a sessão fechada no meio de uma leitura não abre outro token: a resposta do token encerrado volta', async () => {
  const fake = sankhyaFake()
  const on = sessionOn(fake)
  const signal = AbortSignal.timeout(5_000)
  const answered = await on.session.call(async () => {
    await on.session.close(signal)
    return {
      kind: 'TOKEN_EXPIRED' as const,
      native: { status: 403, code: null, message: null, body: null },
    }
  }, signal)
  assert.equal(typeof answered === 'object' && answered.kind, 'TOKEN_EXPIRED')
  assert.equal(fake.logins(), 1)
  assert.equal(fake.open(), 0)
})

test('a margem: o token serve até faltarem 60 s para o fim, e aos 60 s renova', async () => {
  const fake = sankhyaFake()
  const on = sessionOn(fake)
  const signal = AbortSignal.timeout(5_000)
  const end = on.clock.at + fake.switches.expiresInSeconds * 1000
  const first = await on.session.token(signal)
  on.clock.at = end - 60_001
  assert.equal(await on.session.token(signal), first)
  assert.equal(fake.logins(), 1)
  on.clock.at = end - 60_000
  assert.notEqual(await on.session.token(signal), first)
  assert.equal(fake.logins(), 2)
})

test('a escrita vai uma vez: o token que o fornecedor encerrou não é repetido, e a chamada seguinte abre outro sem logout', async () => {
  const fake = sankhyaFake()
  const on = sessionOn(fake)
  const signal = AbortSignal.timeout(5_000)
  const sent: string[] = []
  const expired = {
    kind: 'TOKEN_EXPIRED' as const,
    native: { status: 403, code: null, message: null, body: null },
  }
  const answered = await on.session.once(async (token) => {
    sent.push(token)
    return expired
  }, signal)
  assert.deepEqual(answered, expired)
  assert.equal(sent.length, 1, 'never repeated')
  const next = await on.session.token(signal)
  assert.notEqual(next, sent[0])
  assert.deepEqual([fake.logins(), fake.logouts()], [2, 0])
})
