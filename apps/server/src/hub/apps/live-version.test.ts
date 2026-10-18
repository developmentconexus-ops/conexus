import assert from 'node:assert/strict'
import { test } from 'node:test'
import { call, codeOf, post } from '../identity/test-hub.ts'
import { companyForVersions, folder, send } from './test-versions.ts'

function versionOf(response: { json(): unknown }) {
  return Object(Object(response.json()).version)
}

test('voltar: 200 e a checagem seguinte já usa; podada, de outro Projeto e o membro 404; trava viva 409, vencida 200', async (t) => {
  const { hub, ana, bruno, projects, versions } = await companyForVersions(t)
  const one = versionOf(await send(hub, ana, versions))
  const two = versionOf(await send(hub, ana, versions, folder({}, '#6b2fa3')))
  const live = `${versions.replace(/\/versions$/, '')}/live-version`
  const back = await call(hub, ana, 'PUT', live, { versionId: one.id })
  assert.equal(back.statusCode, 200)
  assert.deepEqual([versionOf(back).id, versionOf(back).live], [one.id, true])
  const [app] = await hub.test.asOwner('select live_version_id from apps.app')
  assert.equal(app?.live_version_id, one.id)
  const listed = Object((await call(hub, ana, 'GET', versions)).json()).versions
  assert.deepEqual(
    listed.map((version: { number: number; live: boolean }) => [version.number, version.live]),
    [
      [2, false],
      [1, true],
    ],
  )
  const estoque = Object((await post(hub, ana, projects, { name: 'Estoque' })).json()).project
  const other = versionOf(await send(hub, ana, `${projects}/${estoque.id}/versions`))
  const refused = [
    await call(hub, ana, 'PUT', live, { versionId: other.id }),
    await call(hub, ana, 'PUT', live, { versionId: 'a'.repeat(32) }),
  ]
  assert.deepEqual(
    refused.map((answer) => [answer.statusCode, codeOf(answer)]),
    Array(2).fill([404, 'APP_VERSION_NOT_FOUND']),
  )
  const member = await call(hub, bruno, 'PUT', live, { versionId: two.id })
  assert.deepEqual([member.statusCode, codeOf(member)], [404, 'NOT_FOUND'])
  // A send in course on Pedidos: its version, and the claim it holds for a minute.
  const sending = 'c'.repeat(32)
  await hub.test.asOwner(
    `insert into apps.app_version(id, company_id, project_id, number, state, manifest, digest,
       sent_by, attempt_key, created_at)
     select $1, company_id, project_id, 9, 'sending', '{}', repeat('0', 64), 'x', 'k', now()
       from apps.app where live_version_id = $2`,
    [sending, one.id],
  )
  await hub.test.asOwner(
    `update apps.app set sending_version_id = $1, claimed_until = now() + interval '1 minute'
      where live_version_id = $2`,
    [sending, one.id],
  )
  const held = await call(hub, ana, 'PUT', live, { versionId: two.id })
  assert.deepEqual([held.statusCode, codeOf(held)], [409, 'APP_VERSION_SENDING'])
  await hub.test.asOwner(
    `update apps.app set claimed_until = now() - interval '1 second' where sending_version_id = $1`,
    [sending],
  )
  const expired = await call(hub, ana, 'PUT', live, { versionId: two.id })
  assert.equal(expired.statusCode, 200)
  const [failed] = await hub.test.asOwner(
    'select state, failure from apps.app_version where number = 9',
  )
  assert.deepEqual(failed, { state: 'failed', failure: 'APP_VERSION_FAILED' })
})
