import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import type { CopySummary } from '@conexus/hub-api'
import { CopySummary as CopySummarySchema, listCopyRuns } from '@conexus/hub-api'
import type { Person } from '../identity/test-hub.ts'
import { call, codeOf, memberOn, personOn, post } from '../identity/test-hub.ts'
import { ATENDENTE } from '../identity/test-roles.ts'
import type { CopiesOn } from './test-copies.ts'
import { copiesOn, copiesUrl, SANKHYA_REFUSED } from './test-copies.ts'
import { plantedModel } from './test-planted.ts'

/** Every route of the copies, for a copy id, as method and address. */
function surface(on: CopiesOn, copyId: string) {
  const project = `/api/companies/${on.companyId}/projects/${on.projectId}/copies`
  return [
    ['GET', copiesUrl(on)],
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

function expected(member: boolean, method: string, url: string) {
  if (!member || method !== 'GET') return [404, 'NOT_FOUND']
  if (url.endsWith('/copies') && !url.includes('/projects/')) return [200, undefined]
  if (url.endsWith('/runs')) return [404, 'COPY_NOT_FOUND']
  return [404, 'NOT_FOUND']
}

async function runsPage(on: CopiesOn, person: Person, copyId: string, page?: string) {
  const query = page === undefined ? '' : `?page=${page}`
  const read = await call(on.hub, person, 'GET', `${copiesUrl(on)}/${copyId}/runs${query}`)
  assert.equal(read.statusCode, 200, read.body)
  return listCopyRuns.success.body.parse(read.json())
}

async function listed(on: CopiesOn, person: Person, copyId: string) {
  const read = await call(on.hub, person, 'GET', copiesUrl(on))
  assert.equal(read.statusCode, 200, read.body)
  const copies: CopySummary[] = Object(read.json()).copies.map((each: unknown) =>
    CopySummarySchema.parse(each),
  )
  const found = copies.find((each) => each.id === copyId)
  assert.ok(found, 'the copy is listed')
  return found
}

test('cópias: quem vê e quem recebe não encontrado', async (t) => {
  const on = await copiesOn(t)
  const others = await people(on)
  const copyId = await on.plant('clientes')
  for (const [who, person] of [
    ['dono', on.ana],
    ['administrador', others.admin],
  ] as const) {
    const read = await call(on.hub, person, 'GET', copiesUrl(on))
    assert.equal(read.statusCode, 200, who)
    assert.deepEqual(
      Object(read.json()).copies.map((each: { id: string }) => each.id),
      [copyId],
      who,
    )
    for (const [method, url] of surface(on, copyId).filter(([m]) => m === 'GET')) {
      assert.equal((await request(on, person, method, url)).statusCode, 200, `${who} ${url}`)
    }
  }
  for (const [who, person] of [
    ['membro', on.carla],
    ['desenvolvedor', others.developer],
    ['papel próprio', others.own],
    ['de outra empresa', others.outsider],
  ] as const) {
    const member = who !== 'de outra empresa'
    for (const id of [copyId, randomUUID()]) {
      for (const [method, url] of surface(on, id)) {
        const refused = await request(on, person, method, url)
        const answered = [refused.statusCode, codeOf(refused)]
        assert.deepEqual(answered, expected(member, method, url), `${who}: ${method} ${url}`)
      }
    }
  }
})

test('o que cria cópia saiu', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.plant('vendas')
  const company = `/api/companies/${on.companyId}`
  const gone = [
    ['GET', `${company}/copy-models`],
    ['POST', copiesUrl(on)],
    ['POST', `${company}/copy-proposals/${randomUUID()}/dismiss`],
    ['POST', `${copiesUrl(on)}/${copyId}/pause`],
    ['POST', `${copiesUrl(on)}/${copyId}/resume`],
    ['PATCH', `${copiesUrl(on)}/${copyId}`],
    ['POST', `${copiesUrl(on)}/${copyId}/run`],
    ['DELETE', `${copiesUrl(on)}/${copyId}`],
  ] as const
  for (const [method, url] of gone) {
    const answered = await request(on, on.ana, method, url)
    assert.deepEqual(
      [answered.statusCode, codeOf(answered)],
      [404, 'NOT_FOUND'],
      `${method} ${url}`,
    )
  }
  assert.equal((await listed(on, on.ana, copyId)).name, 'sankhya_vendas', 'the copy stays')
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

test('a lista traz o modo', async (t) => {
  const on = await copiesOn(t)
  const copy = await listed(on, on.ana, await on.plant('vendas', { runs: [] }))
  const { definition } = plantedModel('vendas')
  const days = definition.version === 1 ? definition.window?.days : undefined
  assert.ok(days !== undefined && definition.changedSince !== null)
  assert.deepEqual(copy.mode, { kind: 'WINDOW', days })
})

test('a lista e as rodadas', async (t) => {
  const on = await copiesOn(t)
  const { hub, companyId } = on
  const empty = await call(hub, on.ana, 'GET', copiesUrl(on))
  assert.deepEqual(Object(empty.json()), { copies: [] })

  const copyId = await on.plant('vendas')
  const [first] = (await runsPage(on, on.ana, copyId)).runs
  assert.equal(first?.outcome.kind, 'COMPLETE')
  const project = `/api/companies/${companyId}/projects/${on.projectId}/copies/${copyId}`
  assert.equal((await call(hub, on.ana, 'PUT', project)).statusCode, 200)

  const copy = await listed(on, on.ana, copyId)
  const { label, definition } = plantedModel('vendas')
  assert.ok(definition.version === 1)
  assert.deepEqual(
    [copy.name, copy.label, copy.sources.map((each) => each.connection.id), copy.interval],
    ['sankhya_vendas', label, [on.connectionId], null],
  )
  assert.equal(copy.sources[0]?.connection.connector, 'sankhya')
  assert.ok((copy.sources[0]?.connection.name ?? '').length > 0)
  assert.deepEqual(copy.schedule, { kind: 'MISSING' })
  assert.deepEqual([copy.run?.id, copy.run?.outcome], [first?.id, { kind: 'COMPLETE' }])
  assert.equal(typeof copy.rows, 'number')
  assert.deepEqual(copy.projects, [{ id: on.projectId, name: 'Pedidos' }])
  assert.deepEqual(copy.shown, {
    source: { kind: 'QUERY', query: definition.source.sql },
    key: definition.key,
    changedSince: definition.changedSince,
    window: definition.window ?? null,
    description: definition.description ?? null,
    columns: definition.columns.map((c) => ({
      ...c,
      description: c.description ?? null,
      inactiveSince: null,
    })),
  })

  assert.equal(
    copy.shown.columns.find((column) => column.name === 'NUNOTA')?.description,
    'Número único da nota no Sankhya. É a chave da venda.',
  )
  await plantRuns(on, copyId)
  const page = await runsPage(on, on.ana, copyId)
  assert.deepEqual([page.runs.length, page.copy.id, page.runs[0]?.id], [20, copyId, first?.id])
  const starts = page.runs.map((run) => Date.parse(run.startedAt))
  assert.deepEqual(
    starts,
    [...starts].sort((a, b) => b - a),
    'the newest first',
  )
  assert.equal(page.next.kind, 'MORE')
  const token = page.next.kind === 'MORE' ? page.next.page : ''
  const rest = await runsPage(on, on.ana, copyId, token)
  assert.deepEqual([rest.runs.length, rest.next], [6, { kind: 'END' }])
  assert.equal(new Set([...page.runs, ...rest.runs].map((run) => run.id)).size, 26, 'each run once')
  const malformed = await call(
    hub,
    on.ana,
    'GET',
    `${copiesUrl(on)}/${copyId}/runs?page=not-a-page`,
  )
  assert.deepEqual([malformed.statusCode, codeOf(malformed)], [400, 'REQUEST_MALFORMED'])
})

test('as rodadas dizem o que o sistema disse', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.plant('clientes', {
    runs: [
      { outcome: 'ERROR', reason: 'COPY_SOURCE_REFUSED', system: SANKHYA_REFUSED },
      { outcome: 'ERROR', reason: 'COPY_SOURCE_UNREACHABLE' },
    ],
  })
  const { runs } = await runsPage(on, on.ana, copyId)
  assert.deepEqual(
    runs.map((run) => run.outcome),
    [
      { kind: 'ERROR', code: 'COPY_SOURCE_UNREACHABLE', system: null },
      { kind: 'ERROR', code: 'COPY_SOURCE_REFUSED', system: SANKHYA_REFUSED },
    ],
  )
})

test('as rodadas dizem qual foi inteira', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.plant('produtos', {
    runs: [{ outcome: 'COMPLETE' }, { outcome: 'COMPLETE', whole: true }],
  })
  const { runs } = await runsPage(on, on.ana, copyId)
  assert.deepEqual(
    runs.map((run) => run.whole),
    [true, false],
    'a mais nova, a inteira, vem primeiro',
  )
})
