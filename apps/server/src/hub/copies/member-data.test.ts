import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { CopySample, listCopies, listCopyRuns } from '@conexus/hub-api'
import type { Person } from '../identity/test-hub.ts'
import { call, codeOf, memberOn, personOn } from '../identity/test-hub.ts'
import { grantMatriz, proposed } from './test-proposals.ts'
import type { RolesWorld } from './test-readers.ts'
import { copyOf, rolesWorld } from './test-readers.ts'
import { copiesUrl } from './test-routes.ts'

const DAVI = { name: 'Davi Costa', email: 'davi@example.test' }
const EDU = { name: 'Edu Lima', email: 'edu@example.test' }

function get(w: RolesWorld, person: Person, path: string) {
  return call(w.on.hub, person, 'GET', `${copiesUrl(w.on)}${path}`)
}

function problemOf(read: Awaited<ReturnType<typeof call>>) {
  const { traceId: _, ...problem } = Object(read.json())
  return problem
}

async function listedBy(w: RolesWorld, person: Person) {
  const read = await get(w, person, '')
  assert.equal(read.statusCode, 200, read.body)
  return listCopies.success.body.parse(read.json())
}

test('o membro lista só as tabelas do papel dele e nenhuma proposta', async (t) => {
  const w = await rolesWorld(t, 'PLANTED')
  await grantMatriz(w.on)
  await proposed(w.on)
  assert.equal((await listedBy(w, w.on.ana)).proposals.length, 1)
  const carla = await listedBy(w, w.on.carla)
  assert.deepEqual(
    carla.copies.map(({ name }) => name),
    ['sankhya_clientes'],
  )
  assert.deepEqual(carla.proposals, [])
  const models = await call(
    w.on.hub,
    w.on.carla,
    'GET',
    `/api/companies/${w.on.companyId}/copy-models`,
  )
  assert.deepEqual([models.statusCode, codeOf(models)], [404, 'NOT_FOUND'])
})

test('o membro abre as rodadas de uma tabela que o papel lê', async (t) => {
  const w = await rolesWorld(t, 'PLANTED')
  const clientes = copyOf(w.copies, 'sankhya_clientes')
  const read = await get(w, w.on.carla, `/${clientes}/runs`)
  assert.equal(read.statusCode, 200, read.body)
  const page = listCopyRuns.success.body.parse(read.json())
  assert.equal(page.copy.id, clientes)
  assert.ok(page.runs.length > 0)
})

test('o membro abre uma tabela que o papel não lê e recebe 404', async (t) => {
  const w = await rolesWorld(t, 'PLANTED')
  const hidden = await get(w, w.on.carla, `/${copyOf(w.copies, 'sankhya_vendas')}/runs`)
  const missing = await get(w, w.on.carla, `/${randomUUID()}/runs`)
  assert.deepEqual([hidden.statusCode, codeOf(hidden)], [404, 'COPY_NOT_FOUND'])
  assert.deepEqual(problemOf(hidden), problemOf(missing))
})

test('quem não é da empresa recebe 404', async (t) => {
  const w = await rolesWorld(t, 'PLANTED')
  const outsider = await personOn(w.on.hub, EDU)
  for (const path of ['', `/${copyOf(w.copies, 'sankhya_clientes')}/runs`]) {
    const read = await get(w, outsider, path)
    assert.deepEqual([read.statusCode, codeOf(read)], [404, 'NOT_FOUND'], path)
  }
})

test('o desenvolvedor vê todas as tabelas e as rodadas', async (t) => {
  const w = await rolesWorld(t, 'PLANTED')
  const developer = await memberOn(w.on.hub, w.on.companyId, DAVI, 'developer')
  const listed = await listedBy(w, developer)
  assert.equal(listed.copies.length, 5)
  for (const copyId of w.copies.values()) {
    const read = await get(w, developer, `/${copyId}/runs`)
    assert.equal(read.statusCode, 200, read.body)
  }
})

test('o desenvolvedor pede a amostra de uma tabela que o papel não lê e recebe COPY_NOT_IN_ROLE', async (t) => {
  const w = await rolesWorld(t, 'PLANTED')
  const developer = await memberOn(w.on.hub, w.on.companyId, DAVI, 'developer')
  const read = await get(w, developer, `/${copyOf(w.copies, 'sankhya_vendas')}/sample`)
  assert.deepEqual([read.statusCode, codeOf(read)], [403, 'COPY_NOT_IN_ROLE'])
})

test('a amostra do membro vem pelo login do papel', async (t) => {
  const w = await rolesWorld(t, 'PLANTED')
  const postgres = w.on.hub.postgres.companyPostgres
  const reads = t.mock.method(postgres, 'readCopies')
  const read = await get(w, w.on.carla, `/${copyOf(w.copies, 'sankhya_clientes')}/sample`)
  assert.equal(read.statusCode, 200, read.body)
  assert.equal(CopySample.parse(Object(read.json()).sample).rows.length, 5)
  const logins = reads.mock.calls.map(
    ({ arguments: [address] }) => new URL(address.reveal()).username,
  )
  assert.deepEqual(logins, [`conexus_role_${w.financeiro.id}`])
  const hidden = await get(w, w.on.carla, `/${copyOf(w.copies, 'sankhya_vendas')}/sample`)
  const missing = await get(w, w.on.carla, `/${randomUUID()}/sample`)
  assert.deepEqual([hidden.statusCode, codeOf(hidden)], [404, 'COPY_NOT_FOUND'])
  assert.deepEqual(problemOf(hidden), problemOf(missing))
})
