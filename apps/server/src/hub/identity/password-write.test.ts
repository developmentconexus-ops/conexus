import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Email } from '@conexus/hub-api'
import {
  createTestDatabase,
  serveEnvironment,
  silent,
  testConfig,
  WRITE_HEADERS,
} from '../../platform/test-database.ts'
import { spawnHub } from '../../platform/test-hub-process.ts'
import { testMail } from '../../platform/test-mail.ts'
import { createIdentity } from './public.ts'

import {
  codeOf,
  companyOn,
  INVITEE,
  personOn,
  plantCompany,
  post,
  signIn,
  signOut,
} from './test-hub.ts'

// The library's scrypt hash is a hex salt and a hex key joined by a colon.
const PASSWORD_HASH = /[0-9a-f]{16,}:[0-9a-f]{64,}/

test('invitation password creates a verified session but no membership or second mail', async (t) => {
  const { hub, invite } = await companyOn(t)
  const id = await invite()
  const before = hub.mail.sent.length
  const response = await hub.app.inject({
    method: 'PUT',
    url: `/api/invitations/${id}/password`,
    headers: WRITE_HEADERS,
    payload: { name: 'Davi Reis', password: '12345678', revision: 0 },
  })
  assert.equal(response.statusCode, 204, response.body)
  assert.match(String(response.headers['set-cookie']), /__Host-conexus_session=/)
  assert.equal(hub.mail.sent.length, before)
  assert.deepEqual(
    await hub.test.asOwner(`select email_verified from auth.user where email = $1`, [INVITEE]),
    [{ email_verified: true }],
  )
  assert.deepEqual(
    await hub.test.asOwner(
      `select count(*)::int as members from auth.member m join auth.user u on u.id = m.user_id where u.email = $1`,
      [INVITEE],
    ),
    [{ members: 0 }],
  )
  const again = await hub.app.inject({
    method: 'PUT',
    url: `/api/invitations/${id}/password`,
    headers: WRITE_HEADERS,
    payload: { name: 'Other Name', password: 'different-password', revision: 1 },
  })
  assert.deepEqual([again.statusCode, codeOf(again)], [409, 'INVITATION_PASSWORD_EXISTS'])
  assert.equal((await signIn(hub, { email: INVITEE, password: '12345678' })).statusCode, 200)
})

test('invitation password rejects lengths, serializes concurrent writers and rolls back failed session writes', async (t) => {
  const { hub, invite } = await companyOn(t)
  const id = await invite()
  function write(password: string) {
    return hub.app.inject({
      method: 'PUT',
      url: `/api/invitations/${id}/password`,
      headers: WRITE_HEADERS,
      payload: { name: 'Davi Reis', password, revision: 0 },
    })
  }
  for (const size of [7, 129]) assert.equal((await write('a'.repeat(size))).statusCode, 400)
  await hub.test.asOwner('revoke insert on auth.session from hub_invitation')
  const failed = await write('a'.repeat(128))
  assert.equal(failed.statusCode, 503)
  assert.equal(failed.headers['set-cookie'], undefined)
  assert.deepEqual(
    await hub.test.asOwner(`select count(*)::int as users from auth.user where email = $1`, [
      INVITEE,
    ]),
    [{ users: 0 }],
  )
  await hub.test.asOwner('grant insert on auth.session to hub_invitation')
  const results = await Promise.all([write('a'.repeat(128)), write('other-password')])
  assert.deepEqual(results.map((r) => r.statusCode).sort(), [204, 412])
  const winningPassword = results[0]?.statusCode === 204 ? 'a'.repeat(128) : 'other-password'
  assert.equal((await signIn(hub, { email: INVITEE, password: winningPassword })).statusCode, 200)
})

test('two companies inviting the same email cannot replace the winning password', async (t) => {
  const { hub, ana, invite } = await companyOn(t)
  const first = await invite()
  const secondCompany = await plantCompany(hub.test, ana.id, 'Outra Empresa')
  const second = await post(hub, ana, `/api/companies/${secondCompany}/invitations`, {
    email: INVITEE,
    role: 'member',
  })
  const ids = [first, String(Object(second.json()).invitation.id)]
  const passwords = ['first-password', 'second-password']
  const replies = await Promise.all(
    ids.map((id, index) =>
      hub.app.inject({
        method: 'PUT',
        url: `/api/invitations/${id}/password`,
        headers: WRITE_HEADERS,
        payload: { name: 'Davi Costa', password: passwords[index], revision: 0 },
      }),
    ),
  )
  assert.deepEqual(replies.map((r) => r.statusCode).sort(), [204, 409])
  const winner = replies.findIndex((r) => r.statusCode === 204)
  assert.equal((await signIn(hub, { email: INVITEE, password: passwords[winner] })).statusCode, 200)
  assert.deepEqual(
    await hub.test.asOwner('select count(*)::int as users from auth.user where email = $1', [
      INVITEE,
    ]),
    [{ users: 1 }],
  )
})

