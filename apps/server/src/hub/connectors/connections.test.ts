import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { setTimeout } from 'node:timers/promises'
import { sankhyaFake } from '@conexus/connectors'
import { serveEnvironment, TEST_ORIGIN } from '../../platform/test-database.ts'
import { spawnHub } from '../../platform/test-hub-process.ts'
import {
  ANA_OWNER,
  call,
  codeOf,
  hubWithMail,
  PASSWORD,
  personOn,
  plantCompany,
} from '../identity/test-hub.ts'
import {
  ALL_READS,
  connectionsOn,
  linkSankhya,
  outcomes,
  reads,
  testOf,
} from './test-connections.ts'

test('ligar: quem pode, e as recusas', async (t) => {
  const { hub, fake, ana, bruno, carla, base } = await connectionsOn(t)
  const key = randomUUID()
  const linked = await linkSankhya(hub, bruno, base, fake.credential, key)
  assert.equal(linked.statusCode, 201)
  const { connection } = Object(linked.json())
  assert.deepEqual(connection, {
    id: connection.id,
    connector: 'sankhya',
    connectorVersion: '1.0.0',
    state: 'NEW',
    linkedBy: { id: bruno.id, name: 'Bruno Reis' },
    linkedAt: connection.linkedAt,
    testedAt: null,
  })
  const again = await linkSankhya(hub, bruno, base, { ...fake.credential }, key)
  assert.equal(again.statusCode, 201)
  assert.equal(Object(again.json()).connection.id, connection.id)
  const other = { ...fake.credential, clientSecret: 'outro-segredo' }
  const conflict = await linkSankhya(hub, bruno, base, other, key)
  assert.deepEqual([conflict.statusCode, codeOf(conflict)], [409, 'IDEMPOTENCY_CONFLICT'])
  const second = await linkSankhya(hub, ana, base, fake.credential)
  assert.deepEqual([second.statusCode, codeOf(second)], [409, 'CONNECTION_EXISTS'])
  const member = await linkSankhya(hub, carla, base, fake.credential)
  assert.deepEqual([member.statusCode, codeOf(member)], [404, 'NOT_FOUND'])
  const none = await hub.app.inject({
    method: 'POST',
    url: base,
    headers: {
      origin: TEST_ORIGIN,
      cookie: ana.cookie,
      'content-type': 'application/json',
      'idempotency-key': randomUUID(),
    },
    payload: JSON.stringify({ connector: 'nenhum', credential: fake.credential }),
  })
  assert.deepEqual([none.statusCode, codeOf(none)], [404, 'CONNECTOR_UNKNOWN'])
  const { xToken: _xToken, ...missing } = fake.credential
  for (const credential of [missing, { ...fake.credential, extra: 'x' }]) {
    const refused = await linkSankhya(hub, ana, base, credential)
    assert.deepEqual([refused.statusCode, codeOf(refused)], [422, 'CONNECTION_CREDENTIAL_INVALID'])
    for (const value of Object.values(fake.credential))
      assert.equal(refused.body.includes(value), false)
  }
  for (const value of Object.values(fake.credential))
    assert.equal(linked.body.includes(value), false)
  const rows = await hub.test.asOwner(`select sealed from connectors.connection`)
  for (const value of Object.values(fake.credential))
    assert.equal(Buffer.from(Object(rows[0]).sealed).includes(value), false)
})

test('testar: cada parte, com a sua resposta', async (t) => {
  const { hub, fake, ana, base } = await connectionsOn(t)
  const { connection } = Object((await linkSankhya(hub, ana, base, fake.credential)).json())
  const working = await testOf(hub, ana, base, connection.id)
  assert.equal(working.statusCode, 200)
  assert.equal(Object(working.json()).result, 'WORKING')
  assert.deepEqual(outcomes(working), ALL_READS)
  const tested = Object(working.json()).connection
  assert.equal(tested.state, 'ACTIVE')
  assert.notEqual(tested.testedAt, null)
  assert.equal(Object(working.json()).checks.length, 25)
  assert.deepEqual(Object(working.json()).checks[10], {
    id: 'pedidos',
    label: 'Pedidos',
    subject: 'Vendas',
    outcome: 'READS',
  })
  assert.equal(Object(working.json()).checks[0].subject, 'Porta de leitura')

  fake.switches.refuse.add('pedidos')
  fake.switches.refuse.add('consultar')
  const refused = await testOf(hub, ana, base, connection.id)
  assert.equal(Object(refused.json()).result, 'WORKING')
  assert.deepEqual(
    outcomes(refused),
    reads({ pedidos: 'REFUSED', consultar: 'REFUSED', impostosDoPedido: 'NOTHING_TO_READ' }),
  )

  fake.switches.refuse.clear()
  fake.switches.malformed = true
  const unreadable = await testOf(hub, ana, base, connection.id)
  assert.equal(Object(unreadable.json()).result, 'WORKING')
  assert.deepEqual(outcomes(unreadable)[2], ['empresas', 'UNREADABLE'])
})

