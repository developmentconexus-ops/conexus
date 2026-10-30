import assert from 'node:assert/strict'
import { test } from 'node:test'
import { call } from '../identity/test-hub.ts'
import { appCalls } from './test-app-calls.ts'

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
