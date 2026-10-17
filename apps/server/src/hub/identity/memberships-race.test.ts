import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import type { Person } from './test-hub.ts'
import { ANA_OWNER, hubOn, id, personOn, plantCompany } from './test-hub.ts'

const ROUNDS = 20
const GIL = { name: 'Gil Matos', email: 'gil@example.test' }
const CENTRAL = { name: 'Central Conexus', email: 'central@example.test', role: 'admin' }

/**
 * A client of two owners, Ana and Gil, with every write to a member held for a tenth of a second,
 * so two commands that do not wait for each other both read two owners before either writes.
 */
async function twoOwners(t: TestContext) {
  const hub = await hubOn(t)
  const ana = await personOn(hub, ANA_OWNER)
  const gil = await personOn(hub, GIL)
  const central = await personOn(hub, CENTRAL)
  const companyId = await plantCompany(hub.test, ana.id)
  await hub.test.asOwner(
    `insert into operations.client (company_id, cnpj, legal_name, attempt_key, registered_at)
      values ($1, '11222333000181', 'Empresa Teste Ltda', $1, now())`,
    [companyId],
  )
  await hub.test.asOwner(`create function hold() returns trigger language plpgsql as
    $$ begin perform pg_sleep(0.1); return coalesce(new, old); end $$`)
  await hub.test.asOwner(`create trigger hold before update or delete on auth.member
    for each row execute function hold()`)
  function request(actor: Person, method: 'PUT' | 'DELETE', target: Person, body?: unknown) {
    return hub.app.inject({
      method,
      url: `/api/companies/${companyId}/members/${target.id}`,
      headers: {
        origin: TEST_ORIGIN,
        cookie: actor.cookie,
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      ...(body === undefined ? {} : { payload: JSON.stringify(body) }),
    })
  }
  async function seat() {
    await hub.test.asOwner('delete from auth.member where company_id = $1', [companyId])
    for (const person of [ana, gil]) {
      await hub.test.asOwner(
        `insert into auth.member (id, company_id, user_id, role, created_at)
          values ($1, $2, $3, 'owner', now())`,
        [id(), companyId, person.id],
      )
    }
  }
  return { hub, ana, gil, central, companyId, request, seat }
}
type Race = Awaited<ReturnType<typeof twoOwners>>

/**
 * Runs the pair `ROUNDS` times: one of the two succeeds and the other is refused, with the 404 of a
 * caller the first made a member or with the 409 of the last owner, and the company keeps one owner.
 */
async function holdsAnOwner(
  r: Race,
  loser: 404 | 409,
  pair: () => Promise<{ statusCode: number }>[],
) {
  for (let round = 0; round < ROUNDS; round++) {
    await r.seat()
    const statuses = (await Promise.all(pair())).map((response) => response.statusCode)
    const won = statuses.filter((status) => status < 300).length
    assert.deepEqual(
      [won, statuses.filter((status) => status === loser).length],
      [1, 1],
      String(statuses),
    )
    const owners = await r.hub.test.asOwner(
      `select count(*)::int as owners from auth.member where company_id = $1 and role = 'owner'`,
      [r.companyId],
    )
    assert.deepEqual(owners, [{ owners: 1 }], `round ${round}`)
  }
  const read = await r.hub.app.inject({
    method: 'GET',
    url: `/api/clients/${r.companyId}`,
    headers: { cookie: r.central.cookie },
  })
  const { client } = Object(read.json())
  assert.deepEqual(
    [read.statusCode, client.state.kind, client.state.owners.length],
    [200, 'ACTIVE', 1],
  )
}

test('último dono sob corrida: dois rebaixamentos', async (t) => {
  const r = await twoOwners(t)
  const down = { role: 'member', from: 'owner' }
  await holdsAnOwner(r, 404, () => [
    r.request(r.ana, 'PUT', r.gil, down),
    r.request(r.gil, 'PUT', r.ana, down),
  ])
})

test('último dono sob corrida: duas remoções', async (t) => {
  const r = await twoOwners(t)
  await holdsAnOwner(r, 404, () => [
    r.request(r.ana, 'DELETE', r.gil),
    r.request(r.gil, 'DELETE', r.ana),
  ])
})

test('último dono sob corrida: sair contra rebaixar', async (t) => {
  const r = await twoOwners(t)
  const down = { role: 'member', from: 'owner' }
  await holdsAnOwner(r, 409, () => [
    r.request(r.ana, 'DELETE', r.ana),
    r.request(r.gil, 'PUT', r.gil, down),
  ])
})

test('último dono sob corrida: a Central contra um dono', async (t) => {
  const r = await twoOwners(t)
  await holdsAnOwner(r, 409, () => [
    r.request(r.central, 'DELETE', r.ana),
    r.request(r.gil, 'DELETE', r.gil),
  ])
})
