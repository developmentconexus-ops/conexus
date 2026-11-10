import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { APP_DATA_TOOL, ProjectId } from '@conexus/hub-api'
import { builderDataOn } from '../../hub/apps/test-builder-data.ts'
import {
  call,
  codeOf,
  memberOn,
  personOn,
  plantCompany,
  post,
} from '../../hub/identity/test-hub.ts'
import type { Sent } from '../../platform/test-anthropic.ts'
import { conversing, endOf, sent, started, streamOf } from '../conversation/test-conversation.ts'
import { stepped } from '../conversation/test-questions.ts'
import { builderAppDataTools } from './public.ts'

const CARLA = { name: 'Carla Dias', email: 'carla@example.test' }
const DORA = { name: 'Dora Reis', email: 'dora@example.test' }
const EDU = { name: 'Edu Lima', email: 'edu@example.test' }

const SEED = {
  id: '002_ver',
  statements: [
    "INSERT INTO recado (texto) SELECT 'recado ' || n FROM generate_series(1, 30) AS n",
    'CREATE TABLE longo (id int PRIMARY KEY, texto text NOT NULL)',
    "INSERT INTO longo VALUES (1, 'curta'), (2, repeat('y', 20000)), (3, 'curta')",
  ],
}

function toolsOffered(call: Sent | undefined): string[] {
  return (call?.tools ?? []).filter((name) => name.startsWith('app_data_')).sort()
}

test('quem usa o Builder lê e conta: o turno oferece as duas ferramentas a dono, administrador, desenvolvedor e membro', async (t) => {
  const calls: Sent[] = []
  const on = await conversing(t, stepped([], calls))
  const { hub, companyId } = on
  const people = [
    on.ana,
    await memberOn(hub, companyId, CARLA, 'admin'),
    await memberOn(hub, companyId, DORA, 'developer'),
    await memberOn(hub, companyId, { name: 'Bruno Reis', email: 'bruno@example.test' }, 'member'),
  ]
  for (const person of people) {
    const url = `${on.conversations}/${await started(hub, person, on.conversations)}`
    const stream = await streamOf(hub, person, url)
    t.after(() => stream.close())
    assert.equal((await sent(hub, person, url, 'Veja os dados')).statusCode, 200)
    assert.equal(endOf(await stream.turn()), 'complete')
    assert.deepEqual(toolsOffered(calls.at(-1)), [APP_DATA_TOOL.check, APP_DATA_TOOL.read].sort())
  }
})

test('quem usa o Builder lê e conta: a porta do Hub admite o membro e responde NOT_FOUND a quem não é admitido, igual a um Projeto que não existe', async (t) => {
  const on = await builderDataOn(t, SEED)
  const { hub, data } = on
  const developer = await memberOn(hub, on.companyId, DORA, 'developer')
  const admin = await memberOn(hub, on.companyId, CARLA, 'admin')
  const signal = AbortSignal.timeout(10_000)
  for (const person of [on.ana, admin, developer, on.bruno]) {
    const ids = on.ids(person)
    const read = await data.read(ids, { text: 'select id from longo order by id' }, signal)
    assert.ok(read.kind === 'ROWS', `${person.id} reads`)
    assert.deepEqual(read.rows, [[1], [2], [3]])
    const checked = await data.check(ids, { text: 'select id from longo' }, signal)
    assert.ok(checked.kind === 'COUNTED', `${person.id} checks`)
    assert.deepEqual(checked.rows, { kind: 'EXACT', rows: 3 })
  }
  const edu = await personOn(hub, EDU)
  await plantCompany(hub.test, edu.id, 'Empresa B', 'empresa-b')
  const absent = { ...on.ids(on.ana), projectId: ProjectId.parse(randomUUID().replaceAll('-', '')) }
  const refused = { kind: 'REFUSED', code: 'NOT_FOUND' }
  for (const ids of [{ ...on.ids(edu), companyId: on.ids(on.ana).companyId }, absent]) {
    assert.deepEqual(await data.access(ids), { kind: 'NOT_FOUND' })
    assert.deepEqual(await data.read(ids, { text: 'select 1' }, signal), refused)
    assert.deepEqual(await data.check(ids, { text: 'select 1' }, signal), refused)
  }
})

test('quem usa o Builder lê e conta: a página Dados segue de dono, administrador e desenvolvedor, e o membro recebe 404 nela', async (t) => {
  const on = await builderDataOn(t, SEED)
  const { hub } = on
  const developer = await memberOn(hub, on.companyId, DORA, 'developer')
  const project = `/api/companies/${on.companyId}/projects/${on.projectId}`
  for (const person of [on.ana, developer]) {
    assert.equal((await call(hub, person, 'GET', `${project}/tables`)).statusCode, 200)
  }
  for (const route of [`${project}/tables`, `${project}/tables/longo/rows`]) {
    const member = await call(hub, on.bruno, 'GET', route)
    assert.deepEqual([member.statusCode, codeOf(member)], [404, 'NOT_FOUND'], route)
  }
})

test('o Builder lê com o corte das leituras de conector', async (t) => {
  const on = await builderDataOn(t, SEED)
  const tools = builderAppDataTools({ data: on.data, ids: on.ids(on.bruno) })
  const read = tools[APP_DATA_TOOL.read]
  assert.ok(read?.execute)
  const many = Object(await read.execute({ sql: 'select id, texto from recado order by id' }, {}))
  assert.equal(many.kind, 'ROWS')
  assert.equal(many.rows.length, 20, 'twenty rows of thirty')
  assert.equal(many.complete, false)
  const long = Object(await read.execute({ sql: 'select id, texto from longo order by id' }, {}))
  assert.deepEqual(
    long.rows.map((row: [number, string]) => row[0]),
    [1, 2, 3],
  )
  assert.ok(long.rows[1][1].length < 1000, 'the long text is cut, its row kept')
  assert.equal(long.complete, false)
})

test('Projeto sem banco: as duas ferramentas devolvem APP_DATA_NO_APP', async (t) => {
  const on = await builderDataOn(t)
  const bare = await post(on.hub, on.ana, on.projects, { name: 'Sem app' })
  assert.equal(bare.statusCode, 201, bare.body)
  const projectId = ProjectId.parse(String(Object(bare.json()).project.id))
  const tools = builderAppDataTools({ data: on.data, ids: { ...on.ids(on.ana), projectId } })
  const noApp = { kind: 'FAILED', code: 'APP_DATA_NO_APP' }
  const read = tools[APP_DATA_TOOL.read]
  const check = tools[APP_DATA_TOOL.check]
  assert.ok(read.execute && check.execute)
  assert.deepEqual(await read.execute({ sql: 'select 1' }, {}), noApp)
  assert.deepEqual(await check.execute({ sql: 'select 1', values: [] }, {}), noApp)
})
