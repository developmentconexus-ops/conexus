import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import type { MailHub, Person } from './test-hub.ts'
import {
  ANA_OWNER,
  BRUNO,
  CARLA,
  codeOf,
  hubWithMail,
  INVITEE,
  id,
  personOn,
  plantCompany,
  post,
} from './test-hub.ts'

/** Ana owns Empresa Teste; Bruno is its administrator, Carla its member. */
async function companyOn(t: TestContext) {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA_OWNER)
  const bruno = await personOn(hub, BRUNO)
  const carla = await personOn(hub, CARLA)
  const companyId = await plantCompany(hub.test, ana.id)
  for (const [person, role] of [
    [bruno, 'admin'],
    [carla, 'member'],
  ] as const) {
    await hub.test.asOwner(
      `insert into auth.member (id, company_id, user_id, role, created_at)
        values ($1, $2, $3, $4, now())`,
      [id(), companyId, person.id, role],
    )
  }
  function invite(by: Person, email: string, role = 'member', key?: string) {
    return post(hub, by, `/api/companies/${companyId}/invitations`, { email, role }, key)
  }
  return { hub, ana, bruno, carla, companyId, invite }
}

async function rows(hub: MailHub, email = INVITEE) {
  return hub.test.asOwner(
    'select status from auth.invitation where email = $1 order by created_at, status',
    [email],
  )
}

async function seed(
  hub: MailHub,
  companyId: string,
  inviterId: string,
  count: number,
  live: boolean,
) {
  await hub.test.asOwner(
    `insert into auth.invitation (id, company_id, email, role, status, expires_at, created_at,
      inviter_id, attempt_key)
      select md5(random()::text), $1, 'seed' || n || $4 || '@example.test', 'member', 'pending',
        now() + case when $4 = 'live' then interval '1 day' else interval '-1 day' end,
        now() - interval '1 day', $2, gen_random_uuid()::text
      from generate_series(1, $3) as n`,
    [companyId, inviterId, count, live ? 'live' : 'dead'],
  )
}

test('convidar: 201, e o e-mail leva o endereço /invitations/{id}', async (t) => {
  const { hub, ana, invite } = await companyOn(t)
  const response = await invite(ana, 'Davi@Example.test', 'admin')
  assert.equal(response.statusCode, 201)
  const { invitation } = Object(response.json())
  assert.match(invitation.id, /^[A-Za-z0-9]{32}$/)
  assert.deepEqual(
    { ...invitation, id: undefined, expiresAt: undefined },
    {
      id: undefined,
      email: INVITEE,
      role: 'admin',
      expiresAt: undefined,
      state: 'PENDING',
      revision: 0,
    },
  )
  const days = (Date.parse(invitation.expiresAt) - Date.now()) / 86_400_000
  assert.ok(days > 1.99 && days <= 2, String(days))
  assert.equal(hub.mail.sent.length, 1)
  const sent = hub.mail.sent[0]
  assert.equal(sent?.to, INVITEE)
  assert.equal(sent?.subject, 'Convite para Empresa Teste')
  assert.ok(sent?.text.includes(`https://hub.example.test/invitations/${invitation.id}`))
  assert.ok(sent?.html.includes('Ver convite'))
})

test('convidar: o membro, ou quem é de outra empresa, 404 e nenhuma linha', async (t) => {
  const { hub, carla, companyId, invite } = await companyOn(t)
  const outsider = await personOn(hub, { name: 'Edu Melo', email: 'edu@example.test' })
  for (const refused of [await invite(carla, INVITEE), await invite(outsider, INVITEE)]) {
    assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'NOT_FOUND'])
  }
  const unknown = await post(hub, carla, `/api/companies/${id()}/invitations`, {
    email: INVITEE,
    role: 'member',
  })
  assert.deepEqual([unknown.statusCode, codeOf(unknown)], [404, 'NOT_FOUND'])
  assert.deepEqual(await rows(hub), [])
  assert.equal(companyId.length, 32)
  assert.deepEqual(hub.mail.sent, [])
})

// The creator-role refusal of a renewal lives only in the plugin's endpoint (crud-invites.mjs:123).
test('renovar: o administrador renovando o convite de um dono, 403 INVITATION_ROLE_REFUSED; o dono renova', async (t) => {
  const { hub, ana, bruno, companyId, invite } = await companyOn(t)
  const invited = await invite(ana, INVITEE, 'owner')
  assert.equal(invited.statusCode, 201)
  const url = `/api/companies/${companyId}/invitations/${Object(invited.json()).invitation.id}`
  function renew(by: Person) {
    return hub.app.inject({
      method: 'PUT',
      url,
      headers: { origin: TEST_ORIGIN, cookie: by.cookie, 'content-type': 'application/json' },
      payload: JSON.stringify({ revision: 0 }),
    })
  }
  const refused = await renew(bruno)
  assert.deepEqual([refused.statusCode, codeOf(refused)], [403, 'INVITATION_ROLE_REFUSED'])
  assert.equal(hub.mail.sent.length, 1)
  const renewed = await renew(ana)
  assert.deepEqual([renewed.statusCode, Object(renewed.json()).invitation.revision], [200, 1])
})

