import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CARLA, call, codeOf, personOn, post } from '../identity/test-hub.ts'
import { companyForVersions, folder, listed, send } from './test-versions.ts'

function versionOf(response: { json(): unknown }) {
  return Object(Object(response.json()).version)
}

async function pointers(subject: Awaited<ReturnType<typeof companyForVersions>>) {
  const [row] = await subject.hub.test.asOwner(
    `select v.number as live, p.number as published
       from apps.app a
       left join apps.app_version v on v.id = a.live_version_id
       left join apps.app_version p on p.id = a.published_version_id`,
  )
  return row
}

test('publicar: 200, só o ponteiro publicado muda, e de novo é o mesmo', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana, bruno, versions } = subject
  await send(subject, ana)
  await send(subject, ana, folder({}, '#6b2fa3'))
  const route = `${versions.replace(/\/versions$/, '')}/published-version`
  assert.deepEqual(await pointers(subject), { live: 2, published: null })
  // Any member publishes (C2, E1): Bruno is no owner or administrator.
  const published = await call(hub, bruno, 'PUT', route, { number: 1 })
  assert.equal(published.statusCode, 200, published.body)
  assert.deepEqual([versionOf(published).number, versionOf(published).published], [1, true])
  assert.equal(versionOf(published).live, false)
  const expected = [
    [2, true, false],
    [1, false, true],
  ]
  async function shown() {
    return (await listed(subject)).map((version) => [
      version.number,
      version.live,
      version.published,
    ])
  }
  assert.deepEqual(await shown(), expected)
  assert.deepEqual(await pointers(subject), { live: 2, published: 1 })
  const again = await call(hub, ana, 'PUT', route, { number: 1 })
  assert.equal(again.statusCode, 200, again.body)
  assert.deepEqual(await shown(), expected)
  assert.deepEqual(await pointers(subject), { live: 2, published: 1 })
  // The member lists too (E1).
  const read = await call(hub, bruno, 'GET', versions)
  assert.equal(read.statusCode, 200, read.body)
})

test('publicar: as recusas, e o envio em curso não atrapalha', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana, projects, versions, companyId } = subject
  const one = await send(subject, ana)
  const route = `${versions.replace(/\/versions$/, '')}/published-version`
  // Estoque has versions 1 and 2, and Pedidos only the 1: the 2 is another Projeto's, and no 9 is.
  const estoque = Object((await post(hub, ana, projects, { name: 'Estoque' })).json()).project
  const inEstoque = { projectId: String(estoque.id) }
  await send(subject, ana, folder(), inEstoque)
  await send(subject, ana, folder({}, '#6b2fa3'), inEstoque)
  const refused = [
    await call(hub, ana, 'PUT', route, { number: 9 }),
    await call(hub, ana, 'PUT', route, { number: 2 }),
  ]
  assert.deepEqual(
    refused.map((answer) => [answer.statusCode, codeOf(answer)]),
    Array(2).fill([404, 'APP_VERSION_NOT_FOUND']),
  )
  for (const [state, extra] of [
    ['failed', ", failure = 'APP_VERSION_FAILED'"],
    ['sending', ''],
    ['pruning', ''],
  ] as const) {
    await hub.test.asOwner(
      `update apps.app_version set state = '${state}'${extra} where number = $1
        and project_id = $2`,
      [1, subject.projectId],
    )
    const answer = await call(hub, ana, 'PUT', route, { number: 1 })
    assert.deepEqual([answer.statusCode, codeOf(answer)], [404, 'APP_VERSION_NOT_FOUND'], state)
  }
  await hub.test.asOwner(
    `update apps.app_version set state = 'ready', failure = null where number = 1 and project_id = $1`,
    [subject.projectId],
  )
  // An outsider and a Projeto that does not exist are the same not-found (S10).
  const carla = await personOn(hub, CARLA)
  const outsider = await call(hub, carla, 'PUT', route, { number: 1 })
  assert.deepEqual([outsider.statusCode, codeOf(outsider)], [404, 'NOT_FOUND'])
  const ghost = `/api/companies/${companyId}/projects/${'z'.repeat(32)}/published-version`
  const missing = await call(hub, ana, 'PUT', ghost, { number: 1 })
  assert.deepEqual([missing.statusCode, codeOf(missing)], [404, 'NOT_FOUND'])
  // A send in course, with its claim held for a minute, neither refuses it nor is failed by it.
  const sending = 'c'.repeat(32)
  await hub.test.asOwner(
    `insert into apps.app_version(id, company_id, project_id, number, state, manifest, digest,
       sent_by, attempt_key, created_at)
     select $1, company_id, project_id, 9, 'sending', '{}', repeat('0', 64), 'x', 'k', now()
       from apps.app where project_id = $2`,
    [sending, subject.projectId],
  )
  await hub.test.asOwner(
    `update apps.app set sending_version_id = $1, claimed_until = now() + interval '1 minute'
      where project_id = $2`,
    [sending, subject.projectId],
  )
  const during = await call(hub, ana, 'PUT', route, { number: one.number })
  assert.equal(during.statusCode, 200, during.body)
  const [held] = await hub.test.asOwner(
    'select state from apps.app_version where number = 9 and project_id = $1',
    [subject.projectId],
  )
  assert.deepEqual(held, { state: 'sending' })
})
