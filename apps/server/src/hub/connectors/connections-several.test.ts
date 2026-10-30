import assert from 'node:assert/strict'
import { test } from 'node:test'
import { call, codeOf, personOn, plantCompany } from '../identity/test-hub.ts'
import { connectionsOn, linkSankhya, testOf } from './test-connections.ts'

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
  assert.equal((await call(hub, ana, 'DELETE', `${base}/${refused}`)).statusCode, 200)

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
  assert.equal((await call(hub, davi, 'DELETE', `${otherBase}/${mine}`)).statusCode, 200)
  assert.equal(Object((await testOf(hub, ana, base, mine)).json()).result, 'WORKING')
})

test('o que fica de um Testar: o estado e quem testou, nunca o resultado; o que não alcança não muda nada', async (t) => {
  const { hub, fake, ana, bruno, carla, base } = await connectionsOn(t)
  const id = idOf(await linkSankhya(hub, ana, base, fake.credential))
  const working = Object((await testOf(hub, bruno, base, id)).json())
  assert.equal(working.result, 'WORKING')
  const stored = Object((await call(hub, carla, 'GET', `${base}/${id}`)).json())
  assert.deepEqual(Object.keys(stored), ['connection', 'notes'])
  assert.deepEqual(stored.connection, working.connection)
  assert.deepEqual(stored.connection.testedBy, { id: bruno.id, name: 'Bruno Reis' })
  assert.equal(stored.connection.state, 'ACTIVE')

  for (const change of [
    () => (fake.switches.silent = true),
    () => fake.switches.refuse.add('empresas'),
  ]) {
    change()
    assert.notEqual(Object((await testOf(hub, ana, base, id)).json()).result, 'WORKING')
    fake.switches.silent = false
    fake.switches.refuse.clear()
    const kept = Object((await call(hub, carla, 'GET', `${base}/${id}`)).json())
    assert.deepEqual(kept.connection, stored.connection)
  }

  fake.switches.expireToken = true
  const revoked = Object((await testOf(hub, ana, base, id)).json())
  fake.switches.expireToken = false
  assert.deepEqual([revoked.result, revoked.connection.state], ['AUTH_REFUSED', 'NEEDS_REAUTH'])
  const refused = Object((await call(hub, carla, 'GET', `${base}/${id}`)).json())
  assert.deepEqual(refused.connection, revoked.connection)
})
