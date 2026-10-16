import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { test } from 'node:test'
import { sql } from 'drizzle-orm'
import { WRITE_HEADERS } from '../../platform/test-database.ts'
import type { Mail, MailHub } from './test-hub.ts'
import { codeOf, companyOn, hubWithMail, INVITEE, id, personOn } from './test-hub.ts'

const SET_PASSWORD =
  /^https:\/\/hub\.example\.test\/set-password\?redirect=\/invitations\/([A-Za-z0-9]{32})#token=([A-Za-z0-9]+)$/m

function askLink(hub: MailHub, invitationId: string, name = 'Davi Costa') {
  return hub.app.inject({
    method: 'PUT',
    url: `/api/invitations/${invitationId}/password-link`,
    headers: WRITE_HEADERS,
    payload: JSON.stringify({ name }),
  })
}

function setPassword(hub: MailHub, token: string) {
  return hub.app.inject({
    method: 'PUT',
    url: '/api/passwords',
    headers: WRITE_HEADERS,
    payload: JSON.stringify({ token, password: 'senha-nova-1' }),
  })
}

function tokenOf(mail: Mail | undefined, invitationId: string): string {
  const match = mail?.text.match(SET_PASSWORD)
  assert.equal(match?.[1], invitationId, mail?.text)
  return match?.[2] ?? ''
}

test('link: sem pessoa, ela é criada com o nome, e o e-mail leva /set-password?redirect=/invitations/{id}#token=', async (t) => {
  const { hub, invite } = await companyOn(t)
  const invitationId = await invite()
  const given = await askLink(hub, invitationId)
  assert.deepEqual([given.statusCode, given.body], [204, ''])
  assert.deepEqual(
    await hub.test.asOwner('select name, role from auth.user where email = $1', [INVITEE]),
    [{ name: 'Davi Costa', role: 'user' }],
  )
  const mail = hub.mail.sent[1]
  assert.deepEqual(
    { ...mail, text: undefined },
    {
      to: INVITEE,
      subject: 'Crie sua senha do Conexus',
      text: undefined,
    },
  )
  assert.match(
    mail?.text ?? '',
    /^Link para Davi Costa criar a senha do Conexus\. Vale 15 minutos e uma vez só\.$/m,
  )
  assert.equal((await setPassword(hub, tokenOf(mail, invitationId))).statusCode, 204)
})

test('link: a pessoa de id vazio no banco, 500 e nenhum link nem e-mail', async (t) => {
  const { hub, invite } = await companyOn(t)
  await hub.test.asOwner(`insert into auth.user (id, name, email) values ('', 'Davi Costa', $1)`, [
    INVITEE,
  ])
  const refused = await askLink(hub, await invite())
  assert.deepEqual([refused.statusCode, codeOf(refused)], [500, 'INTERNAL_UNEXPECTED'])
  assert.deepEqual(
    hub.mail.sent.map((mail) => mail.subject),
    ['Convite para Empresa Teste'],
  )
  assert.deepEqual(await hub.test.asOwner('select count(*)::int as links from auth.verification'), [
    { links: 0 },
  ])
})

test('link: quem já tem senha, 204 e nenhum e-mail', async (t) => {
  const { hub, invite } = await companyOn(t)
  await personOn(hub, { name: 'Davi Costa', email: INVITEE })
  const given = await askLink(hub, await invite(), 'Outro Nome')
  assert.equal(given.statusCode, 204)
  assert.deepEqual(
    hub.mail.sent.map((mail) => mail.subject),
    ['Convite para Empresa Teste'],
  )
  assert.deepEqual(await hub.test.asOwner('select count(*)::int as links from auth.verification'), [
    { links: 0 },
  ])
})

test('link: convite cancelado, vencido, desconhecido ou malformado, 404 e ninguém criado', async (t) => {
  const { hub, invite } = await companyOn(t)
  const canceled = await invite()
  await invite()
  const expired = await invite('edu@example.test')
  await hub.test.asOwner(
    `update auth.invitation set expires_at = now() - interval '1 second' where id = $1`,
    [expired],
  )
  const randomId = randomBytes(16).toString('hex')
  for (const invitationId of [canceled, expired, randomId, 'nao-e-um-id']) {
    const refused = await askLink(hub, invitationId)
    assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'NOT_FOUND'], invitationId)
  }
  assert.deepEqual(
    await hub.test.asOwner('select count(*)::int as people from auth.user where role = $1', [
      'user',
    ]),
    [{ people: 0 }],
  )
})

test('link: um id desconhecido, 404, e a conexão do pool segue a mesma', async (t) => {
  const hub = await hubWithMail(t)
  const pool = hub.test.database.libraryOrm({}).$client
  const backends = `select pid from pg_stat_activity
    where datname = current_database() and usename = 'hub_runtime'`
  await hub.test.database.read((tx) => tx.execute(sql`select 1`))
  const before = await hub.test.asOwner(backends)
  for (let round = 0; round < 3; round++) {
    const refused = await askLink(hub, id())
    assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'NOT_FOUND'])
  }
  assert.deepEqual([pool.totalCount, pool.idleCount], [1, 1])
  assert.deepEqual(await hub.test.asOwner(backends), before)
})

test('link: dois pedidos juntos, uma pessoa só e um 429 PASSWORD_LINKS_EXCEEDED', async (t) => {
  const { hub, invite } = await companyOn(t)
  const invitationId = await invite()
  const both = await Promise.all([askLink(hub, invitationId), askLink(hub, invitationId)])
  const answers = both.map((response) => [response.statusCode, response.body && codeOf(response)])
  assert.deepEqual(answers.sort(), [
    [204, ''],
    [429, 'PASSWORD_LINKS_EXCEEDED'],
  ])
  assert.deepEqual(
    await hub.test.asOwner('select count(*)::int as people from auth.user where email = $1', [
      INVITEE,
    ]),
    [{ people: 1 }],
  )
  assert.equal(hub.mail.sent.length, 2)
})

test('link: passados 20 s, um link novo, e o anterior deixa de valer, 422', async (t) => {
  const { hub, invite } = await companyOn(t)
  const invitationId = await invite()
  assert.equal((await askLink(hub, invitationId)).statusCode, 204)
  const old = tokenOf(hub.mail.sent[1], invitationId)
  const early = await askLink(hub, invitationId)
  assert.deepEqual([early.statusCode, codeOf(early)], [429, 'PASSWORD_LINKS_EXCEEDED'])
  await hub.test.asOwner(`update auth.verification set created_at = now() - interval '21 seconds'`)
  assert.equal((await askLink(hub, invitationId)).statusCode, 204)
  const fresh = tokenOf(hub.mail.sent[2], invitationId)
  const reused = await setPassword(hub, old)
  assert.deepEqual([reused.statusCode, codeOf(reused)], [422, 'PASSWORD_LINK_INVALID'])
  assert.equal((await setPassword(hub, fresh)).statusCode, 204)
})
