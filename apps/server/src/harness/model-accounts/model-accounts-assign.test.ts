import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  BRUNO,
  CARLA,
  call,
  codeOf,
  companyOn,
  id,
  memberOn,
  post,
} from '../../hub/identity/test-hub.ts'

const KEY = 'sk-assign-key-for-tests-0001'
const DAVI = { name: 'Davi Souza', email: 'davi@example.test' }

test('dar uma conta da empresa a pessoas a tira da fila geral e cada uma tem a sua ordem; só dono e administrador', async (t) => {
  const { hub, ana, companyId } = await companyOn(t)
  const bruno = await memberOn(hub, companyId, BRUNO, 'admin')
  const carla = await memberOn(hub, companyId, CARLA, 'member')
  const davi = await memberOn(hub, companyId, DAVI, 'member')
  const accounts = `/api/companies/${companyId}/model-accounts`
  async function link(label: string, owner = 'company', who = ana) {
    const answer = await post(hub, who, accounts, { owner, provider: 'anthropic', label, key: KEY })
    return String(Object(answer.json()).account.id)
  }
  const [a, b, c] = [await link('A'), await link('B'), await link('C')]
  const carlas = await link('Da Carla', 'me', carla)
  const given = await call(hub, bruno, 'PUT', `${accounts}/${c}/assignees`, {
    personIds: [carla.id, davi.id, carla.id],
  })
  assert.equal(given.statusCode, 200)
  assert.deepEqual(Object(given.json()).account.assignees, [carla.id, davi.id].sort())
  assert.equal(Object(given.json()).account.revision, 2)
  await call(hub, ana, 'PUT', `${accounts}/${a}/assignees`, { personIds: [davi.id] })
  async function orderOf(who: typeof ana) {
    const listed = Object((await call(hub, who, 'GET', accounts)).json())
    return listed.order.find(({ provider }: { provider: string }) => provider === 'anthropic')
      .accounts
  }
  assert.deepEqual(await orderOf(carla), [carlas, c, b])
  assert.deepEqual(await orderOf(davi), [a, c, b])
  assert.deepEqual(await orderOf(bruno), [b])
  for (const answer of [
    await call(hub, carla, 'PUT', `${accounts}/${b}/assignees`, { personIds: [carla.id] }),
    await call(hub, ana, 'PUT', `${accounts}/${b}/assignees`, { personIds: [id()] }),
    await call(hub, ana, 'PUT', `${accounts}/${carlas}/assignees`, { personIds: [] }),
  ])
    assert.equal(answer.statusCode, 404)
  const own = await link('Da Ana', 'me')
  const personal = await call(hub, ana, 'PUT', `${accounts}/${own}/assignees`, {
    personIds: [bruno.id],
  })
  assert.deepEqual([personal.statusCode, codeOf(personal)], [422, 'MODEL_ACCOUNT_PERSONAL'])
  // With no one left it is for everyone again (founder, C1).
  await hub.test.asOwner(`delete from auth.member where user_id = $1`, [davi.id])
  assert.deepEqual(await orderOf(bruno), [a, b])
  assert.equal(
    (await call(hub, ana, 'PUT', `${accounts}/${c}/assignees`, { personIds: [] })).statusCode,
    200,
  )
  assert.deepEqual(await orderOf(bruno), [a, b, c])
})
