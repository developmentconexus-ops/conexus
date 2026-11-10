import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { COPY_INTERVAL_DEFAULT } from '@conexus/hub-api'
import type { Person } from '../identity/test-hub.ts'
import { call, codeOf, memberOn, personOn, post } from '../identity/test-hub.ts'
import { ATENDENTE } from '../identity/test-roles.ts'
import type { CopiesOn } from './test-copies.ts'
import { copiesOn } from './test-copies.ts'
import { copiesUrl, enabled, firstEnded, listed, runsPage } from './test-routes.ts'

/** Every route of the copies, for a copy id, as method and address. */
function surface(on: CopiesOn, copyId: string) {
  const company = `/api/companies/${on.companyId}`
  const project = `${company}/projects/${on.projectId}/copies`
  return [
    ['GET', copiesUrl(on)],
    ['GET', `${company}/copy-models`],
    ['POST', `${copiesUrl(on)}/${copyId}/pause`],
    ['POST', `${copiesUrl(on)}/${copyId}/resume`],
    ['PATCH', `${copiesUrl(on)}/${copyId}`],
    ['POST', `${copiesUrl(on)}/${copyId}/run`],
    ['GET', `${copiesUrl(on)}/${copyId}/runs`],
    ['GET', project],
    ['PUT', `${project}/${copyId}`],
    ['DELETE', `${project}/${copyId}`],
  ] as const
}

function request(on: CopiesOn, person: Person, method: string, url: string) {
  if (method === 'POST') return post(on.hub, person, url, {})
  if (method === 'PATCH') return call(on.hub, person, 'PATCH', url, { interval: '1h' })
  if (method === 'PUT' || method === 'DELETE') return call(on.hub, person, method, url)
  return call(on.hub, person, 'GET', url)
}

/** Ana's company with an administrator, a developer, a member of an own role and a person of another company. */
async function people(on: CopiesOn) {
  const { hub, companyId } = on
  const admin = await memberOn(
    hub,
    companyId,
    { name: 'Bia Reis', email: 'bia@example.test' },
    'admin',
  )
  const who = { name: 'Davi Costa', email: 'davi@example.test' }
  const developer = await memberOn(hub, companyId, who, 'developer')
  const created = await post(hub, on.ana, `/api/companies/${companyId}/roles`, ATENDENTE)
  assert.equal(created.statusCode, 201)
  const own = { name: 'Enzo Alves', email: 'enzo@example.test' }
  return {
    admin,
    developer,
    own: await memberOn(hub, companyId, own, 'atendente'),
    outsider: await personOn(hub, { name: 'Edu Lima', email: 'edu@example.test' }),
  }
}

test('cópias: quem vê e quem recebe não encontrado', async (t) => {
  const on = await copiesOn(t)
  const others = await people(on)
  const copy = await enabled(on, 'clientes')
  await firstEnded(on, copy.id)
  for (const [who, person] of [
    ['dono', on.ana],
    ['administrador', others.admin],
    ['desenvolvedor', others.developer],
  ] as const) {
    const read = await call(on.hub, person, 'GET', copiesUrl(on))
    assert.equal(read.statusCode, 200, who)
    assert.deepEqual(
      Object(read.json()).copies.map((each: { id: string }) => each.id),
      [copy.id],
      who,
    )
    for (const [method, url] of surface(on, copy.id).filter(([m]) => m === 'GET')) {
      assert.equal((await request(on, person, method, url)).statusCode, 200, `${who} ${url}`)
    }
    assert.equal(
      (await request(on, person, 'POST', `${copiesUrl(on)}/${copy.id}/pause`)).statusCode,
      200,
    )
  }
  for (const [who, person] of [
    ['membro', on.carla],
    ['papel próprio', others.own],
    ['de outra empresa', others.outsider],
  ] as const) {
    for (const copyId of [copy.id, randomUUID()]) {
      for (const [method, url] of surface(on, copyId)) {
        const refused = await request(on, person, method, url)
        const answered = [refused.statusCode, codeOf(refused)]
        assert.deepEqual(answered, [404, 'NOT_FOUND'], `${who}: ${method} ${url}`)
      }
    }
  }
  const unknown = await post(on.hub, on.ana, `${copiesUrl(on)}/${randomUUID()}/pause`, {})
  assert.deepEqual([unknown.statusCode, codeOf(unknown)], [404, 'COPY_NOT_FOUND'])
})

/** 25 more runs of the copy, hour by hour into the past. */
async function plantRuns(on: CopiesOn, copyId: string) {
  for (let at = 1; at <= 25; at += 1) {
    await on.hub.test.asOwner(
      `insert into copies.copy_run (id, company_id, copy_id, started_at, ended_at, outcome, read, written)
       values ($1, $2, $3, now() - $4 * interval '1 hour', now() - $4 * interval '1 hour', 'COMPLETE', $5, $5)`,
      [randomUUID(), on.companyId, copyId, at, at],
    )
  }
}

