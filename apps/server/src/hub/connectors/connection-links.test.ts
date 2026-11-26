import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { queued, TEST_ORIGIN, withOwnerLock } from '../../platform/test-database.ts'
import type { Person } from '../identity/test-hub.ts'
import { post } from '../identity/test-hub.ts'
import type { On } from './test-connection-links.ts'
import {
  ASKED,
  allRowsWith,
  count,
  digestOf,
  failed,
  logged,
  made,
  open,
  rightFields,
  send,
} from './test-connection-links.ts'
import { connectionsOn } from './test-connections.ts'

test('criar o link: o endereço uma vez e o prazo; só o Dono e o Administrador; só por campos', async (t) => {
  const on = await connectionsOn(t)
  const { hub, ana, bruno, carla, companyId } = on
  const url = `/api/companies/${companyId}/connection-links`
  const first = await made(on, ana)
  assert.equal(first.url, `${TEST_ORIGIN}/connection-links/${first.secret}`)
  assert.match(first.secret, /^[A-Za-z0-9_-]{43}$/)
  const [left] = await hub.test.asOwner(
    `select extract(epoch from expires_at - now())::int as seconds,
            abs(extract(epoch from expires_at - $1::timestamptz)) < 0.001 as same from connectors.connection_link where id = $2`,
    [first.expiresAt, first.id],
  )
  assert.ok(Number(Object(left).seconds) > 29 * 60 + 50 && Number(Object(left).seconds) <= 30 * 60)
  assert.equal(Object(left).same, true)
  assert.equal((await made(on, bruno, { name: 'Outra' })).url.length > 0, true)

  const body = {
    connector: 'sankhya',
    name: 'Filial',
    asked: ASKED,
    filled: { clientId: on.fake.credential.clientId },
  }
  assert.deepEqual(failed(await post(hub, carla, url, body)), [404, 'NOT_FOUND'])
  const anonymous = await hub.app.inject({
    method: 'POST',
    url,
    headers: { origin: TEST_ORIGIN },
    payload: body,
  })
  assert.equal(anonymous.statusCode, 401)
  const oauth = { ...body, connector: 'mercado-livre', asked: ['x'], filled: {} }
  assert.deepEqual(failed(await post(hub, ana, url, oauth)), [409, 'LINK_NOT_FOR_SIGN_IN'])
  const unknown = { ...body, connector: 'nao-existe' }
  assert.deepEqual(failed(await post(hub, ana, url, unknown)), [404, 'CONNECTOR_UNKNOWN'])
  const nameless = { ...body, name: '   ' }
  assert.deepEqual(failed(await post(hub, ana, url, nameless)), [422, 'CONNECTION_NAME_INVALID'])
  const invalid = [
    { asked: ['clientSecret'] },
    { filled: { clientId: 'a', xToken: 'b' } },
    { asked: [...ASKED, 'senha'] },
    { asked: ['xToken', 'xToken', 'clientSecret'], filled: {} },
    { filled: { clientId: '   ' } },
    { filled: { clientId: 'x'.repeat(201) } },
    { filled: { clientId: 'a', senha: 'b' } },
  ]
  for (const change of invalid) {
    const sent = await post(hub, ana, url, { ...body, ...change })
    assert.deepEqual(failed(sent), [422, 'CONNECTION_CREDENTIAL_INVALID'], JSON.stringify(change))
  }
  assert.equal(await count(on, 'connection_link'), 2)
  assert.deepEqual(
    logged(on, 'CONNECTION_LINK_CREATED').map((line) => Object.keys(line.fields).sort()),
    [
      ['by', 'companyId', 'linkId'],
      ['by', 'companyId', 'linkId'],
    ],
  )
})

