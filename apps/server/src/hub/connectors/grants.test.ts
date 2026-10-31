import assert from 'node:assert/strict'
import { test } from 'node:test'
import { call, personOn } from '../identity/test-hub.ts'
import { appCalls } from './test-app-calls.ts'
import { linkSankhya, testOf } from './test-connections.ts'

test('liberar: a dona libera e lê a liberação; o membro 404; a segunda Sankhya dá PROJECT_CONNECTION_TAKEN e nada muda; tirar duas vezes dá 204', async (t) => {
  const on = await appCalls(t)
  const first = await on.connect('Matriz', false)
  const second = await on.connect('Filial', false)
  const denied = await call(on.hub, on.carla, 'PUT', on.routes.grant(first))
  assert.equal(denied.statusCode, 404)
  const granted = await call(on.hub, on.ana, 'PUT', on.routes.grant(first))
  assert.equal(granted.statusCode, 200)
  assert.equal(Object(granted.json()).grant.by, 'Ana Lima')
  const again = await call(on.hub, on.ana, 'PUT', on.routes.grant(first))
  assert.deepEqual(again.json(), granted.json())
  const taken = await call(on.hub, on.ana, 'PUT', on.routes.grant(second))
  assert.equal(taken.statusCode, 409)
  assert.equal(Object(taken.json()).code, 'PROJECT_CONNECTION_TAKEN')
  const rows = await on.hub.test.asOwner('select connection_id from connectors.project_connection')
  assert.deepEqual(rows, [{ connection_id: first }])
  for (const _ of [1, 2])
    assert.equal((await call(on.hub, on.ana, 'DELETE', on.routes.grant(first))).statusCode, 204)
  assert.equal((await call(on.hub, on.carla, 'DELETE', on.routes.grant(first))).statusCode, 404)
  assert.deepEqual(await on.hub.test.asOwner('select 1 from connectors.project_connection'), [])
})

test('a lista: o membro lê cada conector ligado com o perProject e a liberação (quem, quando) ou null', async (t) => {
  const on = await appCalls(t)
  const matriz = await on.connect('Matriz')
  const filial = await on.connect('Filial', false)
  const listed = await call(
    on.hub,
    on.carla,
    'GET',
    `/api/companies/${on.companyId}/projects/${on.projectId}/connections`,
  )
  assert.equal(listed.statusCode, 200)
  const [sankhya] = Object(listed.json()).connectors
  assert.equal(sankhya.connector.id, 'sankhya')
  assert.equal(sankhya.perProject, 'one')
  const byId = new Map(sankhya.connections.map((c: { id: string }) => [c.id, c]))
  assert.equal(Object(byId.get(matriz)).grant.by, 'Ana Lima')
  assert.equal(Object(byId.get(filial)).grant, null)
  const other = await call(
    on.hub,
    on.carla,
    'GET',
    `/api/companies/${on.companyId}/projects/00000000000000000000000000/connections`,
  )
  assert.equal(other.statusCode, 404)
  const davi = await personOn(on.hub, { name: 'Davi Souza', email: 'davi@example.test' })
  const foreign = await call(
    on.hub,
    davi,
    'GET',
    `/api/companies/${on.companyId}/projects/${on.projectId}/connections`,
  )
  assert.equal(foreign.statusCode, 404, 'another company reads nothing')
})

test('liberar: uma ligação ainda NEW é recusada com CONNECTION_NOT_TESTED, nada é gravado, e testada ela é liberada e o app lê', async (t) => {
  const on = await appCalls(t)
  const linked = await linkSankhya(
    on.hub,
    on.ana,
    on.routes.connections,
    on.fake.credential,
    undefined,
    'Matriz',
  )
  const id = String(Object(linked.json()).connection.id)
  const refused = await call(on.hub, on.ana, 'PUT', on.routes.grant(id))
  assert.equal(refused.statusCode, 409)
  assert.equal(Object(refused.json()).code, 'CONNECTION_NOT_TESTED')
  assert.deepEqual(await on.hub.test.asOwner('select 1 from connectors.project_connection'), [])
  assert.deepEqual((await on.read()).json(), { kind: 'NOT_GRANTED' })
  assert.equal(
    Object((await testOf(on.hub, on.ana, on.routes.connections, id)).json()).result,
    'WORKING',
  )
  assert.equal((await call(on.hub, on.ana, 'PUT', on.routes.grant(id))).statusCode, 200)
  assert.equal(Object((await on.read()).json()).kind, 'OK')
})

test('liberar: uma ligação que pede para conectar de novo também é recusada', async (t) => {
  const on = await appCalls(t)
  const id = await on.connect('Matriz', false)
  await on.hub.test.asOwner("update connectors.connection set state = 'NEEDS_REAUTH'")
  const refused = await call(on.hub, on.ana, 'PUT', on.routes.grant(id))
  assert.equal(refused.statusCode, 409)
  assert.equal(Object(refused.json()).code, 'CONNECTION_NOT_TESTED')
})
