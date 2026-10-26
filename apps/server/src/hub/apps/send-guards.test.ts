import assert from 'node:assert/strict'
import { test } from 'node:test'
import { companyForVersions, folder, listed, plantVersion, send } from './test-versions.ts'

// The send's guards once it holds the claim: whatever stops it fails its version and frees the
// claim at once, and its Worker goes (code C65, card's failure table). Another Hub's send, as in
// a deploy, is planted in the database: one Hub runs one turn per Projeto (data D15).

type Hub = Awaited<ReturnType<typeof companyForVersions>>['hub']

async function versionsOf(hub: Hub) {
  return hub.test.asOwner('select number, state, failure from apps.app_version order by number')
}

async function claimOf(hub: Hub) {
  return hub.test.asOwner('select sending_version_id, claimed_until from apps.app')
}

type Subject = Awaited<ReturnType<typeof companyForVersions>>

/** Another Hub's send of version 9 on Pedidos, holding the claim for `claim`. */
function otherSend(subject: Subject, claim: string) {
  return plantVersion(subject, { id: 'c'.repeat(32), number: 9, state: 'sending', claim })
}

test('envio: um erro no meio (Neon recusa a chave) falha a versão já, solta a trava e tira o Worker', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana } = subject
  t.mock.method(
    hub.neon.neon,
    'ownerConnection',
    async () => {
      throw new Error('Neon refused the key')
    },
    { times: 1 },
  )
  const broken = await send(subject, ana)
  assert.deepEqual(broken.preview, { state: 'failed', number: 1, code: 'APP_VERSION_FAILED' })
  assert.deepEqual(await versionsOf(hub), [
    { number: 1, state: 'failed', failure: 'APP_VERSION_FAILED' },
  ])
  assert.deepEqual(await claimOf(hub), [{ sending_version_id: null, claimed_until: null }])
  assert.deepEqual(hub.cloudflare.workers(), [])
  const next = await send(subject, ana, folder({}, '#6b2fa3'))
  assert.deepEqual(next.preview, { state: 'ready', number: 2 })
})

test('envio: a trava vencida de um envio que morreu é tomada, ele falha, e a versão do Builder vai ao ar', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana } = subject
  await otherSend(subject, '-1 second')
  assert.deepEqual((await send(subject, ana)).preview, { state: 'ready', number: 1 })
  assert.deepEqual(await versionsOf(hub), [{ number: 1, state: 'ready', failure: null }])
  // The dead send failed when its claim was taken, then left with the prune.
  assert.deepEqual(
    (await listed(subject)).map((version) => [version.number, version.live]),
    [[1, true]],
  )
})

test('envio: a trava tomada no meio do envio: ele, ao voltar, para antes do banco e o Worker sai', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana } = subject
  const held = hub.cloudflare.holdUpload()
  const first = send(subject, ana)
  await held.arrived
  await hub.test.asOwner(`update apps.app set sending_version_id = null, claimed_until = null`)
  await otherSend(subject, '1 minute')
  held.release()
  const late = await first
  assert.deepEqual(late.preview, { state: 'failed', number: 1, code: 'APP_VERSION_FAILED' })
  // It stopped once its upload ended: it never opened the database, and its Worker went.
  assert.deepEqual(
    hub.neon.calls.filter((call) => call === 'ownerConnection'),
    [],
  )
  assert.deepEqual(hub.cloudflare.workers(), [])
  assert.deepEqual(await versionsOf(hub), [
    { number: 1, state: 'failed', failure: 'APP_VERSION_FAILED' },
    { number: 9, state: 'sending', failure: null },
  ])
})

test('envio: a trava perdida depois das migrações não põe a versão no ar', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana } = subject
  await send(subject, ana)
  const [live] = await listed(subject)
  const held = hub.postgres.holdMigrate()
  const second = send(subject, ana, folder({}, '#6b2fa3'))
  await held.arrived
  await hub.test.asOwner(`update apps.app set sending_version_id = null, claimed_until = null`)
  await otherSend(subject, '1 minute')
  held.release()
  assert.deepEqual((await second).preview, {
    state: 'failed',
    number: 2,
    code: 'APP_VERSION_FAILED',
  })
  const [app] = await hub.test.asOwner('select live_version_id from apps.app')
  assert.equal(app?.live_version_id, live?.id)
  assert.deepEqual(hub.cloudflare.workers(), [`v-${live?.id}`])
})

test('envio: a empresa marcada para apagar no meio do envio para antes do banco, e o Worker sai', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana } = subject
  const held = hub.cloudflare.holdUpload()
  const sent = send(subject, ana)
  await held.arrived
  await hub.test.asOwner('update auth.company set deleting_since = now()')
  held.release()
  assert.equal((await sent).preview, undefined)
  assert.deepEqual(
    hub.neon.calls.filter((call) => call === 'ownerConnection'),
    [],
  )
  assert.deepEqual(hub.cloudflare.workers(), [])
})