test('abrir o link: sem sessão, quem pediu, o sistema e só os campos pedidos; o que não abre responde 404', async (t) => {
  const on = await connectionsOn(t)
  const link = await made(on, on.ana)
  const opened = await open(on, link.secret)
  assert.equal(opened.statusCode, 200)
  const page = Object(opened.json())
  assert.deepEqual(Object.keys(page).sort(), ['askedBy', 'company', 'fields', 'system'])
  assert.equal(page.askedBy, 'Ana Lima')
  assert.equal(page.company, 'Empresa Teste')
  assert.deepEqual(Object.keys(page.system).sort(), ['logo', 'name'])
  assert.equal(page.system.name, 'Sankhya')
  assert.deepEqual(
    page.fields.map((field: { name: string }) => field.name),
    ASKED,
  )
  assert.ok(on.fake.credential.clientId)
  assert.equal(JSON.stringify(page).includes(on.fake.credential.clientId), false)
  assert.equal(JSON.stringify(page).includes('clientId'), false)

  const refusedPages = [
    await open(on, 'x'.repeat(43)),
    await open(on, `${link.secret.slice(0, 42)}A`),
  ]
  for (const reply of refusedPages) assert.deepEqual(failed(reply), [404, 'NOT_FOUND'])
  assert.deepEqual(failed(await send(on, 'x'.repeat(43), rightFields(on))), [404, 'NOT_FOUND'])
  const expired = await made(on, on.ana, { name: 'Vencido' })
  await on.hub.test.asOwner(
    `update connectors.connection_link set expires_at = now() - interval '1 second' where id = $1`,
    [expired.id],
  )
  assert.deepEqual(failed(await send(on, expired.secret, rightFields(on))), [404, 'NOT_FOUND'])
  assert.equal(await count(on, 'connection'), 0)
  const expiredPage = await open(on, expired.secret)
  assert.deepEqual(failed(expiredPage), [404, 'NOT_FOUND'])
  for (const reply of [...refusedPages, expiredPage])
    assert.equal(reply.body.includes('Empresa Teste'), false)

  const refusals = logged(on, 'CONNECTION_LINK_REFUSED')
  assert.equal(refusals.length, 5)
  assert.deepEqual(
    refusals.map((line) => line.fields.reason),
    Array(5).fill('NOT_LIVE'),
  )
  assert.equal(JSON.stringify(on.hub.lines).includes('Empresa Teste'), false)
  assert.equal(JSON.stringify(on.hub.lines).includes(expired.secret), false)
  assert.equal(JSON.stringify(on.hub.lines).includes('x'.repeat(43)), false)
})

test('um link que vence entre a leitura e a trava não liga nada', async (t) => {
  const on = await connectionsOn(t)
  const link = await made(on, on.ana)
  const lock = `select pg_advisory_xact_lock(hashtextextended($1, 0))`
  const key = [`conexus.connection:${on.companyId}:${link.id}`]
  await withOwnerLock(on.hub.test, lock, key, async (release) => {
    const sending = send(on, link.secret, rightFields(on))
    await queued(on.hub.test, 1, sending)
    await on.hub.test.asOwner(
      `update connectors.connection_link set expires_at = now() - interval '1 second' where id = $1`,
      [link.id],
    )
    await release()
    assert.deepEqual(failed(await sending), [404, 'NOT_FOUND'])
  })
  assert.equal(await count(on, 'connection'), 0)
  const [refusal] = logged(on, 'CONNECTION_LINK_REFUSED')
  assert.deepEqual(refusal?.fields, { reason: 'NOT_LIVE', linkId: link.id })
})

test('o segredo fica fora: o banco guarda o resumo, e nem o banco nem o registro têm o segredo', async (t) => {
  const on = await connectionsOn(t)
  const link = await made(on, on.ana)
  await open(on, link.secret)
  await send(on, link.secret, { clientSecret: 'errado', xToken: on.fake.credential.xToken })
  await send(on, link.secret, rightFields(on))
  const second = await made(on, on.ana, { name: 'Segunda' })
  await open(on, second.secret)
  const [kept] = await on.hub.test.asOwner(
    'select secret_hash from connectors.connection_link where id = $1',
    [second.id],
  )
  assert.equal(Object(kept).secret_hash, digestOf(second.secret))
  for (const secret of [link.secret, second.secret]) {
    assert.deepEqual(await allRowsWith(on, secret), [])
    assert.equal(JSON.stringify(on.hub.lines).includes(secret), false)
  }
  const values = [on.fake.credential.clientId, on.fake.credential.clientSecret]
  for (const value of values) {
    assert.ok(value)
    assert.deepEqual(await allRowsWith(on, value), [])
    assert.equal(JSON.stringify(on.hub.lines).includes(value), false)
  }
})

