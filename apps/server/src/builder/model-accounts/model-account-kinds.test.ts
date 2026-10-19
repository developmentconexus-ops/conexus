import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import {
  ANA,
  BRUNO,
  call,
  hubWithMail,
  personOn,
  plantCompany,
} from '../../hub/identity/test-hub.ts'

test('só o operador muda os tipos; o dono dá 404; a chave sempre ligada; desligado mostra a conta e religar a devolve', async (t) => {
  const hub = await hubWithMail(t)
  const operator = await personOn(hub, ANA)
  const bruno = await personOn(hub, BRUNO)
  const companyId = await plantCompany(hub.test, bruno.id)
  const kinds = `/api/clients/${companyId}/account-kinds`
  const accounts = `/api/companies/${companyId}/model-accounts`
  assert.deepEqual((await call(hub, operator, 'GET', kinds)).json(), { kinds: [] })
  const accountId = randomUUID()
  await hub.test.asOwner(
    `insert into builder.model_account (id, company_id, person_id, kind, provider, label, position,
      state, sealed, key_id, hint, linked_by, linked_at, revision, attempt_key)
      values ($1, $2, null, 'claude_subscription', 'anthropic', 'Assinatura', 0, 'ready', '\\x00',
      'k1', null, $3, now(), 1, $4)`,
    [accountId, companyId, bruno.id, accountId],
  )
  async function kindOff() {
    const listed = Object((await call(hub, bruno, 'GET', accounts)).json())
    return listed.company.map(({ kindOff }: { kindOff: boolean }) => kindOff)
  }
  assert.deepEqual(await kindOff(), [true])
  const set = await call(hub, operator, 'PUT', kinds, {
    kinds: ['google_cliproxy', 'claude_subscription'],
  })
  assert.deepEqual(
    [set.statusCode, set.json()],
    [200, { kinds: ['claude_subscription', 'google_cliproxy'] }],
  )
  assert.deepEqual(Object((await call(hub, bruno, 'GET', accounts)).json()).kinds, [
    'claude_subscription',
    'google_cliproxy',
  ])
  assert.deepEqual(await kindOff(), [false])
  for (const answer of [
    await call(hub, bruno, 'PUT', kinds, { kinds: [] }),
    await call(hub, bruno, 'GET', kinds),
    await call(hub, operator, 'PUT', `/api/clients/${'0'.repeat(32)}/account-kinds`, { kinds: [] }),
  ])
    assert.equal(answer.statusCode, 404)
  assert.equal((await call(hub, operator, 'PUT', kinds, { kinds: ['api_key'] })).statusCode, 400)
  assert.deepEqual(
    (await call(hub, operator, 'PUT', kinds, { kinds: ['google_cliproxy'] })).json(),
    { kinds: ['google_cliproxy'] },
  )
  assert.deepEqual(await kindOff(), [true])
  assert.equal((await hub.test.asOwner(`select id from builder.model_account`)).length, 1)
  const key = await call(hub, bruno, 'GET', accounts)
  assert.equal(key.statusCode, 200)
  await call(hub, operator, 'PUT', kinds, { kinds: ['claude_subscription', 'google_cliproxy'] })
  assert.deepEqual(await kindOff(), [false])
})
