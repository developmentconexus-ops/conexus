import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { CompanyId, ConversationId, NetworkDomain, PersonId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import { call, hubOn, personOn, plantCompany } from '../../hub/identity/test-hub.ts'
import { clientOn } from '../../hub/lake/test-lake.ts'
import { silent } from '../../platform/test-database.ts'
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
  const opened = (conversationId: ConversationId, company = companyId) =>
    store.opened({ companyId: company, conversationId })
  const stored = async () => ({
    company: await on.rows(),
    conversation: await on.hub.test.asOwner(
      `select conversation_id, person_id, domain from builder.conversation_network_domain
        order by domain, conversation_id`,
    ),
  })
  return { ...on, store, lines, companyId, grant, opened, stored }
}

const conversation = () => ConversationId.parse(randomUUID())

test('a máquina abre a lista da empresa e a da conversa, sem as das outras', async (t) => {
  const on = await storeOn(t)
  const mine = conversation()
  const other = conversation()
  await on.grant('COMPANY', on.ana, mine, ['b.exemplo.com', 'a.exemplo.com'])
  await on.grant('CONVERSATION', on.bruno, mine, ['c.exemplo.com', 'a.exemplo.com'])
  await on.grant('CONVERSATION', on.bruno, mine, ['c.exemplo.com'])
  await on.grant('CONVERSATION', on.ana, other, ['d.exemplo.com'])

  assert.deepEqual([...(await on.opened(mine))].sort(), [
    'a.exemplo.com',
    'b.exemplo.com',
    'c.exemplo.com',
  ])
  assert.deepEqual([...(await on.opened(conversation()))].sort(), [
    'a.exemplo.com',
    'b.exemplo.com',
  ])
  const edu = await personOn(on.hub, EDU)
  const elsewhere = CompanyId.parse(await plantCompany(on.hub.test, edu.id, 'Outra Empresa'))
  assert.deepEqual(await on.opened(mine, elsewhere), [])
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

test('liberar pede o papel de agora, nos dois alcances', async (t) => {
  const on = await storeOn(t)
  for (const scope of ['CONVERSATION', 'COMPANY'] as const)
    for (const person of [on.carla, on.davi])
      await assert.rejects(on.grant(scope, person, conversation(), ['a.exemplo.com']), {
        code: 'NOT_IN_ROLE',
      })
  await on.hub.test.asOwner(`update auth.member set role = 'member' where user_id = $1`, [
    on.bruno.id,
  ])
  await assert.rejects(on.grant('CONVERSATION', on.bruno, conversation(), ['a.exemplo.com']), {
    code: 'NOT_IN_ROLE',
  })
  assert.deepEqual(await on.stored(), { company: [], conversation: [] })
  assert.deepEqual(on.lines, [])
})

test('as políticas de linha: outra empresa não lê, outra pessoa não lê a conversa', async (t) => {
  const on = await storeOn(t)
  await on.grant('COMPANY', on.ana, conversation(), ['a.exemplo.com'])
  await on.grant('CONVERSATION', on.ana, conversation(), ['b.exemplo.com'])
  const edu = await personOn(on.hub, EDU)
  const elsewhere = CompanyId.parse(await plantCompany(on.hub.test, edu.id, 'Outra Empresa'))
  function seenBy(companyId: CompanyId, personId: PersonId | null) {
    return on.hub.test.database.read({ kind: 'COMPANY', companyId, personId }, async (tx) => {
      const seen = await tx.execute(
        sql`select (select count(*)::int from builder.company_network_domain) as company,
          (select count(*)::int from builder.conversation_network_domain) as conversation`,
      )
      return seen.rows[0]
    })
  }
  const ana = PersonId.parse(on.ana.id)
  assert.deepEqual(await seenBy(on.companyId, ana), { company: 1, conversation: 1 })
  assert.deepEqual(await seenBy(on.companyId, PersonId.parse(on.bruno.id)), {
    company: 1,
    conversation: 0,
  })
  assert.deepEqual(await seenBy(elsewhere, null), { company: 0, conversation: 0 })
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
  assert.equal((await on.opened(mine)).length, 2)

  await on.store.forget({ companyId: on.companyId, conversationId: mine })
  await on.store.forget({ companyId: on.companyId, conversationId: mine })
  assert.deepEqual(await on.opened(mine), ['a.exemplo.com'])
  assert.deepEqual((await on.opened(other)).length, 2)
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
  await on.grant('COMPANY', on.bruno, mine, ['a.exemplo.com'])
  await on.grant('CONVERSATION', on.bruno, mine, ['b.exemplo.com'])
  await on.grant('CONVERSATION', on.ana, conversation(), ['c.exemplo.com'])

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
})

test('ao apagar: a empresa leva as duas listas', async (t) => {
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
  assert.equal((await store.opened({ companyId, conversationId })).length, 2)

  const gone = await call(hub, operator, 'DELETE', `/api/clients/${companyId}`, {
    name: client.name,
    revision: 0,
  })
  assert.equal(gone.statusCode, 204, gone.body)
  const [left] = await hub.test.asOwner(
    `select (select count(*)::int from builder.company_network_domain) as company,
            (select count(*)::int from builder.conversation_network_domain) as conversation`,
  )
  assert.deepEqual(left, { company: 0, conversation: 0 })
})