test('testar: chave recusada, fornecedor fora', async (t) => {
  const { hub, fake, ana, carla, base } = await connectionsOn(t)
  const wrong = { ...fake.credential, clientSecret: 'segredo-errado' }
  const { connection } = Object((await linkSankhya(hub, ana, base, wrong)).json())
  const refused = await testOf(hub, ana, base, connection.id)
  assert.equal(refused.statusCode, 200)
  assert.equal(Object(refused.json()).result, 'AUTH_REFUSED')
  assert.equal(Object(refused.json()).connection.state, 'NEEDS_REAUTH')
  assert.notEqual(Object(refused.json()).connection.testedAt, null)
  assert.equal(Object(refused.json()).checks, undefined)
  const member = await testOf(hub, carla, base, connection.id)
  assert.deepEqual([member.statusCode, codeOf(member)], [404, 'NOT_FOUND'])

  await call(hub, ana, 'DELETE', `${base}/${connection.id}`)
  const linked = Object((await linkSankhya(hub, ana, base, fake.credential)).json()).connection
  const first = Object((await testOf(hub, ana, base, linked.id)).json()).connection
  fake.switches.silent = true
  const silent = await testOf(hub, ana, base, linked.id)
  assert.equal(Object(silent.json()).result, 'UNREACHABLE')
  assert.deepEqual(Object(silent.json()).connection, first)
  fake.switches.silent = false

  fake.switches.expireToken = true
  const logins = fake.logins()
  const expired = await testOf(hub, ana, base, linked.id)
  assert.equal(Object(expired.json()).result, 'AUTH_REFUSED')
  assert.equal(fake.logins() - logins, 2)
  assert.equal(Object(expired.json()).connection.state, 'NEEDS_REAUTH')
})

test('testar: o fornecedor fora do ar não muda o estado', async (t) => {
  const { hub, fake, served, ana, base } = await connectionsOn(t)
  const { connection } = Object((await linkSankhya(hub, ana, base, fake.credential)).json())
  await served.close()
  const down = await testOf(hub, ana, base, connection.id)
  assert.equal(down.statusCode, 200)
  assert.deepEqual(Object(down.json()), { result: 'UNREACHABLE', connection })
})

test('testar e desligar juntos; um serviço por token', async (t) => {
  const { hub, fake, ana, base } = await connectionsOn(t)
  const { connection } = Object((await linkSankhya(hub, ana, base, fake.credential)).json())
  const logins = fake.logins()
  const both = await Promise.all([
    testOf(hub, ana, base, connection.id),
    testOf(hub, ana, base, connection.id),
  ])
  assert.equal(fake.logins() - logins, 2)
  for (const each of both) {
    assert.equal(Object(each.json()).result, 'WORKING')
    assert.deepEqual(outcomes(each), ALL_READS)
  }

  const started = fake.logins()
  const testing = testOf(hub, ana, base, connection.id)
  while (fake.logins() === started) await setTimeout(5)
  const removed = await call(hub, ana, 'DELETE', `${base}/${connection.id}`)
  assert.equal(removed.statusCode, 204)
  const gone = await testing
  assert.deepEqual([gone.statusCode, codeOf(gone)], [404, 'CONNECTION_NOT_FOUND'])
  assert.equal(gone.body.includes('checks'), false)
})

test('desligar, e de novo', async (t) => {
  const { hub, fake, ana, carla, base } = await connectionsOn(t)
  const { connection } = Object((await linkSankhya(hub, ana, base, fake.credential)).json())
  const member = await call(hub, carla, 'DELETE', `${base}/${connection.id}`)
  assert.deepEqual([member.statusCode, codeOf(member)], [404, 'NOT_FOUND'])
  for (const _ of [1, 2]) {
    const removed = await call(hub, ana, 'DELETE', `${base}/${connection.id}`)
    assert.equal(removed.statusCode, 204)
  }
  const listed = await call(hub, ana, 'GET', base)
  assert.deepEqual(Object(listed.json()).connections, [])
  const tested = await testOf(hub, ana, base, connection.id)
  assert.deepEqual([tested.statusCode, codeOf(tested)], [404, 'CONNECTION_NOT_FOUND'])
  const relinked = await linkSankhya(hub, ana, base, fake.credential)
  assert.equal(relinked.statusCode, 201)
})