test('enviar pelo link: junta os campos, liga em nome de quem pediu e testa uma vez; a recusa deixa o link valer', async (t) => {
  const on = await connectionsOn(t)
  const { hub, ana, bruno } = on
  const link = await made(on, bruno)
  const wrong = { clientSecret: 'segredo-errado', xToken: on.fake.credential.xToken }
  const refused = await send(on, link.secret, wrong)
  assert.equal(refused.statusCode, 200)
  const said = Object(refused.json())
  assert.equal(said.result, 'AUTH_REFUSED')
  assert.equal(said.native.status, 401)
  assert.equal(said.native.code, 'GTW2510')
  assert.equal('connection' in said, false)
  assert.equal(await count(on, 'connection'), 0)
  assert.equal(await count(on, 'connection_link'), 1)

  const incomplete = await send(on, link.secret, { clientSecret: wrong.clientSecret })
  assert.deepEqual(failed(incomplete), [422, 'CONNECTION_CREDENTIAL_INVALID'])
  const extra = await send(on, link.secret, { ...rightFields(on), clientId: 'outro' })
  assert.deepEqual(failed(extra), [422, 'CONNECTION_CREDENTIAL_INVALID'])
  const blank = await send(on, link.secret, { ...rightFields(on), xToken: '  ' })
  assert.deepEqual(failed(blank), [422, 'CONNECTION_CREDENTIAL_INVALID'])
  assert.equal(await count(on, 'connection'), 0)

  const linked = await send(on, link.secret, rightFields(on))
  assert.deepEqual(linked.json(), { result: 'WORKING' })
  const rows = await hub.test.asOwner(
    `select name, state, linked_by, tested_by, attempt_key, connector_id from connectors.connection`,
  )
  assert.deepEqual(rows, [
    {
      ...{ name: 'Filial', state: 'ACTIVE', linked_by: bruno.id, tested_by: bruno.id },
      ...{ attempt_key: link.id, connector_id: 'sankhya' },
    },
  ])
  assert.equal(await count(on, 'connection_link'), 0)
  const listed = Object(
    (await hub.app.inject({ method: 'GET', url: on.base, headers: { cookie: ana.cookie } })).json(),
  )
  assert.equal(listed.connections[0].linkedBy.name, 'Bruno Reis')

  assert.deepEqual(failed(await send(on, link.secret, rightFields(on))), [404, 'NOT_FOUND'])
  assert.deepEqual(failed(await open(on, link.secret)), [404, 'NOT_FOUND'])
  const answered = logged(on, 'CONNECTION_LINK_ANSWERED').map((line) => line.fields.result)
  assert.deepEqual(answered, ['AUTH_REFUSED', 'WORKING'])
  assert.ok(on.fake.credential.clientSecret)
  assert.equal(JSON.stringify(on.hub.lines).includes(on.fake.credential.clientSecret), false)
  assert.equal(logged(on, 'CONNECTION_LINK_REFUSED').length, 2)

  const taken = await made(on, ana)
  assert.deepEqual(failed(await send(on, taken.secret, rightFields(on))), [
    409,
    'CONNECTION_NAME_TAKEN',
  ])
  assert.equal(await count(on, 'connection'), 1)
  assert.equal(await count(on, 'connection_link'), 1)
})

