import assert from 'node:assert/strict'
import { test } from 'node:test'
import { call, codeOf, personOn, plantCompany } from '../identity/test-hub.ts'
import { CHECK_IDS, connectionsOn, linkSankhya, testOf } from './test-connections.ts'

function idOf(linked: { json(): unknown }): string {
  return Object(linked.json()).connection.id
}

test('várias ligações do mesmo conector: a lista as ordena e uma não mexe na outra', async (t) => {
  const { hub, fake, ana, base } = await connectionsOn(t)
  const matriz = idOf(await linkSankhya(hub, ana, base, fake.credential, undefined, 'Matriz'))
  await linkSankhya(hub, ana, base, fake.credential, undefined, 'Filial')
  const wrong = { ...fake.credential, clientSecret: 'errado' }
  const refused = idOf(await linkSankhya(hub, ana, base, wrong, undefined, 'Errada'))

  const listed = Object((await call(hub, ana, 'GET', base)).json()).connections
  assert.deepEqual(
    listed.map((connection: { name: string }) => connection.name),
    ['Matriz', 'Filial', 'Errada'],
  )

  assert.equal(Object((await testOf(hub, ana, base, refused)).json()).result, 'AUTH_REFUSED')
  assert.equal(Object((await testOf(hub, ana, base, matriz)).json()).result, 'WORKING')
  assert.equal((await call(hub, ana, 'DELETE', `${base}/${refused}`)).statusCode, 204)

  const after = Object((await call(hub, ana, 'GET', base)).json()).connections
  assert.deepEqual(
    after.map((connection: { name: string; state: string }) => [connection.name, connection.state]),
    [
      ['Matriz', 'ACTIVE'],
      ['Filial', 'NEW'],
    ],
  )
})

test('o id de outra empresa dá 404 no Testar, no Desligar e no getConnection', async (t) => {
  const { hub, fake, ana, base } = await connectionsOn(t)
  const mine = idOf(await linkSankhya(hub, ana, base, fake.credential))
  const davi = await personOn(hub, { name: 'Davi Souza', email: 'davi@example.test' })
  const other = await plantCompany(hub.test, davi.id)
  const otherBase = `/api/companies/${other}/connections`

  const tested = await testOf(hub, davi, otherBase, mine)
  assert.deepEqual([tested.statusCode, codeOf(tested)], [404, 'CONNECTION_NOT_FOUND'])
  const read = await call(hub, davi, 'GET', `${otherBase}/${mine}`)
  assert.deepEqual([read.statusCode, codeOf(read)], [404, 'CONNECTION_NOT_FOUND'])
  assert.equal((await call(hub, davi, 'DELETE', `${otherBase}/${mine}`)).statusCode, 204)
  assert.equal(Object((await testOf(hub, ana, base, mine)).json()).result, 'WORKING')
})

test('o último teste: guardado no que funciona, apagado no que a chave recusa, intacto no que não alcança', async (t) => {
  const { hub, fake, ana, bruno, carla, base } = await connectionsOn(t)
  const id = idOf(await linkSankhya(hub, ana, base, fake.credential))
  const empty = await call(hub, carla, 'GET', `${base}/${id}`)
  assert.deepEqual(Object(empty.json()).lastTest, null)

  const working = Object((await testOf(hub, bruno, base, id)).json())
  assert.equal(working.result, 'WORKING')
  const stored = Object((await call(hub, carla, 'GET', `${base}/${id}`)).json())
  assert.deepEqual(stored.lastTest, working.checks)
  assert.equal(stored.lastTest.length, CHECK_IDS.length)
  assert.deepEqual(stored.connection.testedBy, { id: bruno.id, name: 'Bruno Reis' })
  assert.equal(stored.connection.state, 'ACTIVE')

  fake.switches.silent = true
  assert.equal(Object((await testOf(hub, ana, base, id)).json()).result, 'UNREACHABLE')
  fake.switches.silent = false
  const kept = Object((await call(hub, carla, 'GET', `${base}/${id}`)).json())
  assert.deepEqual(kept.lastTest, working.checks)

  // A refusal is kept as its status and code, never its body or message.
  fake.switches.refuse.add('empresas')
  assert.equal(Object((await testOf(hub, ana, base, id)).json()).result, 'WORKING')
  fake.switches.refuse.clear()
  const keptOnes = Object((await call(hub, carla, 'GET', `${base}/${id}`)).json()).lastTest
  const refusedItem = keptOnes.find((check: { id: string }) => check.id === 'empresas')
  assert.deepEqual(Object.keys(refusedItem.native).sort(), ['code', 'status'])

  // A stored item that no longer matches the contract reads as no test, never an invented item.
  await hub.test.asOwner(
    `update connectors.connection set last_test = '[{"id":1}]' where id = $1`,
    [id],
  )
  assert.deepEqual(Object((await call(hub, carla, 'GET', `${base}/${id}`)).json()).lastTest, null)
  assert.ok(hub.lines.some((line) => line.message === 'CONNECTION_LAST_TEST_UNREAD'))
  await hub.test.asOwner(`update connectors.connection set last_test = $2::jsonb where id = $1`, [
    id,
    JSON.stringify(working.checks),
  ])

  const wrong = idOf(
    await linkSankhya(
      hub,
      ana,
      base,
      { ...fake.credential, xToken: 'errado' },
      undefined,
      'Errada',
    ),
  )
  assert.equal(Object((await testOf(hub, ana, base, wrong)).json()).result, 'AUTH_REFUSED')
  const refused = Object((await call(hub, carla, 'GET', `${base}/${wrong}`)).json())
  assert.deepEqual([refused.connection.state, refused.lastTest], ['NEEDS_REAUTH', null])
})
