import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setTimeout } from 'node:timers/promises'
import { TEST_ORIGIN, withOwnerLock } from '../../platform/test-database.ts'
import type { MailHub, Person } from './test-hub.ts'
import { codeOf, companyOn, INVITEE, PASSWORD, personOn, post, signIn } from './test-hub.ts'

const DAVI = { name: 'Davi Costa', email: INVITEE }

function put(hub: MailHub, person: Person | undefined, url: string) {
  return hub.app.inject({
    method: 'PUT',
    url,
    headers: {
      origin: TEST_ORIGIN,
      'content-type': 'application/json',
      ...(person ? { cookie: person.cookie } : {}),
    },
    payload: { revision: 0 },
  })
}

function read(hub: MailHub, person: Person | undefined, invitationId: string) {
  return hub.app.inject({
    method: 'GET',
    url: `/api/invitations/${invitationId}`,
    headers: person ? { cookie: person.cookie } : {},
  })
}

function accept(hub: MailHub, person: Person, invitationId: string) {
  return put(hub, person, `/api/invitations/${invitationId}/acceptance`)
}

async function members(hub: MailHub, personId: string) {
  return hub.test.asOwner('select role from auth.member where user_id = $1', [personId])
}

async function statusOf(hub: MailHub, invitationId: string) {
  return hub.test.asOwner('select status from auth.invitation where id = $1', [invitationId])
}

test('read: the invitee sees the pending details; another session sees only itself; anonymous sees the password entry', async (t) => {
  const { hub, companyId, invite } = await companyOn(t)
  const davi = await personOn(hub, DAVI)
  const outsider = await personOn(hub, { name: 'Edu Melo', email: 'edu@example.test' })
  const invitationId = await invite()
  const received = await read(hub, davi, invitationId)
  assert.equal(received.statusCode, 200)
  const { expiresAt, ...view } = Object(received.json()).invitation
  assert.match(expiresAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  assert.deepEqual(view, {
    kind: 'INVITED',
    revision: 0,
    company: { id: companyId, name: 'Empresa Teste' },
    role: 'admin',
    inviterName: 'Ana Lima',
    firstOwner: false,
  })
  const refused = await read(hub, outsider, invitationId)
  assert.deepEqual(refused.json(), {
    invitation: { kind: 'OTHER', signedInAs: 'edu@example.test' },
  })
  const anonymous = await read(hub, undefined, invitationId)
  assert.equal(Object(anonymous.json()).invitation.kind, 'HAS_PASSWORD')
  const states: [string, string][] = [
    [`expires_at = now() - interval '1 second'`, 'EXPIRED'],
    [`status = 'canceled'`, 'CANCELED'],
    [`status = 'accepted'`, 'ACCEPTED'],
  ]
  for (const [change, state] of states) {
    await hub.test.asOwner(`update auth.invitation set ${change} where id = $1`, [invitationId])
    assert.equal(Object((await read(hub, davi, invitationId)).json()).invitation.state, state)
  }
})

test('aceitar: 200 e um membro; de novo, a mesma resposta; outra pessoa, 404 sem escrita', async (t) => {
  const { hub, companyId, invite } = await companyOn(t)
  const davi = await personOn(hub, DAVI)
  const outsider = await personOn(hub, { name: 'Edu Melo', email: 'edu@example.test' })
  const invitationId = await invite()
  const refused = await accept(hub, outsider, invitationId)
  assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'NOT_FOUND'])
  assert.deepEqual(await statusOf(hub, invitationId), [{ status: 'pending' }])
  const accepted = await accept(hub, davi, invitationId)
  assert.equal(accepted.statusCode, 200)
  assert.deepEqual(accepted.json(), { company: { id: companyId, name: 'Empresa Teste' } })
  const again = await accept(hub, davi, invitationId)
  assert.deepEqual([again.statusCode, again.body], [200, accepted.body])
  assert.deepEqual(await members(hub, davi.id), [{ role: 'admin' }])
  assert.deepEqual(await statusOf(hub, invitationId), [{ status: 'accepted' }])
})

