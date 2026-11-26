import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { CompanyId, ConversationId, NetworkDomain, PersonId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import { call, hubOn, personOn, plantCompany } from '../../hub/identity/test-hub.ts'
import { clientOn } from '../../hub/lake/test-lake.ts'
import { queued, silent, withOwnerLock } from '../../platform/test-database.ts'
import { createNetwork } from './public.ts'
import { EDU, networkCompany } from './test-network.ts'

const OPERATOR = { name: 'Olga Operadora', email: 'olga@example.test', role: 'admin' }

async function storeOn(t: TestContext) {
  const on = await networkCompany(t)
  const lines: { fields: Record<string, unknown>; message: string }[] = []
  function said(fields: Record<string, unknown>, message: string) {
    lines.push({ fields, message })
  }
  const { store } = createNetwork({
    database: on.hub.test.database,
    identity: on.hub.identity,
    log: { info: said, error: said },
  })
  const companyId = CompanyId.parse(on.companyId)
  function grant(
    scope: 'CONVERSATION' | 'COMPANY',
    person: { id: string },
    conversationId: ConversationId,
    domains: readonly string[],
  ) {
    return store.grant({
      scope,
      companyId,
      conversationId,
      personId: PersonId.parse(person.id),
      domains: domains.map((domain) => NetworkDomain.parse(domain)),
      reason: 'Baixar as fotos',
    })
  }
  function opened(conversationId: ConversationId, company = companyId) {
    return store.opened({ companyId: company, conversationId })
  }
  async function hosts(conversationId: ConversationId, company = companyId) {
    const open = await opened(conversationId, company)
    assert.ok(open.kind === 'LIST')
    return [...open.hosts].sort()
  }
  async function stored() {
    return {
      company: await on.rows(),
      conversation: await on.hub.test.asOwner(
        `select conversation_id, person_id, domain from builder.conversation_network_domain
          order by domain, conversation_id`,
      ),
    }
  }
  return { ...on, store, lines, companyId, grant, opened, hosts, stored }
}

function conversation() {
  return ConversationId.parse(randomUUID())
}

test('a máquina abre a lista da empresa e a da conversa, sem as das outras', async (t) => {
  const on = await storeOn(t)
  const mine = conversation()
  const other = conversation()
  await on.grant('COMPANY', on.ana, mine, ['b.exemplo.com', 'a.exemplo.com'])
  await on.grant('CONVERSATION', on.bruno, mine, ['c.exemplo.com', 'a.exemplo.com'])
  await on.grant('CONVERSATION', on.bruno, mine, ['c.exemplo.com'])
  await on.grant('CONVERSATION', on.ana, other, ['d.exemplo.com'])

  assert.deepEqual(await on.hosts(mine), ['a.exemplo.com', 'b.exemplo.com', 'c.exemplo.com'])
  assert.deepEqual(await on.hosts(conversation()), ['a.exemplo.com', 'b.exemplo.com'])
  const edu = await personOn(on.hub, EDU)
  const elsewhere = CompanyId.parse(await plantCompany(on.hub.test, edu.id, 'Outra Empresa'))
  assert.deepEqual(await on.hosts(mine, elsewhere), [])
  assert.deepEqual(
    on.lines.map(({ fields, message }) => [message, fields.scope, fields.domains]),
    [
      ['NETWORK_DOMAIN_GRANTED', 'COMPANY', 2],
      ['NETWORK_DOMAIN_GRANTED', 'CONVERSATION', 2],
      ['NETWORK_DOMAIN_GRANTED', 'CONVERSATION', 1],
      ['NETWORK_DOMAIN_GRANTED', 'CONVERSATION', 1],
    ],
  )
  assert.doesNotMatch(JSON.stringify(on.lines), /exemplo\.com/)
})

test('liberar pede o papel de agora: o desenvolvedor só na conversa', async (t) => {
  const on = await storeOn(t)
  const refused = { code: 'NOT_IN_ROLE' }
  await assert.rejects(on.grant('COMPANY', on.carla, conversation(), ['a.exemplo.com']), refused)
  for (const scope of ['CONVERSATION', 'COMPANY'] as const)
    await assert.rejects(on.grant(scope, on.davi, conversation(), ['a.exemplo.com']), refused)
  assert.deepEqual(await on.stored(), { company: [], conversation: [] })
  assert.deepEqual(on.lines, [])

  const mine = conversation()
  await on.grant('CONVERSATION', on.carla, mine, ['b.exemplo.com'])
  await on.grant('CONVERSATION', on.bruno, mine, ['c.exemplo.com'])
  await on.grant('COMPANY', on.bruno, mine, ['d.exemplo.com'])
  await on.grant('COMPANY', on.ana, mine, ['e.exemplo.com'])
  assert.deepEqual(await on.hosts(mine), [
    'b.exemplo.com',
    'c.exemplo.com',
    'd.exemplo.com',
    'e.exemplo.com',
  ])

  await on.hub.test.asOwner(`update auth.member set role = 'member' where user_id = $1`, [
    on.carla.id,
  ])
  await assert.rejects(on.grant('CONVERSATION', on.carla, mine, ['f.exemplo.com']), refused)
  assert.equal((await on.hosts(mine)).length, 4)
})

test('o papel é segurado até gravar: rebaixado durante a liberação, nada se grava', async (t) => {
  const on = await storeOn(t)
  await withOwnerLock(
    on.hub.test,
    `update auth.member set role = 'member' where user_id = $1`,
    [on.carla.id],
    async (release) => {
      const granting = on.grant('CONVERSATION', on.carla, conversation(), ['a.exemplo.com'])
      const refused = assert.rejects(granting, { code: 'NOT_IN_ROLE' })
      await queued(on.hub.test, 1, refused)
      await release()
      await refused
    },
  )
  assert.deepEqual(await on.stored(), { company: [], conversation: [] })
})

test('as políticas de linha: outra empresa não lê, outra pessoa não lê a conversa', async (t) => {
  const on = await storeOn(t)
  await on.grant('COMPANY', on.ana, conversation(), ['a.exemplo.com'])
  await on.grant('CONVERSATION', on.ana, conversation(), ['b.exemplo.com'])
  await on.store.openAll({ companyId: on.companyId, personId: PersonId.parse(on.ana.id) })
  const edu = await personOn(on.hub, EDU)
  const elsewhere = CompanyId.parse(await plantCompany(on.hub.test, edu.id, 'Outra Empresa'))
  function seenBy(companyId: CompanyId, personId: PersonId | null) {
    return on.hub.test.database.read({ kind: 'COMPANY', companyId, personId }, async (tx) => {
      const seen = await tx.execute(
        sql`select (select count(*)::int from builder.company_network_domain) as company,
          (select count(*)::int from builder.conversation_network_domain) as conversation,
          (select count(*)::int from builder.company_network_open) as open`,
      )
      return seen.rows[0]
    })
  }
  const ana = PersonId.parse(on.ana.id)
  assert.deepEqual(await seenBy(on.companyId, ana), { company: 1, conversation: 1, open: 1 })
  assert.deepEqual(await seenBy(on.companyId, PersonId.parse(on.bruno.id)), {
    company: 1,
    conversation: 0,
    open: 1,
  })
  assert.deepEqual(await seenBy(elsewhere, null), { company: 0, conversation: 0, open: 0 })
})

test('com a internet toda a máquina abre qualquer domínio; desligada, volta às listas', async (t) => {
  const on = await storeOn(t)
  const mine = conversation()
  const ana = { companyId: on.companyId, personId: PersonId.parse(on.ana.id) }
  await on.grant('CONVERSATION', on.ana, mine, ['a.exemplo.com'])
  const edu = await personOn(on.hub, EDU)
  const elsewhere = CompanyId.parse(await plantCompany(on.hub.test, edu.id, 'Outra Empresa'))
  const heard: Promise<[CompanyId, string]>[] = []
  on.store.onRemoved((companyId) => {
    heard.push(on.opened(mine).then(({ kind }) => [companyId, kind]))
  })

  await on.store.openAll(ana)
  assert.deepEqual(await on.opened(mine), { kind: 'ALL' })
  assert.deepEqual(await on.opened(conversation()), { kind: 'ALL' })
  assert.deepEqual(await on.hosts(mine, elsewhere), [])
  assert.deepEqual(heard, [])

  const bruno = { companyId: on.companyId, personId: PersonId.parse(on.bruno.id) }
  await assert.rejects(on.store.closeAll(bruno), { code: 'NOT_IN_ROLE' })
  assert.deepEqual(await on.opened(mine), { kind: 'ALL' })
  await on.store.closeAll(ana)
  await on.store.closeAll(ana)
  assert.deepEqual(await on.hosts(mine), ['a.exemplo.com'])
  assert.deepEqual(await Promise.all(heard), [
    [on.companyId, 'LIST'],
    [on.companyId, 'LIST'],
  ])
})

test('esquecer a conversa apaga as linhas dela, e só as dela', async (t) => {
  const on = await storeOn(t)
  const mine = conversation()
  const other = conversation()
  await on.grant('COMPANY', on.ana, mine, ['a.exemplo.com'])
  await on.grant('CONVERSATION', on.ana, mine, ['b.exemplo.com'])
  await on.grant('CONVERSATION', on.ana, other, ['c.exemplo.com'])
  const edu = await personOn(on.hub, EDU)
  const elsewhere = CompanyId.parse(await plantCompany(on.hub.test, edu.id, 'Outra Empresa'))
  await on.store.forget({ companyId: elsewhere, conversationId: mine })
  assert.equal((await on.hosts(mine)).length, 2)

  await on.store.forget({ companyId: on.companyId, conversationId: mine })
  await on.store.forget({ companyId: on.companyId, conversationId: mine })
  assert.deepEqual(await on.hosts(mine), ['a.exemplo.com'])
  assert.equal((await on.hosts(other)).length, 2)
})

test('quem ouve a remoção recebe a empresa, depois de gravada, até parar de ouvir', async (t) => {
  const on = await storeOn(t)
  const ana = { companyId: on.companyId, personId: PersonId.parse(on.ana.id) }
  const [one, two] = await Promise.all(
    ['a.exemplo.com', 'b.exemplo.com'].map((domain) =>
      on.store.add(ana, { domain: NetworkDomain.parse(domain), reason: 'Ler' }),
    ),
  )
  assert.ok(one !== undefined && two !== undefined)
  const heard: Promise<[CompanyId, number]>[] = []
  const stop = on.store.onRemoved((companyId) => {
    heard.push(on.rows().then((rows) => [companyId, rows.length]))
  })
  const davi = { companyId: on.companyId, personId: PersonId.parse(on.davi.id) }
  await assert.rejects(on.store.remove(davi, one.id), { code: 'NOT_IN_ROLE' })
  await on.store.remove(ana, one.id)
  await assert.rejects(on.store.remove(ana, one.id), { code: 'NOT_FOUND' })
  assert.deepEqual(await Promise.all(heard), [[on.companyId, 1]])
  stop()
  await on.store.remove(ana, two.id)
  assert.equal(heard.length, 1)
})

test('ao apagar: quem liberou', async (t) => {
  const on = await storeOn(t)
  const mine = conversation()
  await on.hub.test.asOwner(`update auth.member set role = 'owner' where user_id = $1`, [
    on.bruno.id,
  ])
  await on.grant('COMPANY', on.bruno, mine, ['a.exemplo.com'])
  await on.grant('CONVERSATION', on.bruno, mine, ['b.exemplo.com'])
  await on.grant('CONVERSATION', on.ana, conversation(), ['c.exemplo.com'])
  await on.store.openAll({ companyId: on.companyId, personId: PersonId.parse(on.bruno.id) })

  const left = await call(
    on.hub,
    on.ana,
    'DELETE',
    `/api/companies/${on.companyId}/members/${on.bruno.id}`,
  )
  assert.equal(left.statusCode, 204, left.body)
  assert.deepEqual(
    (await on.stored()).conversation.map(({ domain }) => domain),
    ['c.exemplo.com'],
  )
  await on.hub.test.asOwner('delete from auth."user" where id = $1', [on.bruno.id])
  assert.deepEqual((await on.stored()).company, [
    { domain: 'a.exemplo.com', reason: 'Baixar as fotos', granted_by: null },
  ])
  const listed = await call(on.hub, on.ana, 'GET', on.path)
  assert.equal(Object(listed.json()).domains[0].grantedBy, null, listed.body)
  assert.deepEqual(
    await on.hub.test.asOwner('select opened_by from builder.company_network_open'),
    [{ opened_by: null }],
  )
  const switched = await call(on.hub, on.ana, 'GET', on.openAllPath)
  assert.equal(Object(switched.json()).open.openedBy, null, switched.body)
})

test('ao apagar: a empresa leva as duas listas e a internet toda', async (t) => {
  const hub = await hubOn(t)
  const operator = await personOn(hub, OPERATOR)
  const owner = await personOn(hub, EDU)
  const client = await clientOn(hub, owner, 'Cliente')
  const { companyId } = client
  const { store } = createNetwork({
    database: hub.test.database,
    identity: hub.identity,
    log: silent,
  })
  const conversationId = conversation()
  for (const [scope, domain] of [
    ['COMPANY', 'a.exemplo.com'],
    ['CONVERSATION', 'b.exemplo.com'],
  ] as const)
    await store.grant({
      scope,
      companyId,
      conversationId,
      personId: PersonId.parse(owner.id),
      domains: [NetworkDomain.parse(domain)],
      reason: 'Baixar as fotos',
    })
  const listed = await store.opened({ companyId, conversationId })
  assert.equal(listed.kind === 'LIST' && listed.hosts.length, 2)
  await store.openAll({ companyId, personId: PersonId.parse(owner.id) })

  const gone = await call(hub, operator, 'DELETE', `/api/clients/${companyId}`, {
    name: client.name,
    revision: 0,
  })
  assert.equal(gone.statusCode, 204, gone.body)
  const [left] = await hub.test.asOwner(
    `select (select count(*)::int from builder.company_network_domain) as company,
            (select count(*)::int from builder.conversation_network_domain) as conversation,
            (select count(*)::int from builder.company_network_open) as open`,
  )
  assert.deepEqual(left, { company: 0, conversation: 0, open: 0 })
})
