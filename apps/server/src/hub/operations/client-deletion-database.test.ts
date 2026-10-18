import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { Hub, Person } from '../identity/test-hub.ts'
import {
  ANA,
  BRUNO,
  call,
  codeOf,
  hubWithLog,
  hubWithMail,
  personOn,
  plantCompany,
  post,
} from '../identity/test-hub.ts'

const DAVI = { name: 'Davi Costa', email: 'davi@example.test' }
let serial = 0

/** A client whose owner is Davi, with a Project and so a database; Ana is the operator. */
async function clientWithDatabase(hub: Hub, ana: Person, davi: Person, name: string) {
  const companyId = await plantCompany(hub.test, davi.id, name)
  serial += 1
  await hub.test.asOwner(
    `insert into operations.client (company_id, cnpj, legal_name, attempt_key, registered_at)
     values ($1, $2, $3, $1, now())`,
    [companyId, String(serial).padStart(14, '0'), `${name} Ltda`],
  )
  const made = await post(hub, davi, `/api/companies/${companyId}/projects`, { name: 'Pedidos' })
  assert.equal(made.statusCode, 201)
  return { companyId, body: { name, revision: 0 }, url: `/api/clients/${companyId}`, ana, davi }
}

async function world(t: TestContext) {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA)
  const davi = await personOn(hub, DAVI)
  return { hub, ana, davi }
}

function rows(hub: Hub, companyId: string) {
  return hub.test.asOwner(
    `select
      (select count(*)::int from auth.company where id = $1) as companies,
      (select count(*)::int from auth.member where company_id = $1) as members,
      (select count(*)::int from operations.client where company_id = $1) as clients,
      (select count(*)::int from projects.project where company_id = $1) as projects,
      (select count(*)::int from projects.company_database where company_id = $1) as databases`,
    [companyId],
  )
}

const GONE = [{ companies: 0, members: 0, clients: 0, projects: 0, databases: 0 }]

test('com banco: o Neon apaga o id e todo nome exato; saem tudo da 5, os Projetos e o banco; a outra empresa fica', async (t) => {
  const { hub, ana, davi } = await world(t)
  const a = await clientWithDatabase(hub, ana, davi, 'Empresa A')
  const bruno = await personOn(hub, BRUNO)
  const b = await clientWithDatabase(hub, ana, bruno, 'Empresa B')
  hub.neon.plant(`cx-${a.companyId}`)
  assert.equal(hub.neon.projects().length, 3)
  const deleted = await call(hub, ana, 'DELETE', a.url, a.body)
  assert.deepEqual([deleted.statusCode, deleted.body], [204, ''])
  assert.deepEqual(await rows(hub, a.companyId), GONE)
  assert.deepEqual(
    hub.neon.projects().map((project) => project.name),
    [`cx-${b.companyId}`],
  )
  assert.deepEqual((await rows(hub, b.companyId))[0]?.databases, 1)
})

test('log: COMPANY_DATABASE_DELETED leva a empresa e o id do projeto no Neon, um por projeto apagado', async (t) => {
  const hub = await hubWithLog(t)
  const ana = await personOn(hub, ANA)
  const davi = await personOn(hub, DAVI)
  const a = await clientWithDatabase(hub, ana, davi, 'Empresa A')
  const planted = hub.neon.plant(`cx-${a.companyId}`)
  const recorded = hub.neon.projects().map((project) => project.id)
  assert.equal(recorded.length, 2)
  assert.equal((await call(hub, ana, 'DELETE', a.url, a.body)).statusCode, 204)
  const logged = hub.lines.filter((line) => line.message === 'COMPANY_DATABASE_DELETED')
  assert.deepEqual(
    logged
      .map((line) => line.fields)
      .sort((x, y) => String(x.neonProjectId).localeCompare(String(y.neonProjectId))),
    recorded
      .map((neonProjectId) => ({ companyId: a.companyId, neonProjectId }))
      .sort((x, y) => x.neonProjectId.localeCompare(y.neonProjectId)),
  )
  assert.ok(recorded.includes(planted))
})

test('exclusão em andamento: o Neon fora deixa o cliente DELETING, sem acesso, e a mesma rota termina', async (t) => {
  const { hub, ana, davi } = await world(t)
  const a = await clientWithDatabase(hub, ana, davi, 'Empresa A')
  const invitationId = 'i'.repeat(32)
  await hub.test.asOwner(
    `insert into auth.invitation (id, company_id, email, role, status, expires_at, created_at, inviter_id, attempt_key)
     values ($1, $2, 'erin@example.test', 'member', 'pending', now() + interval '1 day', now(), $3, $1)`,
    [invitationId, a.companyId, davi.id],
  )
  hub.neon.script('delete', 'NO_ANSWER', true)
  const pending = await call(hub, ana, 'DELETE', a.url, a.body)
  assert.deepEqual([pending.statusCode, codeOf(pending)], [503, 'CLIENT_DELETION_PENDING'])
  const read = await call(hub, ana, 'GET', a.url)
  assert.deepEqual(Object(read.json()).client.state, { kind: 'DELETING' })
  const company = await call(hub, davi, 'GET', `/api/companies/${a.companyId}`)
  assert.deepEqual([company.statusCode, codeOf(company)], [404, 'NOT_FOUND'])
  const link = await hub.app.inject({ url: `/api/invitations/${invitationId}` })
  assert.deepEqual([link.statusCode, codeOf(link)], [404, 'NOT_FOUND'])
  assert.deepEqual(Object(await call(hub, davi, 'GET', '/api/companies')).json().companies, [])
  const correction = await call(hub, ana, 'PUT', a.url, {
    cnpj: '11.222.333/0001-81',
    legalName: 'Outra',
    name: 'Empresa A',
    revision: 0,
  })
  assert.equal(correction.statusCode, 404)
  assert.equal((await call(hub, ana, 'DELETE', a.url, a.body)).statusCode, 204)
  assert.deepEqual(await rows(hub, a.companyId), GONE)
  assert.deepEqual(hub.neon.projects(), [])
})

