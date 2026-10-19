import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { BRUNO, call, codeOf, companyOn, memberOn, post } from '../../hub/identity/test-hub.ts'

const KEY = 'sk-order-key-for-tests-0001'

/** Ana owns the company and Bruno administers it; its Anthropic queue holds A, B and C. */
async function queue(t: TestContext) {
  const { hub, ana, companyId } = await companyOn(t)
  const bruno = await memberOn(hub, companyId, BRUNO, 'admin')
  const accounts = `/api/companies/${companyId}/model-accounts`
  async function link(label: string, provider = 'anthropic', owner = 'company') {
    const answer = await post(hub, ana, accounts, { owner, provider, label, key: KEY })
    assert.equal(answer.statusCode, 201)
    return String(Object(answer.json()).account.id)
  }
  async function orderOf() {
    const listed = Object((await call(hub, ana, 'GET', accounts)).json())
    return listed.order.find(({ provider }: { provider: string }) => provider === 'anthropic')
      .accounts
  }
  const ids = [await link('A'), await link('B'), await link('C')]
  function url(owner: string) {
    return `/api/companies/${companyId}/model-account-orders/${owner}/anthropic`
  }
  return { hub, ana, bruno, link, orderOf, ids, url }
}

test('ordenar uma fila com todos os seus ids grava; velha, incompleta ou de outro fornecedor dá 409', async (t) => {
  const { hub, ana, bruno, link, ids, url } = await queue(t)
  const [a, b, c] = ids
  const openai = await link('O', 'openai')
  const ordered = await call(hub, bruno, 'PUT', url('company'), { ids: [c, a, b] })
  assert.equal(ordered.statusCode, 200)
  assert.deepEqual(
    Object(ordered.json()).accounts.map(({ id, position }: { id: string; position: number }) => [
      id,
      position,
    ]),
    [
      [c, 0],
      [a, 1],
      [b, 2],
    ],
  )
  for (const sent of [[c, a], [c, a, b, b], [c, a, b, openai], [c, a, randomUUID()], []]) {
    const stale = await call(hub, ana, 'PUT', url('company'), { ids: sent })
    assert.deepEqual(
      [stale.statusCode, codeOf(stale)],
      [409, 'MODEL_ACCOUNT_ORDER_STALE'],
      JSON.stringify(sent),
    )
  }
})

test('duas ordens juntas: uma vence inteira; a conta nova vai depois dela; cada um ordena só a sua fila', async (t) => {
  const { hub, ana, bruno, link, orderOf, ids, url } = await queue(t)
  const [a, b, c] = ids
  const [one, two] = await Promise.all([
    call(hub, ana, 'PUT', url('company'), { ids: [a, b, c] }),
    call(hub, bruno, 'PUT', url('company'), { ids: [b, c, a] }),
  ])
  assert.deepEqual([one.statusCode, two.statusCode], [200, 200])
  const won = await orderOf()
  assert.ok(
    [
      [a, b, c],
      [b, c, a],
    ].some((order) => JSON.stringify(order) === JSON.stringify(won)),
  )
  const d = await link('D')
  const mine = await link('Minha', 'anthropic', 'me')
  assert.equal((await call(hub, ana, 'PUT', url('me'), { ids: [mine] })).statusCode, 200)
  assert.equal(
    codeOf(await call(hub, bruno, 'PUT', url('me'), { ids: [mine] })),
    'MODEL_ACCOUNT_ORDER_STALE',
  )
  assert.deepEqual(await orderOf(), [mine, ...won, d])
})