test('convidar: o administrador pedindo dono, 403 INVITATION_ROLE_REFUSED; quem já é membro, 409 MEMBER_EXISTS', async (t) => {
  const { hub, ana, bruno, invite } = await companyOn(t)
  const owner = await invite(bruno, INVITEE, 'owner')
  assert.deepEqual([owner.statusCode, codeOf(owner)], [403, 'INVITATION_ROLE_REFUSED'])
  const member = await invite(ana, 'CARLA@example.test')
  assert.deepEqual([member.statusCode, codeOf(member)], [409, 'MEMBER_EXISTS'])
  assert.deepEqual(await rows(hub), [])
  assert.equal((await invite(ana, INVITEE, 'owner')).statusCode, 201)
  assert.equal((await invite(bruno, 'edu@example.test', 'admin')).statusCode, 201)
})

test('convidar: o endereço que volta, 422 MAIL_BOUNCED; o correio fora, 502 MAIL_UNAVAILABLE; o convite fica', async (t) => {
  const { hub, ana, invite } = await companyOn(t)
  hub.mail.state.mode = 'BOUNCE'
  const bounced = await invite(ana, INVITEE)
  assert.deepEqual([bounced.statusCode, codeOf(bounced)], [422, 'MAIL_BOUNCED'])
  hub.mail.state.mode = 'FAIL'
  const down = await invite(ana, 'edu@example.test')
  assert.deepEqual([down.statusCode, codeOf(down)], [502, 'MAIL_UNAVAILABLE'])
  assert.deepEqual(await rows(hub), [{ status: 'pending' }])
  assert.deepEqual(await rows(hub, 'edu@example.test'), [{ status: 'pending' }])
})

test('de novo com a mesma chave: depois do correio fora, um e-mail; depois de um endereço que volta, nenhum', async (t) => {
  const { hub, ana, invite } = await companyOn(t)
  const [bounceKey, downKey] = [randomUUID(), randomUUID()]
  hub.mail.state.mode = 'BOUNCE'
  assert.equal((await invite(ana, INVITEE, 'member', bounceKey)).statusCode, 422)
  hub.mail.state.mode = 'FAIL'
  assert.equal((await invite(ana, 'edu@example.test', 'member', downKey)).statusCode, 502)
  hub.mail.state.mode = 'DELIVER'
  assert.equal((await invite(ana, INVITEE, 'member', bounceKey)).statusCode, 201)
  assert.equal((await invite(ana, 'edu@example.test', 'member', downKey)).statusCode, 201)
  assert.equal((await invite(ana, 'edu@example.test', 'member', downKey)).statusCode, 201)
  assert.deepEqual(
    hub.mail.sent.map((mail) => mail.to),
    [INVITEE, 'edu@example.test'],
  )
})

test('de novo: com outra chave, o anterior fica canceled e um só pending, também com dois juntos', async (t) => {
  const { hub, ana, bruno, invite } = await companyOn(t)
  assert.equal((await invite(ana, INVITEE)).statusCode, 201)
  const again = await invite(ana, INVITEE)
  assert.equal(again.statusCode, 201)
  assert.deepEqual(await rows(hub), [{ status: 'canceled' }, { status: 'pending' }])
  const twice = await Promise.all([invite(ana, INVITEE), invite(bruno, INVITEE)])
  assert.deepEqual(
    twice.map((response) => response.statusCode),
    [201, 201],
  )
  const statuses = (await rows(hub)).map((row) => row.status).sort()
  assert.deepEqual(statuses, ['canceled', 'canceled', 'canceled', 'pending'])
  assert.equal(hub.mail.sent.length, 4)
})

test('de novo: o anterior vencido há 2 dias, ou vencendo agora, 201 e um e-mail novo', async (t) => {
  const { hub, ana, invite } = await companyOn(t)
  for (const age of ["interval '2 days'", "interval '0 seconds'"]) {
    assert.equal((await invite(ana, INVITEE)).statusCode, 201)
    await hub.test.asOwner(
      `update auth.invitation set expires_at = now() - ${age} where status = 'pending'`,
    )
    assert.equal((await invite(ana, INVITEE)).statusCode, 201)
    await hub.test.asOwner(`update auth.invitation set status = 'canceled'`)
  }
  assert.equal(hub.mail.sent.length, 4)
})