test('exclusão em andamento: a recusa do Neon antes da fase 3 e a falha da fase 3 deixam a marca, e a retomada termina', async (t) => {
  const { hub, ana, davi } = await world(t)
  const a = await clientWithDatabase(hub, ana, davi, 'Empresa A')
  hub.neon.script('find', 'REFUSED')
  const refused = await call(hub, ana, 'DELETE', a.url, a.body)
  assert.deepEqual([refused.statusCode, codeOf(refused)], [503, 'CLIENT_DELETION_PENDING'])
  await hub.test.asOwner(`create function public.refuse_write() returns trigger
    language plpgsql as $$ begin raise exception 'refused'; end $$`)
  await hub.test.asOwner(`create trigger refuse_write after delete on auth.company
    for each row execute function public.refuse_write()`)
  const failed = await call(hub, ana, 'DELETE', a.url, a.body)
  assert.equal(failed.statusCode, 500)
  assert.deepEqual(Object(await call(hub, ana, 'GET', a.url).then((r) => r.json())).client.state, {
    kind: 'DELETING',
  })
  assert.equal((await rows(hub, a.companyId))[0]?.companies, 1)
  await hub.test.asOwner(`drop trigger refuse_write on auth.company`)
  assert.equal((await call(hub, ana, 'DELETE', a.url, a.body)).statusCode, 204)
  assert.deepEqual(await rows(hub, a.companyId), GONE)
})

test('reserva viva: o apagar não chama o Neon; vencida, apaga pelo nome', async (t) => {
  const { hub, ana, davi } = await world(t)
  const companyId = await plantCompany(hub.test, davi.id, 'Empresa A')
  await hub.test.asOwner(
    `insert into operations.client (company_id, cnpj, legal_name, attempt_key, registered_at)
     values ($1, '99999999999999', 'A Ltda', $1, now())`,
    [companyId],
  )
  await hub.test.asOwner(
    `insert into projects.company_database (company_id, state, claimed_until)
     values ($1, 'creating', now() + interval '1 minute')`,
    [companyId],
  )
  hub.neon.plant(`cx-${companyId}`)
  const url = `/api/clients/${companyId}`
  const body = { name: 'Empresa A', revision: 0 }
  const live = await call(hub, ana, 'DELETE', url, body)
  assert.deepEqual([live.statusCode, codeOf(live)], [503, 'CLIENT_DELETION_PENDING'])
  assert.ok(!hub.neon.calls.includes('delete'))
  await hub.test.asOwner(
    `update projects.company_database set claimed_until = now() - interval '1 second'`,
  )
  assert.equal((await call(hub, ana, 'DELETE', url, body)).statusCode, 204)
  assert.deepEqual(hub.neon.projects(), [])
  assert.deepEqual(await rows(hub, companyId), GONE)
})

test('apagar contra criar, 20 vezes: nada sobra no Neon nem em projects', async (t) => {
  const { hub, ana } = await world(t)
  for (let round = 0; round < 20; round += 1) {
    const owner = await personOn(hub, { name: `Dono ${round}`, email: `dono${round}@example.test` })
    const companyId = await plantCompany(hub.test, owner.id, `Empresa ${round}`)
    serial += 1
    await hub.test.asOwner(
      `insert into operations.client (company_id, cnpj, legal_name, attempt_key, registered_at)
       values ($1, $2, 'Ltda', $1, now())`,
      [companyId, String(serial).padStart(14, '0')],
    )
    const [created, deleted] = await Promise.all([
      post(hub, owner, `/api/companies/${companyId}/projects`, { name: 'Pedidos' }),
      call(hub, ana, 'DELETE', `/api/clients/${companyId}`, {
        name: `Empresa ${round}`,
        revision: 0,
      }),
    ])
    assert.ok([201, 404].includes(created.statusCode), `${round}: ${created.statusCode}`)
    assert.ok([204, 503].includes(deleted.statusCode), `${round}: ${deleted.statusCode}`)
    if (deleted.statusCode === 503) {
      assert.equal(
        (
          await call(hub, ana, 'DELETE', `/api/clients/${companyId}`, {
            name: `Empresa ${round}`,
            revision: 0,
          })
        ).statusCode,
        204,
      )
    }
    assert.deepEqual(await rows(hub, companyId), GONE, String(round))
  }
  assert.deepEqual(hub.neon.projects(), [])
})