test('enviar pelo link: um teste que lança tira a ligação e deixa o link valer', async (t) => {
  const on = await connectionsOn(t)
  const link = await made(on, on.ana)
  await on.hub.test.asOwner(`
    create function connectors.refuse_test() returns trigger language plpgsql as
      $$ begin raise exception 'recusado pelo teste'; end $$;
    create trigger refuse_test before update on connectors.connection
      for each row execute function connectors.refuse_test()`)
  const broken = await send(on, link.secret, rightFields(on))
  assert.equal(broken.statusCode >= 500, true)
  assert.equal(await count(on, 'connection'), 0)
  assert.equal(await count(on, 'connection_link'), 1)
  assert.equal(logged(on, 'CONNECTION_LINK_UNDONE').length, 1)
  assert.equal(logged(on, 'CONNECTION_LINK_ANSWERED').length, 0)

  await on.hub.test.asOwner('drop trigger refuse_test on connectors.connection')
  const again = await send(on, link.secret, rightFields(on))
  assert.deepEqual(again.json(), { result: 'WORKING' })
  assert.equal(await count(on, 'connection'), 1)
})

test('dois envios: ao mesmo tempo criam uma ligação só', async (t) => {
  const on = await connectionsOn(t)
  const link = await made(on, on.ana)
  const both = await Promise.all([
    send(on, link.secret, rightFields(on)),
    send(on, link.secret, rightFields(on)),
  ])
  assert.deepEqual(both.map((reply) => reply.statusCode).sort(), [200, 404])
  assert.equal(await count(on, 'connection'), 1)
  assert.equal(await count(on, 'connection_link'), 0)
  assert.equal(logged(on, 'CONNECTION_LINK_ANSWERED').length, 1)
})

test('as tentativas: o mesmo endereço além do limite recebe 429, na leitura e no envio', async (t) => {
  const on = await connectionsOn(t)
  const gone = 'x'.repeat(43)
  const address = '198.51.100.77'
  for (let attempt = 1; attempt <= 10; attempt++) {
    const reply =
      attempt % 2 === 0 ? await send(on, gone, {}, address) : await open(on, gone, address)
    assert.deepEqual(failed(reply), [404, 'NOT_FOUND'])
  }
  assert.deepEqual(failed(await open(on, gone, address)), [429, 'SIGN_IN_ATTEMPTS_EXCEEDED'])
  assert.deepEqual(failed(await send(on, gone, {}, address)), [429, 'SIGN_IN_ATTEMPTS_EXCEEDED'])
  assert.deepEqual(failed(await open(on, gone, '198.51.100.78')), [404, 'NOT_FOUND'])
  assert.equal(logged(on, 'CONNECTION_LINK_REFUSED').length, 11)
})

async function leftAfter(t: TestContext, change: (on: On, who: Person) => Promise<void>) {
  const on = await connectionsOn(t)
  const link = await made(on, on.bruno)
  await change(on, on.bruno)
  return { on, link }
}

test('quem pediu saiu: sem manageConnections ou fora da empresa, o link não abre nem liga', async (t) => {
  const demoted = await leftAfter(t, (on, who) =>
    on.hub.test
      .asOwner(`update auth.member set role = 'member' where user_id = $1`, [who.id])
      .then(() => undefined),
  )
  const removed = await leftAfter(t, (on, who) =>
    on.hub.test
      .asOwner(`delete from auth.member where user_id = $1`, [who.id])
      .then(() => undefined),
  )
  for (const { on, link } of [demoted, removed]) {
    assert.deepEqual(failed(await send(on, link.secret, rightFields(on))), [404, 'NOT_FOUND'])
    const page = await open(on, link.secret)
    assert.deepEqual(failed(page), [404, 'NOT_FOUND'])
    assert.equal(page.body.includes('Empresa Teste'), false)
    assert.equal(await count(on, 'connection'), 0)
    const reasons = logged(on, 'CONNECTION_LINK_REFUSED').map((line) => line.fields.reason)
    assert.deepEqual(reasons, ['ASKER_LOST', 'ASKER_LOST'])
    assert.equal(logged(on, 'CONNECTION_LINK_ANSWERED').length, 0)
  }
})
