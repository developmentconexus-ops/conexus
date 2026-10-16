import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sql } from 'drizzle-orm'
import { WRITE_HEADERS } from '../../platform/test-database.ts'
import type { MailHub } from './test-hub.ts'
import { codeOf, companyOn, hubWithMail, INVITEE, id } from './test-hub.ts'

function write(hub: MailHub, invitationId: string) {
  return hub.app.inject({
    method: 'PUT',
    url: `/api/invitations/${invitationId}/password`,
    headers: WRITE_HEADERS,
    payload: { name: 'Davi Costa', password: 'senha-nova-1', revision: 0 },
  })
}

test('password: a person with an empty name is refused without a token, session or mail', async (t) => {
  const { hub, invite } = await companyOn(t)
  await hub.test.asOwner(`insert into auth.user (id, name, email) values ($1, '', $2)`, [
    id(),
    INVITEE,
  ])
  const reply = await write(hub, await invite())
  assert.deepEqual([reply.statusCode, codeOf(reply)], [500, 'INTERNAL_UNEXPECTED'])
  assert.equal(reply.headers['set-cookie'], undefined)
  assert.equal(hub.mail.sent.length, 1)
  assert.deepEqual(await hub.test.asOwner('select count(*)::int as links from auth.verification'), [
    { links: 0 },
  ])
})

test('password: terminal and expired links refuse writes without creating a person', async (t) => {
  const { hub, invite } = await companyOn(t)
  const invitationId = await invite()
  for (const status of ['accepted', 'rejected', 'canceled', 'pending']) {
    await hub.test.asOwner(
      `update auth.invitation set status = $1, expires_at = now() - interval '1 second' where id = $2`,
      [status, invitationId],
    )
    const refused = await write(hub, invitationId)
    assert.deepEqual([refused.statusCode, codeOf(refused)], [422, 'INVITATION_CLOSED'])
    assert.equal(refused.headers['set-cookie'], undefined)
  }
  assert.deepEqual(
    await hub.test.asOwner('select count(*)::int as users from auth.user where email = $1', [
      INVITEE,
    ]),
    [{ users: 0 }],
  )
})

test('password: unknown or malformed links are 404 without creating a person', async (t) => {
  const hub = await hubWithMail(t)
  for (const invitationId of [id(), 'not-an-id']) {
    const reply = await write(hub, invitationId)
    assert.deepEqual([reply.statusCode, codeOf(reply)], [404, 'NOT_FOUND'])
  }
  assert.deepEqual(await hub.test.asOwner('select count(*)::int as users from auth.user'), [
    { users: 0 },
  ])
})

test('password: an unknown link leaves the transaction pool connection reusable', async (t) => {
  const hub = await hubWithMail(t)
  const pool = hub.test.database.libraryOrm({}).$client
  const backends = `select pid from pg_stat_activity where datname = current_database() and usename = 'hub_runtime' order by pid`
  await hub.test.database.read((tx) => tx.execute(sql`select 1`))
  const before = await hub.test.asOwner(backends)
  for (let round = 0; round < 3; round++) assert.equal((await write(hub, id())).statusCode, 404)
  assert.deepEqual([pool.totalCount, pool.idleCount], [1, 1])
  assert.deepEqual(await hub.test.asOwner(backends), before)
})
