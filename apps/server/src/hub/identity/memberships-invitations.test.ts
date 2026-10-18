import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { serveEnvironment, TEST_ORIGIN } from '../../platform/test-database.ts'
import { spawnHub } from '../../platform/test-hub-process.ts'
import {
  ANA_OWNER,
  BRUNO,
  CARLA,
  codeOf,
  hubWithMail,
  id,
  PASSWORD,
  personOn,
  plantCompany,
  post,
} from './test-hub.ts'

const DAVI = { name: 'Davi Costa', email: 'davi@example.test' }

/** Ana owns the company; Bruno and Carla are its administrators and Davi a member. */
async function company(t: TestContext) {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA_OWNER)
  const bruno = await personOn(hub, BRUNO)
  const carla = await personOn(hub, CARLA)
  const davi = await personOn(hub, DAVI)
  const companyId = await plantCompany(hub.test, ana.id)
  for (const [person, role] of [
    [bruno, 'admin'],
    [carla, 'admin'],
    [davi, 'member'],
  ] as const) {
    await hub.test.asOwner(
      `insert into auth.member (id, company_id, user_id, role, created_at)
        values ($1, $2, $3, $4, now())`,
      [id(), companyId, person.id, role],
    )
  }
  const members = `/api/companies/${companyId}/members`
  async function invite(sender: typeof bruno, emails: string[]) {
    for (const email of emails) {
      const body = { email, role: 'member' }
      const response = await post(hub, sender, `/api/companies/${companyId}/invitations`, body)
      assert.equal(response.statusCode, 201)
    }
  }
  async function pending() {
    return await hub.test.asOwner(
      `select email, status, revision from auth.invitation order by created_at`,
    )
  }
  function withHeaders(person: { cookie: string }) {
    return { origin: TEST_ORIGIN, cookie: person.cookie }
  }
  return { hub, ana, bruno, carla, davi, companyId, members, invite, pending, withHeaders }
}

test('convites do tirado: quem é tirado cancela o que enviou, a revisão avança e listMembers os conta; uma recusa entre apagar e cancelar não deixa nada', async (t) => {
  const c = await company(t)
  await c.invite(c.bruno, ['erin@example.test', 'fred@example.test'])
  await c.hub.test.asOwner(
    `insert into auth.invitation (id, company_id, email, role, status, expires_at, created_at,
      inviter_id, attempt_key) values ($1, $2, 'velha@example.test', 'member', 'pending',
      now() - interval '1 hour', now() - interval '1 day', $3, $4)`,
    [id(), c.companyId, c.bruno.id, randomUUID()],
  )
  const listed = await c.hub.app.inject({
    method: 'GET',
    url: c.members,
    headers: c.withHeaders(c.ana),
  })
  const sent = Object(listed.json()).members.map(
    (one: { email: string; invitationsSent: number }) => [one.email, one.invitationsSent],
  )
  assert.deepEqual(
    sent.filter(([email]: string[]) => email === BRUNO.email),
    [[BRUNO.email, 2]],
  )

  // A refusal between the delete and the cancel rolls the delete back too.
  await c.hub.test.asOwner(`create function refuse() returns trigger language plpgsql as
    $$ begin raise exception 'planted'; end $$`)
  await c.hub.test.asOwner(`create trigger refuse before update on auth.invitation
    for each row execute function refuse()`)
  const url = `${c.members}/${c.bruno.id}`
  const refused = await c.hub.app.inject({ method: 'DELETE', url, headers: c.withHeaders(c.ana) })
  assert.ok(refused.statusCode >= 500, String(refused.statusCode))
  const still = await c.hub.test.asOwner(
    `select 1 from auth.member where user_id = $1 and company_id = $2`,
    [c.bruno.id, c.companyId],
  )
  assert.equal(still.length, 1)
  assert.deepEqual(
    (await c.pending()).map((row) => [row.status, row.revision]),
    [
      ['pending', 0],
      ['pending', 0],
      ['pending', 0],
    ],
  )

  await c.hub.test.asOwner('drop trigger refuse on auth.invitation')
  const removed = await c.hub.app.inject({ method: 'DELETE', url, headers: c.withHeaders(c.ana) })
  assert.equal(removed.statusCode, 204)
  assert.deepEqual(
    (await c.pending()).map((row) => [row.status, row.revision]),
    [
      ['canceled', 1],
      ['canceled', 1],
      ['canceled', 1],
    ],
  )
  const open = await c.hub.app.inject({
    method: 'GET',
    url: `/api/companies/${c.companyId}/invitations`,
    headers: c.withHeaders(c.ana),
  })
  assert.deepEqual(open.json(), { invitations: [], next: { kind: 'END' } })
})