test('aceitar: vencido ou cancelado, 422 INVITATION_CLOSED', async (t) => {
  const { hub, invite } = await companyOn(t)
  const davi = await personOn(hub, DAVI)
  for (const change of [`expires_at = now() - interval '1 second'`, `status = 'canceled'`]) {
    const invitationId = await invite()
    await hub.test.asOwner(`update auth.invitation set ${change} where id = $1`, [invitationId])
    const closed = await accept(hub, davi, invitationId)
    assert.deepEqual([closed.statusCode, codeOf(closed)], [422, 'INVITATION_CLOSED'])
  }
  assert.deepEqual(await members(hub, davi.id), [])
})

test('aceitar: a empresa com 100 pessoas, 409 COMPANY_FULL, e o convite segue pending', async (t) => {
  const { hub, ana, companyId, invite } = await companyOn(t)
  const davi = await personOn(hub, DAVI)
  const invitationId = await invite()
  await hub.test.asOwner(
    `with people as (
      insert into auth.user (id, name, email)
        select md5('p' || n), 'Pessoa ' || n, 'p' || n || '@example.test'
        from generate_series(1, 99) as n returning id)
    insert into auth.member (id, company_id, user_id, role, created_at)
      select md5('m' || id), $1, id, 'member', now() from people`,
    [companyId],
  )
  assert.equal(ana.id.length, 32)
  const full = await accept(hub, davi, invitationId)
  assert.deepEqual([full.statusCode, codeOf(full)], [409, 'COMPANY_FULL'])
  assert.deepEqual(await statusOf(hub, invitationId), [{ status: 'pending' }])
  assert.deepEqual(await members(hub, davi.id), [])
})

test('aceitar: dois juntos, um só membro e dois 200', async (t) => {
  const { hub, invite } = await companyOn(t)
  const davi = await personOn(hub, DAVI)
  const invitationId = await invite()
  const both = await Promise.all([accept(hub, davi, invitationId), accept(hub, davi, invitationId)])
  assert.deepEqual(
    both.map((response) => response.statusCode),
    [200, 200],
  )
  assert.deepEqual(await members(hub, davi.id), [{ role: 'admin' }])
})

test('acceptance replay requires the current membership and a session still live after waiting for the company', async (t) => {
  const { hub, companyId, invite } = await companyOn(t)
  const davi = await personOn(hub, DAVI)
  const id = await invite()
  assert.equal((await accept(hub, davi, id)).statusCode, 200)
  const queuedReplay = await withOwnerLock(
    hub.test,
    'select id from auth.company where id = $1 for update',
    [companyId],
    async (release) => {
      const replay = accept(hub, davi, id)
      await queued(hub, 1, replay)
      await hub.test.asOwner('delete from auth.session where user_id = $1', [davi.id])
      await release()
      return replay
    },
  )
  assert.deepEqual([queuedReplay.statusCode, codeOf(queuedReplay)], [401, 'SESSION_REQUIRED'])
  const signedIn = await signIn(hub, { email: INVITEE, password: PASSWORD })
  const current = {
    id: davi.id,
    cookie: String(signedIn.headers['set-cookie']).split(';')[0] ?? '',
  }
  await hub.test.asOwner('delete from auth.member where user_id = $1', [davi.id])
  const removed = await accept(hub, current, id)
  assert.deepEqual([removed.statusCode, codeOf(removed)], [422, 'INVITATION_CLOSED'])
  assert.deepEqual(await statusOf(hub, id), [{ status: 'accepted' }])
  assert.deepEqual(
    await hub.test.asOwner('select revision from auth.invitation where id = $1', [id]),
    [{ revision: 1 }],
  )
})

test('acceptance and public declination have exactly one winner', async (t) => {
  const { hub, invite } = await companyOn(t)
  const davi = await personOn(hub, DAVI)
  const id = await invite()
  const replies = await Promise.all([
    accept(hub, davi, id),
    hub.app.inject({
      method: 'PUT',
      url: `/api/invitations/${id}/declination`,
      headers: {
        origin: TEST_ORIGIN,
        'content-type': 'application/json',
        'cf-connecting-ip': '203.0.113.90',
      },
      payload: { revision: 0 },
    }),
  ])
  const accepted = replies[0]?.statusCode === 200
  assert.deepEqual(
    replies.map((r) => r.statusCode),
    accepted ? [200, 422] : [422, 204],
  )
  assert.deepEqual(await statusOf(hub, id), [{ status: accepted ? 'accepted' : 'rejected' }])
  assert.deepEqual(await members(hub, davi.id), accepted ? [{ role: 'admin' }] : [])
})

