import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CARLA, codeOf, memberOn } from '../identity/test-hub.ts'
import { companyForVersions, folder, send } from './test-versions.ts'

// The send's guards once it holds the claim: whatever stops it fails its version and frees the
// claim at once, and its Worker goes (code C65, card's failure table).

function versionIdOf(response: { json(): unknown }): string {
  return String(Object(Object(response.json()).version).id)
}

type Hub = Awaited<ReturnType<typeof companyForVersions>>['hub']

async function versionsOf(hub: Hub) {
  return hub.test.asOwner('select number, state, failure from apps.app_version order by number')
}

async function claimOf(hub: Hub) {
  return hub.test.asOwner('select sending_version_id, claimed_until from apps.app')
}

test('envio: um erro no meio (Neon recusa a chave) falha a versão já, solta a trava e tira o Worker', async (t) => {
  const { hub, ana, versions } = await companyForVersions(t)
  t.mock.method(
    hub.neon.neon,
    'ownerConnection',
    async () => {
      throw new Error('Neon refused the key')
    },
    { times: 1 },
  )
  const broken = await send(hub, ana, versions)
  assert.equal(broken.statusCode, 500)
  assert.deepEqual(await versionsOf(hub), [
    { number: 1, state: 'failed', failure: 'APP_VERSION_FAILED' },
  ])
  assert.deepEqual(await claimOf(hub), [{ sending_version_id: null, claimed_until: null }])
  assert.deepEqual(hub.cloudflare.workers(), [])
  assert.equal((await send(hub, ana, versions, folder({}, '#6b2fa3'))).statusCode, 201)
})

test('envio: a trava vencida é tomada, a anterior falha, e ela, ao voltar, para antes do banco', async (t) => {
  const { hub, ana, versions } = await companyForVersions(t)
  const held = hub.cloudflare.holdUpload()
  const first = send(hub, ana, versions)
  await held.arrived
  await hub.test.asOwner(`update apps.app set claimed_until = now() - interval '1 second'`)
  const second = await send(hub, ana, versions, folder({}, '#6b2fa3'))
  assert.equal(second.statusCode, 201)
  // The first failed when its claim was taken, then left with the second's prune.
  assert.deepEqual(await versionsOf(hub), [{ number: 2, state: 'ready', failure: null }])
  held.release()
  const late = await first
  assert.deepEqual([late.statusCode, codeOf(late)], [502, 'APP_VERSION_FAILED'])
  // The first stopped once its upload ended: it never opened the database, and its Worker went.
  const opened = hub.neon.calls.filter((call) => call === 'ownerConnection')
  assert.equal(opened.length, 1)
  assert.deepEqual(hub.cloudflare.workers(), [`v-${versionIdOf(second)}`])
})

test('envio: a trava perdida depois das migrações não põe a versão no ar', async (t) => {
  const { hub, ana, versions } = await companyForVersions(t)
  const held = hub.postgres.holdMigrate()
  const first = send(hub, ana, versions)
  await held.arrived
  await hub.test.asOwner(`update apps.app set claimed_until = now() - interval '1 second'`)
  const second = await send(hub, ana, versions, folder({}, '#6b2fa3'))
  assert.equal(second.statusCode, 201)
  held.release()
  const late = await first
  assert.deepEqual([late.statusCode, codeOf(late)], [502, 'APP_VERSION_FAILED'])
  const [app] = await hub.test.asOwner('select live_version_id from apps.app')
  assert.equal(app?.live_version_id, versionIdOf(second))
  assert.deepEqual(hub.cloudflare.workers(), [`v-${versionIdOf(second)}`])
})

test('envio: quem deixou de ser administrador no meio do envio não põe a versão no ar (S8)', async (t) => {
  const { hub, companyId, versions } = await companyForVersions(t)
  const carla = await memberOn(hub, companyId, CARLA, 'admin')
  const held = hub.cloudflare.holdUpload()
  const sent = send(hub, carla, versions)
  await held.arrived
  await hub.test.asOwner(`update auth.member set role = 'member' where user_id = $1`, [carla.id])
  held.release()
  const answer = await sent
  assert.deepEqual([answer.statusCode, codeOf(answer)], [404, 'NOT_FOUND'])
  assert.deepEqual(await versionsOf(hub), [
    { number: 1, state: 'failed', failure: 'APP_VERSION_FAILED' },
  ])
  assert.deepEqual(await claimOf(hub), [{ sending_version_id: null, claimed_until: null }])
  assert.deepEqual(hub.cloudflare.workers(), [])
})

test('envio: a empresa marcada para apagar no meio do envio para antes do banco, e o Worker sai', async (t) => {
  const { hub, ana, versions } = await companyForVersions(t)
  const held = hub.cloudflare.holdUpload()
  const sent = send(hub, ana, versions)
  await held.arrived
  await hub.test.asOwner('update auth.company set deleting_since = now()')
  held.release()
  const answer = await sent
  assert.deepEqual([answer.statusCode, codeOf(answer)], [404, 'NOT_FOUND'])
  assert.deepEqual(
    hub.neon.calls.filter((call) => call === 'ownerConnection'),
    [],
  )
  assert.deepEqual(hub.cloudflare.workers(), [])
})