test('a dona de outra empresa não testa nem desliga a ligação de Ana', async (t) => {
  const { hub, fake, ana, base } = await connectionsOn(t)
  const { connection } = Object((await linkSankhya(hub, ana, base, fake.credential)).json())
  const davi = await personOn(hub, { name: 'Davi Souza', email: 'davi@example.test' })
  const own = `/api/companies/${await plantCompany(hub.test, davi.id)}/connections`
  const tested = await testOf(hub, davi, own, connection.id)
  assert.deepEqual([tested.statusCode, codeOf(tested)], [404, 'CONNECTION_NOT_FOUND'])
  assert.equal((await call(hub, davi, 'DELETE', `${own}/${connection.id}`)).statusCode, 204)
  const foreign = await testOf(hub, davi, base, connection.id)
  assert.deepEqual([foreign.statusCode, codeOf(foreign)], [404, 'NOT_FOUND'])
  const removed = await call(hub, davi, 'DELETE', `${base}/${connection.id}`)
  assert.deepEqual([removed.statusCode, codeOf(removed)], [404, 'NOT_FOUND'])
  assert.equal(fake.logins(), 0)
  assert.equal(Object((await testOf(hub, ana, base, connection.id)).json()).result, 'WORKING')
})

test('a lista: o membro lê, nada da credencial sai', async (t) => {
  const { hub, fake, ana, carla, base } = await connectionsOn(t)
  const { connection } = Object((await linkSankhya(hub, ana, base, fake.credential)).json())
  await testOf(hub, ana, base, connection.id)
  const read = await call(hub, carla, 'GET', base)
  assert.equal(read.statusCode, 200)
  const list = Object(read.json())
  assert.deepEqual(list.connectors, [
    {
      id: 'sankhya',
      name: 'Sankhya',
      version: '1.0.0',
      fields: [
        { name: 'clientId', label: 'Client ID', maxLength: 200 },
        { name: 'clientSecret', label: 'Client Secret', maxLength: 200 },
        { name: 'xToken', label: 'X-Token', maxLength: 4096 },
      ],
    },
  ])
  assert.equal(list.mayManage, false)
  assert.equal(list.connections.length, 1)
  assert.equal(list.connections[0].state, 'ACTIVE')
  assert.equal(list.connections[0].linkedBy.name, 'Ana Lima')
  assert.equal(Object((await call(hub, ana, 'GET', base)).json()).mayManage, true)
  for (const value of Object.values(fake.credential)) assert.equal(read.body.includes(value), false)
  const outsider = await personOn(hub, { name: 'Davi Souza', email: 'davi@example.test' })
  const refused = await call(hub, outsider, 'GET', base)
  assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'NOT_FOUND'])
})

test('o Client Secret plantado não sai no log do Hub, na resposta nem na falha', async (t) => {
  const fake = sankhyaFake()
  const served = await fake.serve()
  t.after(() => served.close())
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id)
  const environment = {
    ...serveEnvironment(t, hub.test.runtimeUrl),
    HUB_CONNECTOR_ORIGINS: `sankhya=${served.origin}`,
  }
  const spawned = await spawnHub(t, environment)
  const origin = `http://127.0.0.1:${spawned.port}`
  const connections = `${origin}/api/companies/${companyId}/connections`
  const json = { origin: TEST_ORIGIN, 'content-type': 'application/json' }
  const bodies: string[] = []
  try {
    const signedIn = await fetch(`${origin}/api/sessions/current`, {
      method: 'PUT',
      headers: { ...json, 'cf-connecting-ip': '203.0.113.9' },
      body: JSON.stringify({ email: ANA_OWNER.email, password: PASSWORD }),
    })
    const cookie = (signedIn.headers.get('set-cookie') ?? '').split(';')[0] ?? ''
    async function link(credential: Record<string, string>) {
      const answer = await fetch(connections, {
        method: 'POST',
        headers: { ...json, cookie, 'idempotency-key': randomUUID() },
        body: JSON.stringify({ connector: 'sankhya', credential }),
      })
      bodies.push(await answer.text())
      return answer
    }
    assert.equal((await link(fake.credential)).status, 201)
    const id = Object(JSON.parse(bodies[0] ?? '{}')).connection.id
    const tested = await fetch(`${connections}/${id}/test`, {
      method: 'POST',
      headers: { origin: TEST_ORIGIN, cookie },
    })
    bodies.push(await tested.text())
    assert.equal(tested.status, 200)
    assert.equal((await link({ ...fake.credential, extra: 'x' })).status, 422)
    await hub.test.asOwner(`update connectors.connection set sealed = sealed || '\\x00'::bytea`)
    const sealed = await fetch(`${connections}/${id}/test`, {
      method: 'POST',
      headers: { origin: TEST_ORIGIN, cookie },
    })
    bodies.push(await sealed.text())
    assert.equal(sealed.status, 500)
    bodies.push(await (await fetch(connections, { headers: { cookie } })).text())
  } finally {
    await spawned.stop()
  }
  assert.ok(spawned.lines.some((line) => line.msg === 'CONNECTION_LINKED'))
  assert.ok(spawned.lines.some((line) => line.msg === 'CONNECTION_TESTED'))
  assert.ok(spawned.lines.some((line) => line.msg === 'SEAL_REFUSED'))
  const printed = JSON.stringify([spawned.lines, bodies])
  for (const value of Object.values(fake.credential)) {
    assert.equal(printed.includes(value), false)
    assert.equal(printed.includes(value.slice(5, 18)), false)
  }
  assert.equal(printed.includes('fake-token'), false)
})
