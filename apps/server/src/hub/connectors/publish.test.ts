import assert from 'node:assert/strict'
import { test } from 'node:test'
import { call, memberOn } from '../identity/test-hub.ts'
import { appCalls } from './test-app-calls.ts'

const DIEGO = { name: 'Diego Alves', email: 'diego@example.test' }

async function published(on: Awaited<ReturnType<typeof appCalls>>) {
  const [row] = await on.hub.test.asOwner('select published_version_id from apps.app')
  return Object(row).published_version_id
}

test('os conectores: Publicar recusa o conector sem liberação e a operação fora do kit, e a versão publicada não muda', async (t) => {
  const on = await appCalls(t, { declared: [{ connector: 'sankhya', operations: ['empresas'] }] })
  await on.hub.test.asOwner('update apps.app set published_version_id = null')
  const route = `/api/companies/${on.companyId}/projects/${on.projectId}/published-version`
  const refused = await call(on.hub, on.ana, 'PUT', route, { number: 1 })
  assert.equal(refused.statusCode, 409)
  assert.equal(Object(refused.json()).code, 'CONNECTOR_NOT_GRANTED')
  assert.equal(await published(on), null)
  const [preview] = await on.hub.test.asOwner(
    'select live_version_id from apps.app where live_version_id is not null',
  )
  assert.notEqual(preview, undefined, 'the Prévia holds the version the Publicar refused')
  await on.connect('Matriz')
  await on.hub.test.asOwner(
    `update apps.app_version set manifest = jsonb_set(manifest, '{connectors}', '[{"connector":"sankhya","operations":["inexistente"]}]')`,
  )
  assert.equal((await call(on.hub, on.ana, 'PUT', route, { number: 1 })).statusCode, 409)
  assert.equal(await published(on), null)
  await on.hub.test.asOwner(
    `update apps.app_version set manifest = jsonb_set(manifest, '{connectors}', '[{"connector":"sankhya","operations":["empresas"]}]')`,
  )
  assert.equal((await call(on.hub, on.ana, 'PUT', route, { number: 1 })).statusCode, 200)
  assert.notEqual(await published(on), null)
})

test('os conectores: uma liberação cuja ligação deixou de estar ACTIVE não conta no Publicar, como não conta na porta do app', async (t) => {
  const on = await appCalls(t)
  await on.connect('Matriz')
  await on.hub.test.asOwner("update connectors.connection set state = 'NEEDS_REAUTH'")
  assert.deepEqual((await on.read()).json(), { kind: 'NOT_GRANTED' })
  await on.hub.test.asOwner('update apps.app set published_version_id = null')
  const route = `/api/companies/${on.companyId}/projects/${on.projectId}/published-version`
  const refused = await call(on.hub, on.ana, 'PUT', route, { number: 1 })
  assert.equal(refused.statusCode, 409)
  assert.equal(Object(refused.json()).code, 'CONNECTOR_NOT_GRANTED')
})

test('tipo que o papel não tem: Publicar recusa o tipo que a versão declara e quem o tem publica', async (t) => {
  const on = await appCalls(t, {
    declared: [{ connector: 'sankhya', operations: ['empresas'], personal: ['contato'] }],
  })
  await on.connect('Matriz')
  await on.hub.test.asOwner('update apps.app set published_version_id = null')
  const company = `/api/companies/${on.companyId}`
  const route = `${company}/projects/${on.projectId}/published-version`
  const dev = await memberOn(on.hub, on.companyId, DIEGO, 'developer')
  const role = { connectors: { sankhya: ['empresas'] } }
  assert.equal(
    (await call(on.hub, on.ana, 'PUT', `${company}/roles/developer`, role)).statusCode,
    200,
  )
  const refused = await call(on.hub, dev, 'PUT', route, { number: 1 })
  assert.equal(refused.statusCode, 409)
  assert.equal(Object(refused.json()).code, 'PERSONAL_NOT_IN_ROLE')
  assert.equal(await published(on), null)
  const given = { ...role, personal: ['contato'] }
  assert.equal(
    (await call(on.hub, on.ana, 'PUT', `${company}/roles/developer`, given)).statusCode,
    200,
  )
  assert.equal((await call(on.hub, dev, 'PUT', route, { number: 1 })).statusCode, 200)
  assert.notEqual(await published(on), null)
})