test('a lista e as rodadas', async (t) => {
  const on = await copiesOn(t)
  const { hub, companyId } = on
  const empty = await call(hub, on.ana, 'GET', copiesUrl(on))
  assert.deepEqual(Object(empty.json()), { copies: [] })

  const made = await enabled(on, 'vendas')
  const first = await firstEnded(on, made.id)
  assert.equal(first.outcome.kind, 'COMPLETE')
  const project = `/api/companies/${companyId}/projects/${on.projectId}/copies/${made.id}`
  assert.equal((await call(hub, on.ana, 'PUT', project)).statusCode, 200)

  const copy = await listed(on, on.ana, made.id)
  const model = hub.connectors.copies.catalog().find((each) => each.model.id === 'vendas')
  assert.ok(model)
  assert.deepEqual(
    [copy.name, copy.label, copy.connection.id, copy.connection.connector, copy.interval],
    ['vendas', model.model.label, on.connectionId, 'sankhya', '30m'],
  )
  assert.ok(copy.connection.name.length > 0)
  assert.ok(copy.schedule.kind === 'ACTIVE' && Date.parse(copy.schedule.nextRunAt) > Date.now())
  assert.deepEqual([copy.run?.id, copy.run?.outcome], [first.id, { kind: 'COMPLETE' }])
  assert.equal(typeof copy.rows, 'number')
  assert.deepEqual(copy.projects, [{ id: on.projectId, name: 'Pedidos' }])
  const { definition } = model.model
  assert.deepEqual(copy.shown, {
    query: definition.source.sql,
    key: definition.key,
    window: definition.window ?? null,
  })

  await plantRuns(on, made.id)
  const page = await runsPage(on, on.ana, made.id)
  assert.deepEqual([page.runs.length, page.copy.id, page.runs[0]?.id], [20, made.id, first.id])
  const starts = page.runs.map((run) => Date.parse(run.startedAt))
  assert.deepEqual(
    starts,
    [...starts].sort((a, b) => b - a),
    'the newest first',
  )
  assert.equal(page.next.kind, 'MORE')
  const token = page.next.kind === 'MORE' ? page.next.page : ''
  const rest = await runsPage(on, on.ana, made.id, token)
  assert.deepEqual([rest.runs.length, rest.next], [6, { kind: 'END' }])
  assert.equal(new Set([...page.runs, ...rest.runs].map((run) => run.id)).size, 26, 'each run once')
  const malformed = await call(
    hub,
    on.ana,
    'GET',
    `${copiesUrl(on)}/${made.id}/runs?page=not-a-page`,
  )
  assert.deepEqual([malformed.statusCode, codeOf(malformed)], [400, 'REQUEST_MALFORMED'])
})

/** The schedule and interval a response of the copy states. */
function stateOf(response: { statusCode: number; body: string; json(): unknown }) {
  assert.equal(response.statusCode, 200, response.body)
  const { schedule, interval } = Object(response.json()).copy
  return [schedule.kind, interval]
}

test('a agenda', async (t) => {
  const on = await copiesOn(t)
  const { hub } = on
  const made = await enabled(on, 'produtos')
  await firstEnded(on, made.id)
  const url = `${copiesUrl(on)}/${made.id}`
  function pause() {
    return post(hub, on.ana, `${url}/pause`, {})
  }
  function resume() {
    return post(hub, on.ana, `${url}/resume`, {})
  }
  function interval(value: unknown) {
    return call(hub, on.ana, 'PATCH', url, { interval: value })
  }

  assert.deepEqual(stateOf(await pause()), ['PAUSED', '30m'])
  assert.deepEqual(stateOf(await pause()), ['PAUSED', '30m'], 'repetir dá o mesmo')
  assert.deepEqual(stateOf(await interval('2h')), ['PAUSED', '2h'], 'a pausada fica pausada')
  assert.deepEqual(stateOf(await interval('2h')), ['PAUSED', '2h'])
  const active = await resume()
  assert.deepEqual(stateOf(active), ['ACTIVE', '2h'])
  assert.ok(Date.parse(Object(active.json()).copy.schedule.nextRunAt) > Date.now())
  assert.deepEqual(stateOf(await resume()), ['ACTIVE', '2h'], 'repetir dá o mesmo')
  assert.deepEqual(stateOf(await interval('15m')), ['ACTIVE', '15m'])
  for (const bad of ['5m', '', 30, null]) {
    const refused = await interval(bad)
    assert.deepEqual([refused.statusCode, codeOf(refused)], [400, 'REQUEST_MALFORMED'], String(bad))
  }
  assert.equal((await listed(on, on.ana, made.id)).interval, '15m', 'nada mudou')

  // Without its schedule the copy is MISSING: no interval, and a pause has nothing to pause.
  async function missing() {
    await hub.mastra.schedules.delete(`schedule_${made.id}`)
    const copy = await listed(on, on.ana, made.id)
    assert.deepEqual([copy.schedule, copy.interval], [{ kind: 'MISSING' }, null])
  }
  await missing()
  assert.deepEqual(stateOf(await pause()), ['MISSING', null])
  assert.deepEqual(stateOf(await resume()), ['ACTIVE', COPY_INTERVAL_DEFAULT])
  assert.equal(COPY_INTERVAL_DEFAULT, '30m')
  await missing()
  assert.deepEqual(stateOf(await interval('6h')), ['ACTIVE', '6h'])
})
