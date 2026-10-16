import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { WRITE_HEADERS } from '../../platform/test-database.ts'
import { CARLA, codeOf, companyOn, INVITEE, personOn, post } from './test-hub.ts'

type Setup = Awaited<ReturnType<typeof companyOn>>
function change(
  s: Setup,
  id: string,
  method: 'PUT' | 'DELETE',
  revision = 0,
  cookie = s.ana.cookie,
) {
  return s.hub.app.inject({
    method,
    url: `/api/companies/${s.companyId}/invitations/${id}`,
    headers: { ...WRITE_HEADERS, cookie },
    payload: { revision },
  })
}
function link(s: Setup, id: string) {
  return s.hub.app.inject({ method: 'GET', url: `/api/invitations/${id}` })
}
async function snapshot(s: Setup, id: string) {
  return s.hub.test.asOwner(
    'select status, revision, xmin::text as version from auth.invitation where id = $1',
    [id],
  )
}
function reissue(s: Setup, id: string, key = randomUUID(), revision = 0) {
  return post(
    s.hub,
    s.ana,
    `/api/companies/${s.companyId}/invitations`,
    {
      email: INVITEE,
      role: 'admin',
      replaces: { id, revision },
    },
    key,
  )
}

test('cancel: current administrator only; original-revision replay has no write and no authority survives revocation', async (t) => {
  const s = await companyOn(t)
  const id = await s.invite()
  const outsider = await personOn(s.hub, CARLA)
  assert.equal((await change(s, id, 'DELETE', 0, outsider.cookie)).statusCode, 404)
  await s.hub.test.asOwner(
    `insert into auth.member(id, company_id, user_id, role, created_at) values ('member-carla', $1, $2, 'member', now())`,
    [s.companyId, outsider.id],
  )
  assert.equal((await change(s, id, 'DELETE', 0, outsider.cookie)).statusCode, 404)
  const stale = await change(s, id, 'DELETE', 1)
  assert.equal(stale.statusCode, 412)
  assert.equal(codeOf(stale), 'INVITATION_STALE')
  assert.equal((await change(s, id, 'DELETE')).statusCode, 204)
  const canceled = await snapshot(s, id)
  assert.equal((await change(s, id, 'DELETE')).statusCode, 204)
  assert.deepEqual(await snapshot(s, id), canceled)
  assert.deepEqual(Object((await link(s, id)).json()).invitation, {
    kind: 'CLOSED',
    state: 'CANCELED',
  })
  await s.hub.test.asOwner('delete from auth.member where company_id = $1 and user_id = $2', [
    s.companyId,
    s.ana.id,
  ])
  assert.equal((await change(s, id, 'DELETE')).statusCode, 404)
  assert.deepEqual(await snapshot(s, id), canceled)
})

test('renew: native resend keeps the link, extends two days, advances revision and delivers outside the transaction', async (t) => {
  const s = await companyOn(t)
  const id = await s.invite()
  await s.hub.test.asOwner(
    `update auth.invitation set expires_at = now() + interval '1 hour' where id = $1`,
    [id],
  )
  const before = Date.now()
  const renewed = await change(s, id, 'PUT')
  assert.equal(renewed.statusCode, 200)
  const row = Object(renewed.json()).invitation
  assert.equal(row.id, id)
  assert.equal(row.revision, 1)
  assert.ok(Date.parse(row.expiresAt) >= before + 172800000)
  assert.ok(Date.parse(row.expiresAt) <= Date.now() + 172800000)
  assert.equal(s.hub.mail.sent.length, 2)
  assert.ok(s.hub.mail.sent.every((mail) => mail.text.includes(`/invitations/${id}`)))
  assert.equal((await change(s, id, 'PUT')).statusCode, 412)
  assert.equal(s.hub.mail.sent.length, 2)
  const first = await change(s, id, 'DELETE', 1)
  assert.equal(first.statusCode, 204)
  assert.equal((await change(s, id, 'PUT', 2)).statusCode, 422)
})

test('expired reissue changes the link, preserves EXPIRED on the old link and binds the complete replay payload', async (t) => {
  const s = await companyOn(t)
  const id = await s.invite()
  assert.equal((await reissue(s, id)).statusCode, 412)
  await s.hub.test.asOwner(
    `update auth.invitation set expires_at = now() - interval '1 second' where id = $1`,
    [id],
  )
  assert.equal((await change(s, id, 'PUT')).statusCode, 422)
  const key = randomUUID()
  const made = await reissue(s, id, key)
  assert.equal(made.statusCode, 201)
  const next = Object(made.json()).invitation
  assert.notEqual(next.id, id)
  assert.equal(next.revision, 0)
  assert.deepEqual(Object((await link(s, id)).json()).invitation, {
    kind: 'CLOSED',
    state: 'EXPIRED',
  })
  assert.equal((await change(s, id, 'DELETE', 1)).statusCode, 422)
  assert.deepEqual((await reissue(s, id, key)).json(), made.json())
  const changed = await reissue(s, id, key, 1)
  assert.equal(changed.statusCode, 409)
  assert.equal(codeOf(changed), 'IDEMPOTENCY_CONFLICT')
  assert.equal(
    (
      await post(
        s.hub,
        s.ana,
        `/api/companies/${s.companyId}/invitations`,
        { email: INVITEE, role: 'admin' },
        key,
      )
    ).statusCode,
    409,
  )
  assert.equal((await change(s, next.id, 'DELETE')).statusCode, 204)
  const terminal = await reissue(s, id, key)
  assert.equal(terminal.statusCode, 422)
  assert.equal(codeOf(terminal), 'INVITATION_CLOSED')
  assert.equal(s.hub.mail.sent.length, 2)
})

