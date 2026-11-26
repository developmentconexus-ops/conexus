import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { serveEnvironment, TEST_ORIGIN } from '../../platform/test-database.ts'
import { spawnHub } from '../../platform/test-hub-process.ts'
import type { Person } from '../identity/test-hub.ts'
import {
  BRUNO,
  CARLA,
  call,
  codeOf,
  memberOn,
  PASSWORD,
  plantCompany,
  post,
} from '../identity/test-hub.ts'
import { ATENDENTE } from '../identity/test-roles.ts'
import type { TreatmentOn } from './test-treatment.ts'
import { OF_NOTAS, treatmentOn } from './test-treatment.ts'

function routesOf(base: string, id: string, version: { number: number; hash: string }) {
  const model = `${base}/models/${id}`
  return [
    ['GET', base, undefined],
    ['GET', model, undefined],
    ['POST', `${base}/models`, { name: 'nova', description: '', sql: OF_NOTAS }],
    ['POST', `${model}/versions`, { description: '', sql: OF_NOTAS }],
    ['POST', `${model}/versions/${version.number}/approve`, { hash: version.hash }],
  ] as const
}

function asked(on: TreatmentOn, who: Person, route: ReturnType<typeof routesOf>[number]) {
  const [method, url, body] = route
  return method === 'GET' ? call(on.hub, who, method, url) : post(on.hub, who, url, body)
}

async function without(on: TreatmentOn) {
  const carla = await memberOn(on.hub, on.companyId, CARLA, 'developer')
  const davi = await memberOn(
    on.hub,
    on.companyId,
    { name: 'Davi Costa', email: 'davi@example.test' },
    'member',
  )
  await post(on.hub, on.ana, `/api/companies/${on.companyId}/roles`, ATENDENTE)
  const edu = await memberOn(
    on.hub,
    on.companyId,
    { name: 'Edu Lima', email: 'edu@example.test' },
    'atendente',
  )
  return [carla, davi, edu]
}

test('permissão: o desenvolvedor, o membro e o papel próprio recebem 404 em cada rota', async (t) => {
  const on = await treatmentOn(t)
  const { id, version } = await on.proposed(OF_NOTAS)
  for (const who of await without(on)) {
    for (const route of routesOf(on.base, id, version)) {
      const [method, url] = route
      const refused = await asked(on, who, route)
      assert.deepEqual(
        [refused.statusCode, codeOf(refused)],
        [404, 'NOT_FOUND'],
        `${method} ${url}`,
      )
    }
  }
  assert.deepEqual(await on.saved(), [{ models: 1, versions: 1, runs: 0 }])
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'admin')
  assert.equal((await on.listed(bruno)).tables.length, 3)
  assert.equal((await on.propose(OF_NOTAS, 'do_admin', bruno)).statusCode, 201)
  await on.approved(id, version, bruno)
})

test('permissão: o registro do 404 diz FORBIDDEN em cada rota', async (t) => {
  const on = await treatmentOn(t)
  const { id, version } = await on.proposed(OF_NOTAS)
  await memberOn(on.hub, on.companyId, CARLA, 'developer')
  const environment = serveEnvironment(t, on.hub.test.runtimeUrl)
  const { port, lines, stop } = await spawnHub(t, environment)
  try {
    async function send(method: string, path: string, cookie: string, body?: unknown) {
      return fetch(`http://127.0.0.1:${port}${path}`, {
        method,
        headers: {
          origin: TEST_ORIGIN,
          cookie,
          'cf-connecting-ip': '198.51.100.20',
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(10_000),
      })
    }
    const signedIn = await send('PUT', '/api/sessions/current', '', {
      email: CARLA.email,
      password: PASSWORD,
    })
    const cookie = String(signedIn.headers.get('set-cookie')).split(';')[0] ?? ''
    for (const [method, url, body] of routesOf(on.base, id, version)) {
      assert.equal((await send(method, url, cookie, body)).status, 404, `${method} ${url}`)
    }
  } finally {
    await stop()
  }
  const reasons = lines.filter((line) => line.msg === 'NOT_FOUND').map((line) => line.reason)
  assert.deepEqual(reasons, Array(5).fill('FORBIDDEN'))
})

test('outra empresa: o modelo dela não se lê, não muda e não se liga', async (t) => {
  const on = await treatmentOn(t)
  const other = await plantCompany(on.hub.test, on.ana.id, 'Outra Empresa', 'outra-empresa')
  const id = randomUUID()
  const hash = 'b'.repeat(64)
  await on.rows(
    `insert into treatment.model (id, company_id, name, description, created_by, created_at)
     values ($1, $2, 'venda', '', $3, now())`,
    [id, other, on.ana.id],
  )
  await on.rows(
    `insert into treatment.version (id, model_id, company_id, number, sql, inputs, hash, proposed_by, proposed_at)
     values ($1, $2, $3, 1, 'select 1', '[]', $4, $5, now())`,
    [randomUUID(), id, other, hash, on.ana.id],
  )
  const named = routesOf(on.base, id, { number: 1, hash }).filter(([, url]) => url.includes(id))
  assert.equal(named.length, 3)
  for (const route of named) {
    const [method, url] = route
    const refused = await asked(on, on.ana, route)
    assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'NOT_FOUND'], `${method} ${url}`)
  }
  assert.equal((await on.listed()).tables.filter((table) => table.layer === 'negocio').length, 0)
  const [version] = await on.rows(`select approved_at from treatment.version`)
  assert.deepEqual(version, { approved_at: null })
})