type Reply = Awaited<ReturnType<typeof accept>>

/** Resolves once `count` requests of this database wait on a lock, or `request` has answered. */
async function queued(hub: MailHub, count: number, request: Promise<Reply>): Promise<void> {
  let answered = false
  void request.then(() => {
    answered = true
  })
  const waiting = `select count(distinct l.pid)::int as waiting from pg_locks l
    join pg_stat_activity a on a.pid = l.pid
    where not l.granted and a.datname = current_database()`
  const deadline = Date.now() + 5_000
  while (!answered && Object((await hub.test.asOwner(waiting))[0]).waiting < count) {
    assert.ok(Date.now() < deadline, `${count} requests never queued on the company`)
    await setTimeout(20)
  }
}

function outcomeOf(response: Reply): string {
  return `${response.statusCode}${response.statusCode < 300 ? '' : String(codeOf(response))}`
}

// The company is held with the strongest row lock, so each request stops at its first touch of the
// company, the first in line goes first on release, and both orders run every time.
test('aceitar: com um re-convite ao mesmo tempo, nas duas ordens, membro e 409 MEMBER_EXISTS, ou o convite canceled e 422; nunca 40P01', async (t) => {
  const { hub, ana, companyId, invite } = await companyOn(t)
  const orders = [
    { first: 'accept', answers: ['200', '409MEMBER_EXISTS'], status: 'accepted', joined: 1 },
    { first: 'invite', answers: ['201', '422INVITATION_CLOSED'], status: 'canceled', joined: 0 },
  ]
  for (const [round, order] of orders.entries()) {
    const email = `pessoa${round}@example.test`
    const person = await personOn(hub, { name: `Pessoa ${round}`, email })
    const invitationId = await invite(email)
    function accepting() {
      return accept(hub, person, invitationId)
    }
    function inviting() {
      return post(hub, ana, `/api/companies/${companyId}/invitations`, { email, role: 'member' })
    }
    const [first, second] = order.first === 'accept' ? [accepting, inviting] : [inviting, accepting]
    const lockCompany = 'select id from auth.company where id = $1 for update'
    const answered = await withOwnerLock(hub.test, lockCompany, [companyId], async (release) => {
      const ahead = first()
      await queued(hub, 1, ahead)
      const behind = second()
      await queued(hub, 2, behind)
      await release()
      return Promise.all([ahead, behind])
    })
    assert.deepEqual(answered.map(outcomeOf), order.answers, `${order.first} first`)
    const [status] = await statusOf(hub, invitationId)
    const joined = await members(hub, person.id)
    assert.deepEqual([status?.status, joined.length], [order.status, order.joined])
  }
})

test('aceitar: uma escrita recusada no meio do aceite, ou no commit, não deixa nada e dá 500', async (t) => {
  const { hub, invite } = await companyOn(t)
  const davi = await personOn(hub, DAVI)
  const invitationId = await invite()
  await hub.test.asOwner('revoke insert on auth.member from hub_runtime')
  const refused = await accept(hub, davi, invitationId)
  assert.deepEqual([refused.statusCode, codeOf(refused)], [500, 'INTERNAL_UNEXPECTED'])
  await hub.test.asOwner('grant insert on auth.member to hub_runtime')
  // A refusal at commit, after the plugin wrote the member: only one transaction undoes it.
  await hub.test.asOwner(`create function auth.refuse_acceptance() returns trigger
    language plpgsql as $$ begin raise exception 'refused'; end $$`)
  await hub.test.asOwner(`create constraint trigger refuse_acceptance after update
    on auth.invitation deferrable initially deferred for each row
    execute function auth.refuse_acceptance()`)
  const late = await accept(hub, davi, invitationId)
  assert.deepEqual([late.statusCode, codeOf(late)], [500, 'INTERNAL_UNEXPECTED'])
  assert.deepEqual(await statusOf(hub, invitationId), [{ status: 'pending' }])
  assert.deepEqual(await members(hub, davi.id), [])
})