test('cancel races with renewal and reissue through one revision; accepted or declined never become canceled', async (t) => {
  const s = await companyOn(t)
  const id = await s.invite()
  const responses = await Promise.all([change(s, id, 'DELETE'), change(s, id, 'PUT')])
  assert.equal(responses.filter((r) => r.statusCode < 300).length, 1)
  assert.ok(responses.some((r) => r.statusCode === 412 || r.statusCode === 422))
  for (const status of ['accepted', 'rejected']) {
    const next = await s.invite(`${status}@example.test`)
    await s.hub.test.asOwner('update auth.invitation set status = $1 where id = $2', [status, next])
    const before = await snapshot(s, next)
    assert.equal((await change(s, next, 'DELETE')).statusCode, 422)
    assert.deepEqual(await snapshot(s, next), before)
  }
  const expired = await s.invite()
  await s.hub.test.asOwner(
    `update auth.invitation set expires_at = now() - interval '1 second' where id = $1`,
    [expired],
  )
  const raced = await Promise.all([change(s, expired, 'DELETE'), reissue(s, expired)])
  assert.equal(raced.filter((r) => r.statusCode < 300).length, 1)
  assert.ok(raced.some((r) => r.statusCode === 412 || r.statusCode === 422))
})

test('a late send cannot mark a newer renewal that failed delivery', async (t) => {
  const s = await companyOn(t)
  const key = randomUUID()
  const id = await s.invite(INVITEE, key)
  s.hub.mail.state.mode = 'HOLD'
  const held = change(s, id, 'PUT').then((reply) => reply)
  await s.hub.mail.held
  s.hub.mail.state.mode = 'FAIL'
  assert.equal((await change(s, id, 'PUT', 1)).statusCode, 502)
  s.hub.mail.releaseHeld()
  assert.equal((await held).statusCode, 200)
  assert.deepEqual(
    await s.hub.test.asOwner('select revision, mailed_at from auth.invitation where id = $1', [id]),
    [{ revision: 2, mailed_at: null }],
  )
  s.hub.mail.state.mode = 'DELIVER'
  assert.equal(
    (
      await post(
        s.hub,
        s.ana,
        `/api/companies/${s.companyId}/invitations`,
        { email: INVITEE, role: 'admin' },
        key,
      )
    ).statusCode,
    201,
  )
  assert.equal(s.hub.mail.sent.length, 3)
})

test('management rejects wrong company, missing or revoked sessions, foreign origins and form bodies without a write', async (t) => {
  const s = await companyOn(t)
  const id = await s.invite()
  const before = await snapshot(s, id)
  for (const method of ['DELETE', 'PUT'] as const) {
    const url = `/api/companies/${s.companyId}/invitations/${id}`
    for (const origin of ['', 'https://outside.example.test']) {
      const refused = await s.hub.app.inject({
        method,
        url,
        headers: { ...WRITE_HEADERS, origin, cookie: s.ana.cookie },
        payload: { revision: 0 },
      })
      assert.equal(refused.statusCode, 403)
    }
    const media = await s.hub.app.inject({
      method,
      url,
      headers: {
        ...WRITE_HEADERS,
        cookie: s.ana.cookie,
        'content-type': 'application/x-www-form-urlencoded',
      },
      payload: 'revision=0',
    })
    assert.equal(media.statusCode, 415)
    assert.equal((await change(s, id, method, 0, '')).statusCode, 401)
    const wrong = await s.hub.app.inject({
      method,
      url: `/api/companies/${'x'.repeat(32)}/invitations/${id}`,
      headers: { ...WRITE_HEADERS, cookie: s.ana.cookie },
      payload: { revision: 0 },
    })
    assert.equal(wrong.statusCode, 404)
  }
  await s.hub.test.asOwner('delete from auth.session where user_id = $1', [s.ana.id])
  assert.equal((await change(s, id, 'DELETE')).statusCode, 401)
  assert.equal((await change(s, id, 'PUT')).statusCode, 401)
  assert.deepEqual(await snapshot(s, id), before)
})

test('reissue rollback preserves the old expired invitation; failed mail marking permits at-least-once replay', async (t) => {
  const s = await companyOn(t)
  const id = await s.invite()
  await s.hub.test.asOwner(
    `update auth.invitation set expires_at = now() - interval '1 second' where id = $1`,
    [id],
  )
  await s.hub.test.asOwner(`create function auth.refuse_insert() returns trigger language plpgsql as $$ begin raise exception using errcode = '57014'; end $$;
    create trigger refuse_insert before insert on auth.invitation for each row execute function auth.refuse_insert()`)
  const before = await snapshot(s, id)
  assert.equal((await reissue(s, id)).statusCode, 503)
  assert.deepEqual(await snapshot(s, id), before)
  await s.hub.test.asOwner('drop trigger refuse_insert on auth.invitation')
  await s.hub.test.asOwner(`create function auth.refuse_mark() returns trigger language plpgsql as $$ begin
    if new.mailed_at is not null and old.mailed_at is null then raise exception using errcode = '57014'; end if; return new; end $$;
    create trigger refuse_mark before update on auth.invitation for each row execute function auth.refuse_mark()`)
  const key = randomUUID()
  const failed = await reissue(s, id, key)
  assert.equal(failed.statusCode, 503)
  assert.equal(s.hub.mail.sent.length, 2)
  await s.hub.test.asOwner('drop trigger refuse_mark on auth.invitation')
  assert.equal((await reissue(s, id, key)).statusCode, 201)
  assert.equal(s.hub.mail.sent.length, 3)
  assert.equal((await reissue(s, id, key)).statusCode, 201)
  assert.equal(s.hub.mail.sent.length, 3)
})