test('de novo: o anterior com um id fora de forma no banco, 500 e ele segue pendente, sem e-mail', async (t) => {
  const { hub, ana, companyId, invite } = await companyOn(t)
  await hub.test.asOwner(
    `insert into auth.invitation (id, company_id, email, role, status, expires_at, created_at,
      inviter_id, attempt_key) values ('fora-de-forma', $1, $2, 'member', 'pending',
      now() + interval '1 day', now(), $3, gen_random_uuid()::text)`,
    [companyId, INVITEE, ana.id],
  )
  const refused = await invite(ana, INVITEE)
  assert.deepEqual([refused.statusCode, codeOf(refused)], [500, 'INTERNAL_UNEXPECTED'])
  assert.deepEqual(await rows(hub), [{ status: 'pending' }])
  assert.deepEqual(hub.mail.sent, [])
})

test('de novo: a mesma chave dá o mesmo convite, sem outro e-mail; com outros dados, 409 IDEMPOTENCY_CONFLICT', async (t) => {
  const { hub, ana, invite } = await companyOn(t)
  const key = randomUUID()
  const first = await invite(ana, INVITEE, 'member', key)
  const same = await invite(ana, INVITEE, 'member', key)
  assert.deepEqual([first.statusCode, same.statusCode], [201, 201])
  assert.deepEqual(same.json(), first.json())
  assert.equal(hub.mail.sent.length, 1)
  const other = await invite(ana, INVITEE, 'admin', key)
  assert.deepEqual([other.statusCode, codeOf(other)], [409, 'IDEMPOTENCY_CONFLICT'])
  assert.deepEqual(await rows(hub), [{ status: 'pending' }])
})

test('limite: o 11º convite de uma pessoa em 60 s, 429 INVITATIONS_EXCEEDED; passado o minuto, passa', async (t) => {
  const { hub, ana, invite } = await companyOn(t)
  for (let index = 0; index < 10; index++) {
    assert.equal((await invite(ana, `pessoa${index}@example.test`)).statusCode, 201)
  }
  const eleventh = await invite(ana, INVITEE)
  assert.deepEqual([eleventh.statusCode, codeOf(eleventh)], [429, 'INVITATIONS_EXCEEDED'])
  assert.deepEqual(await rows(hub), [])
  await hub.test.asOwner(`update auth.invitation set created_at = now() - interval '61 seconds'`)
  assert.equal((await invite(ana, INVITEE)).statusCode, 201)
})

test('ritmo entre empresas: o 11º convite em 60 s conta os enviados nas duas empresas da pessoa', async (t) => {
  const { hub, ana, invite } = await companyOn(t)
  const other = await plantCompany(hub.test, ana.id, 'Outra Empresa')
  for (let index = 0; index < 5; index++) {
    assert.equal((await invite(ana, `pessoa${index}@example.test`)).statusCode, 201)
    const elsewhere = { email: `outra${index}@example.test`, role: 'member' }
    assert.equal(
      (await post(hub, ana, `/api/companies/${other}/invitations`, elsewhere)).statusCode,
      201,
    )
  }
  const eleventh = await invite(ana, INVITEE)
  assert.deepEqual([eleventh.statusCode, codeOf(eleventh)], [429, 'INVITATIONS_EXCEEDED'])
  assert.deepEqual(await rows(hub), [])
})

test('limite: com 99 vivos, dois convidantes juntos, um 201 e um 409 INVITATIONS_FULL', async (t) => {
  const { hub, ana, bruno, companyId, invite } = await companyOn(t)
  await seed(hub, companyId, ana.id, 99, true)
  const both = await Promise.all([invite(ana, INVITEE), invite(bruno, 'edu@example.test')])
  const answers = both.map((response) => [response.statusCode, codeOf(response)]).sort()
  assert.deepEqual(answers, [
    [201, undefined],
    [409, 'INVITATIONS_FULL'],
  ])
})

test('limite: com 100 vivos atrás de 100 vencidos, 409 INVITATIONS_FULL; com 99, o centésimo passa', async (t) => {
  const { hub, ana, companyId, invite } = await companyOn(t)
  await seed(hub, companyId, ana.id, 100, false)
  await seed(hub, companyId, ana.id, 99, true)
  assert.equal((await invite(ana, 'edu@example.test')).statusCode, 201)
  const full = await invite(ana, INVITEE)
  assert.deepEqual([full.statusCode, codeOf(full)], [409, 'INVITATIONS_FULL'])
  assert.deepEqual(
    hub.mail.sent.map((mail) => mail.to),
    ['edu@example.test'],
  )
})