test('sair: quem sai cancela o que enviou, mesmo com a sessão apontando a empresa; o campo fica; o único dono não sai', async (t) => {
  const c = await company(t)
  await c.invite(c.carla, ['erin@example.test'])
  await c.hub.test.asOwner(
    `update auth.session set active_organization_id = $1 where user_id = ANY($2)`,
    [c.companyId, [c.carla.id, c.davi.id]],
  )
  function leave(person: typeof c.carla) {
    const headers = c.withHeaders(person)
    return c.hub.app.inject({ method: 'DELETE', url: `${c.members}/${person.id}`, headers })
  }
  assert.equal((await leave(c.carla)).statusCode, 204)
  assert.equal((await leave(c.davi)).statusCode, 204)
  assert.deepEqual(
    (await c.pending()).map((row) => [row.status, row.revision]),
    [['canceled', 1]],
  )
  const kept = await c.hub.test.asOwner(
    `select active_organization_id as active from auth.session where user_id = ANY($1)`,
    [[c.carla.id, c.davi.id]],
  )
  assert.deepEqual(kept, [{ active: c.companyId }, { active: c.companyId }])
  const mine = await c.hub.app.inject({
    method: 'GET',
    url: '/api/companies',
    headers: { cookie: c.davi.cookie },
  })
  assert.deepEqual(Object(mine.json()).companies, [])
  const sole = await leave(c.ana)
  assert.deepEqual([sole.statusCode, codeOf(sole)], [409, 'LAST_OWNER'])
})

test('log: tirar e mudar papel deixam MEMBER_REMOVED e MEMBER_ROLE_CHANGED com ids e papel, nunca nome ou e-mail', async (t) => {
  const c = await company(t)
  const environment = { ...serveEnvironment(t, c.hub.test.runtimeUrl) }
  const { port, lines, stop } = await spawnHub(t, environment)
  async function send(method: string, path: string, cookie: string | undefined, body?: unknown) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: {
        origin: TEST_ORIGIN,
        'cf-connecting-ip': '198.51.100.20',
        ...(cookie === undefined ? {} : { cookie }),
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(10_000),
    })
    const entered = String(response.headers.get('set-cookie')).split(';')[0] ?? ''
    return { status: response.status, cookie: entered }
  }
  // The spawned Hub signs its own cookies, so Ana enters through it.
  const ana = await send('PUT', '/api/sessions/current', undefined, {
    email: ANA_OWNER.email,
    password: PASSWORD,
  })
  const changed = await send('PUT', `${c.members}/${c.davi.id}`, ana.cookie, {
    role: 'admin',
    from: 'member',
  })
  const removed = await send('DELETE', `${c.members}/${c.bruno.id}`, ana.cookie)
  await stop()
  assert.deepEqual([changed.status, removed.status], [200, 204])
  const events = lines.filter((line) => String(line.msg).startsWith('MEMBER_'))
  assert.deepEqual(
    events.map((line) => [line.msg, line.companyId, line.personId, line.by, line.role]),
    [
      ['MEMBER_ROLE_CHANGED', c.companyId, c.davi.id, c.ana.id, 'admin'],
      ['MEMBER_REMOVED', c.companyId, c.bruno.id, c.ana.id, 'admin'],
    ],
  )
  const output = JSON.stringify(lines)
  for (const kept of [BRUNO.email, DAVI.email, DAVI.name, BRUNO.name]) {
    assert.doesNotMatch(output, new RegExp(kept))
  }
})
