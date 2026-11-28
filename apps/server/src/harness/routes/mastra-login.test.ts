import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MastraAuthBetterAuth } from '@mastra/auth-better-auth'
import { createIdentity } from '../../hub/identity/public.ts'
import type { Hub } from '../../hub/identity/test-hub.ts'
import { ANA_ACCOUNT, hubWithAna, signedIn, TEST_KIT } from '../../hub/identity/test-hub.ts'
import { ageTo } from '../../hub/identity/test-session-age.ts'
import { silent, unreachableDatabase } from '../../platform/test-database.ts'
import { testMail } from '../../platform/test-mail.ts'

type Auth = Hub['auth']

const SESSION_COOKIE_NAME = '__Host-conexus_session'

function mastraLogin(auth: Auth) {
  // @ts-expect-error: better-auth 1.7.28 types the provider's `auth` as the bare `Auth`, to which no configured instance is assignable, its `$context.adapter` being invariant there.
  return new MastraAuthBetterAuth({ auth })
}

function who(login: ReturnType<typeof mastraLogin>, cookie?: string) {
  const request = new Request('http://localhost/api/agents', {
    headers: cookie === undefined ? {} : { cookie },
  })
  return login.authenticateToken('', request)
}

test('login do Mastra: o cookie do Hub abre a pessoa e a sessão da linha do banco', async (t) => {
  const hub = await hubWithAna(t)
  const cookie = await signedIn(hub)
  const opened = await who(mastraLogin(hub.auth), cookie)
  const [row] = await hub.test.asOwner('select token from auth.session')
  assert.equal(opened?.user.id, ANA_ACCOUNT.id)
  assert.equal(opened?.session.token, row?.token)
})

test('login do Mastra: sem cookie, com o token cru da tabela, com assinatura forjada ou com a linha apagada, ninguém', async (t) => {
  const hub = await hubWithAna(t)
  const login = mastraLogin(hub.auth)
  const cookie = await signedIn(hub)
  const [row] = await hub.test.asOwner('select token from auth.session')
  const forged = `${cookie.split('.')[0]}.${'A'.repeat(43)}%3D`
  for (const attempt of [undefined, `${SESSION_COOKIE_NAME}=${String(row?.token)}`, forged]) {
    assert.equal(await who(login, attempt), null, String(attempt))
  }
  await hub.test.asOwner('delete from auth.session')
  assert.equal(await who(login, cookie), null, 'linha apagada')
})

test('login do Mastra: sem uso há mais de 1800 s, ninguém', async (t) => {
  const hub = await hubWithAna(t)
  const cookie = await signedIn(hub)
  await hub.test.asOwner(`update auth.session set expires_at = now() - interval '1 second'`)
  assert.equal(await who(mastraLogin(hub.auth), cookie), null)
})

test('login do Mastra: prazo total, usada a cada 25 min abre até 8 h menos 1 s; depois ninguém e a linha some', async (t) => {
  const hub = await hubWithAna(t)
  const login = mastraLogin(hub.auth)
  const cookie = await signedIn(hub)
  for (let minutes = 25; minutes <= 475; minutes += 25) {
    await ageTo(hub, minutes * 60)
    assert.equal((await who(login, cookie))?.user.id, ANA_ACCOUNT.id, `${minutes} min`)
  }
  await ageTo(hub, 8 * 60 * 60 - 1)
  assert.equal((await who(login, cookie))?.user.id, ANA_ACCOUNT.id, '8 h menos 1 s')
  await ageTo(hub, 8 * 60 * 60 + 1)
  assert.equal(await who(login, cookie), null)
  assert.deepEqual(await hub.test.asOwner('select count(*)::int as rows from auth.session'), [
    { rows: 0 },
  ])
})

test('login do Mastra: banco fora, ninguém e sem lançar', async (t) => {
  const hub = await hubWithAna(t)
  const cookie = await signedIn(hub)
  function identityOn(database: Parameters<typeof createIdentity>[0]['database']) {
    return createIdentity({
      kit: TEST_KIT,
      database,
      config: hub.config,
      log: silent,
      sendMail: testMail(hub.config),
    })
  }
  const live = identityOn(hub.test.database)
  assert.equal((await who(mastraLogin(live.auth), cookie))?.user.id, ANA_ACCOUNT.id)
  const down = identityOn(await unreachableDatabase(t))
  assert.equal(await who(mastraLogin(down.auth), cookie), null)
})
