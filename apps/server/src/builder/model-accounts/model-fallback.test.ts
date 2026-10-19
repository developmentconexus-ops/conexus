import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BRUNO, CARLA, call, codeOf, companyOn, memberOn } from '../../hub/identity/test-hub.ts'

const FIRST = 'anthropic/claude-sonnet-4-5'
const SECOND = 'google/gemini-2.5-flash'

/** Ana owns the company, Bruno administers it, Carla is a member. */
async function company(t: Parameters<typeof companyOn>[0]) {
  const { hub, ana, companyId } = await companyOn(t)
  const bruno = await memberOn(hub, companyId, BRUNO, 'admin')
  const carla = await memberOn(hub, companyId, CARLA, 'member')
  const base = `/api/companies/${companyId}`
  async function read(who = ana) {
    return Object(Object((await call(hub, who, 'GET', `${base}/model-accounts`)).json()).fallback)
  }
  return { hub, ana, bruno, carla, read, url: `${base}/model-fallback` }
}

test('troca automática: começa desligada; dono e administrador gravam na revisão lida; membro 404', async (t) => {
  const { hub, ana, bruno, carla, read, url } = await company(t)
  assert.deepEqual(await read(carla), { enabled: false, chain: [], revision: 0 })
  const first = await call(hub, ana, 'PUT', url, {
    enabled: true,
    chain: [FIRST, SECOND],
    revision: 0,
  })
  assert.deepEqual(
    [first.statusCode, first.json()],
    [200, { enabled: true, chain: [FIRST, SECOND], revision: 1 }],
  )
  const second = await call(hub, bruno, 'PUT', url, {
    enabled: false,
    chain: [SECOND],
    revision: 1,
  })
  assert.deepEqual(
    [second.statusCode, second.json()],
    [200, { enabled: false, chain: [SECOND], revision: 2 }],
  )
  assert.deepEqual(await read(carla), { enabled: false, chain: [SECOND], revision: 2 })
  const denied = await call(hub, carla, 'PUT', url, { enabled: true, chain: [], revision: 2 })
  assert.deepEqual([denied.statusCode, codeOf(denied)], [404, 'NOT_FOUND'])
  // The admission comes before the models' check: a member learns nothing from a wrong model.
  const hidden = await call(hub, carla, 'PUT', url, {
    enabled: true,
    chain: ['nenhum/x'],
    revision: 2,
  })
  assert.equal(hidden.statusCode, 404)
  assert.deepEqual(await read(), { enabled: false, chain: [SECOND], revision: 2 })
})

test('troca automática: modelo fora do registro dá 422 MODEL_UNKNOWN e nada muda', async (t) => {
  const { hub, ana, read, url } = await company(t)
  for (const chain of [['nenhum/x'], [FIRST, 'anthropic/claude-nenhum'], ['claude-sonnet-4-5']]) {
    const refused = await call(hub, ana, 'PUT', url, { enabled: true, chain, revision: 0 })
    assert.deepEqual([refused.statusCode, codeOf(refused)], [422, 'MODEL_UNKNOWN'], `${chain}`)
  }
  assert.deepEqual(await read(), { enabled: false, chain: [], revision: 0 })
})

test('troca automática: revisão velha dá 412; duas gravações juntas, uma vence', async (t) => {
  const { hub, ana, bruno, read, url } = await company(t)
  const body = { enabled: true, chain: [FIRST], revision: 0 }
  const [one, two] = await Promise.all([
    call(hub, ana, 'PUT', url, body),
    call(hub, bruno, 'PUT', url, body),
  ])
  assert.deepEqual([one.statusCode, two.statusCode].sort(), [200, 412])
  const lost = one.statusCode === 412 ? one : two
  assert.equal(codeOf(lost), 'MODEL_FALLBACK_STALE')
  const stale = await call(hub, ana, 'PUT', url, { enabled: false, chain: [], revision: 0 })
  assert.deepEqual([stale.statusCode, codeOf(stale)], [412, 'MODEL_FALLBACK_STALE'])
  const missed = await call(hub, ana, 'PUT', url, { enabled: false, chain: [], revision: 5 })
  assert.equal(missed.statusCode, 412)
  assert.deepEqual(await read(), { enabled: true, chain: [FIRST], revision: 1 })
})