test('a failure after each password write rolls the whole transaction back with no cookie', async (t) => {
  const { hub, invite } = await companyOn(t)
  const id = await invite()
  const failures = [
    ['user', 'insert', false, 503],
    ['user', 'update', false, 503],
    ['verification', 'insert', false, 503],
    ['verification', 'delete', false, 503],
    ['account', 'insert', false, 503],
    ['session', 'insert', false, 503],
    ['invitation', 'update', false, 500],
    ['session', 'insert', true, 500],
  ] as const
  for (const [table, event, deferred, status] of failures) {
    await hub.test.asOwner(
      `create function auth.refuse_password() returns trigger language plpgsql as $$ begin raise exception 'refused'; end $$`,
    )
    await hub.test.asOwner(
      `create constraint trigger refuse_password after ${event} on auth.${table} ${deferred ? 'deferrable initially deferred' : 'not deferrable'} for each row execute function auth.refuse_password()`,
    )
    const failed = await hub.app.inject({
      method: 'PUT',
      url: `/api/invitations/${id}/password`,
      headers: WRITE_HEADERS,
      payload: { name: 'Davi Costa', password: 'senha-nova-1', revision: 0 },
    })
    assert.equal(failed.statusCode, status, `${table} ${event} deferred=${deferred}`)
    assert.equal(failed.headers['set-cookie'], undefined)
    assert.deepEqual(
      await hub.test.asOwner(
        `select
      (select count(*)::int from auth.user where email = $1) as users,
      (select count(*)::int from auth.verification) as tokens,
      (select count(*)::int from auth.account a join auth.user u on a.user_id = u.id where u.email = $1) as accounts,
      (select count(*)::int from auth.session s join auth.user u on s.user_id = u.id where u.email = $1) as sessions`,
        [INVITEE],
      ),
      [{ users: 0, tokens: 0, accounts: 0, sessions: 0 }],
    )
    assert.deepEqual(
      await hub.test.asOwner('select revision from auth.invitation where id = $1', [id]),
      [{ revision: 0 }],
    )
    await hub.test.asOwner(`drop trigger refuse_password on auth.${table}`)
    await hub.test.asOwner('drop function auth.refuse_password()')
  }
})

test('all invitation writes refuse absent or foreign origins and form media; revoked acceptance refuses the session', async (t) => {
  const { hub, invite } = await companyOn(t)
  const davi = await personOn(hub, { name: 'Davi Costa', email: INVITEE })
  const id = await invite()
  for (const action of ['password', 'declination', 'acceptance']) {
    for (const origin of [undefined, 'https://elsewhere.example.test']) {
      const reply = await hub.app.inject({
        method: 'PUT',
        url: `/api/invitations/${id}/${action}`,
        headers: {
          'content-type': 'application/json',
          'cf-connecting-ip': '203.0.113.7',
          ...(origin === undefined ? {} : { origin }),
          cookie: davi.cookie,
        },
        payload: { revision: 0 },
      })
      assert.equal(reply.statusCode, 403)
    }
    const media = await hub.app.inject({
      method: 'PUT',
      url: `/api/invitations/${id}/${action}`,
      headers: {
        ...WRITE_HEADERS,
        cookie: davi.cookie,
        'content-type': 'application/x-www-form-urlencoded',
      },
      payload: 'revision=0',
    })
    assert.equal(media.statusCode, 415)
  }
  assert.equal((await signOut(hub, davi.cookie)).statusCode, 204)
  const revoked = await hub.app.inject({
    method: 'PUT',
    url: `/api/invitations/${id}/acceptance`,
    headers: { ...WRITE_HEADERS, cookie: davi.cookie },
    payload: { revision: 0 },
  })
  assert.deepEqual([revoked.statusCode, codeOf(revoked)], [401, 'SESSION_REQUIRED'])
  assert.deepEqual(
    await hub.test.asOwner('select status, revision from auth.invitation where id = $1', [id]),
    [{ status: 'pending', revision: 0 }],
  )
})

test('senha que não grava: 503, nenhuma senha, o link continua valendo, e a saída não traz o erro do banco', async (t) => {
  const test = await createTestDatabase(t)
  const config = testConfig(test.runtimeUrl)
  const identity = createIdentity({
    ...{ database: test.database, config, log: silent },
    sendMail: testMail(config),
  })
  const { link } = await identity.firstPerson({
    name: 'Ana Lima',
    email: Email.parse('ana@example.test'),
  })
  const token = link.split('#token=')[1]
  const { port, lines, stop } = await spawnHub(t, serveEnvironment(t, test.runtimeUrl))
  function setPassword() {
    return fetch(`http://127.0.0.1:${port}/api/passwords`, {
      method: 'PUT',
      headers: WRITE_HEADERS,
      body: JSON.stringify({ token, password: 'senha-nova-1' }),
    })
  }

  await test.asOwner('revoke insert on auth.account from hub_runtime')
  const failed = await setPassword()
  assert.equal(failed.status, 503)
  assert.equal(Object(await failed.json()).code, 'DATABASE_UNAVAILABLE')
  const left = await test.asOwner(`select
    (select count(*)::int from auth.account) as accounts,
    (select count(*)::int from auth.verification) as links`)
  assert.deepEqual(left, [{ accounts: 0, links: 1 }])

  await test.asOwner('grant insert on auth.account to hub_runtime')
  assert.equal((await setPassword()).status, 204)
  await stop()

  const [person] = await test.asOwner('select id from auth.user')
  const output = JSON.stringify(lines)
  assert.doesNotMatch(output, PASSWORD_HASH)
  assert.doesNotMatch(output, new RegExp(String(person?.id)))
  const messages = lines.map((line) => String(line.msg))
  assert.ok(messages.includes('DATABASE_UNAVAILABLE'), 'the failure was logged by its code')
})
