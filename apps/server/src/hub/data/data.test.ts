import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import {
  Catalog,
  ConversationId,
  OperationId,
  PersonId,
  TABLE_PAGE_ROWS,
  ToolCallId,
} from '@conexus/hub-api'
import { unreachableDatabase } from '../../platform/test-database.ts'
import type { Place } from '../access/public.ts'
import { createAccess } from '../access/public.ts'
import { readerAt } from '../access/test-principal.ts'
import type { CopiesOn } from '../copies/test-copies.ts'
import { asSync, copiesOn } from '../copies/test-copies.ts'
import { memberOn } from '../identity/test-hub.ts'
import { createCompanyData } from './public.ts'

const DAVI = { name: 'Davi Costa', email: 'davi@example.test' }
const BIA = { name: 'Bia Reis', email: 'bia@example.test' }

function scopeOf(on: CopiesOn, personId: PersonId, place: Place) {
  return readerAt({ companyId: on.companyId, personId, place })
}

function inCompany(on: CopiesOn, personId: PersonId = on.anaId) {
  return on.hub.data(scopeOf(on, personId, { kind: 'COMPANY' }))
}

async function catalogOf(data: ReturnType<typeof inCompany>) {
  const described = await data.describe()
  assert.equal(described.kind, 'CATALOG')
  return Catalog.parse(described)
}

function logOf(on: CopiesOn) {
  function line(fields: Record<string, unknown>, message: string) {
    on.hub.lines.push({ fields, message })
  }
  return { info: line, error: line }
}

async function endedCopy(on: CopiesOn, model: string) {
  const copyId = await on.enable(model)
  assert.equal((await on.run(copyId)).kind, 'ENDED')
  return copyId
}

test('descrever na empresa: o dono vê as cópias, o desenvolvedor e o membro não', async (t) => {
  const on = await copiesOn(t)
  const developer = await memberOn(on.hub, on.companyId, DAVI, 'developer')
  await on.enable('vendas')
  const described = await inCompany(on).describe()
  assert.deepEqual(Object.keys(described).sort(), ['kind', 'systems', 'tables'])
  const owner = Catalog.parse(described)
  assert.deepEqual(
    owner.tables.map(({ name }) => name),
    ['sankhya_vendas'],
  )
  assert.equal(owner.systems.length, 1)
  const admin = await memberOn(on.hub, on.companyId, BIA, 'admin')
  const administrator = await catalogOf(inCompany(on, PersonId.parse(admin.id)))
  assert.deepEqual(
    administrator.tables.map(({ name }) => name),
    ['sankhya_vendas'],
  )
  for (const person of [PersonId.parse(developer.id), PersonId.parse(on.carla.id)]) {
    const seen = await catalogOf(inCompany(on, person))
    assert.deepEqual(seen.tables, [])
    assert.equal(seen.systems.length, 1)
  }
})

test('descrever num Projeto: só as liberadas', async (t) => {
  const on = await copiesOn(t)
  await on.enable('vendas')
  const clients = await on.enable('clientes')
  await on.copies.grant({
    ...{ companyId: on.companyId, personId: on.anaId },
    ...{ projectId: on.projectId, copyId: clients },
  })
  const inProject = on.hub.data(scopeOf(on, on.anaId, { kind: 'PROJECT', projectId: on.projectId }))
  const seen = await catalogOf(inProject)
  assert.deepEqual(
    seen.tables.map(({ name }) => name),
    ['sankhya_clientes'],
  )
  assert.deepEqual(seen.systems, [], 'a conexão não liberada ao Projeto fica fora')
  await on.hub.connectors.grants.grant({
    ...{ companyId: on.companyId, person: { id: on.anaId } },
    ...{ projectId: on.projectId, connectionId: on.connectionId },
  })
  const released = await catalogOf(inProject)
  assert.deepEqual(
    released.systems.map(({ connection }) => connection),
    [on.connectionId],
  )
  const [table] = released.tables
  assert.equal(table?.kept.kind, 'COPY')
  assert.deepEqual(
    table?.kept.sources.map((one) => (one.kind === 'NAMED' ? one.connection.id : one.kind)),
    [on.connectionId],
  )
})

test('o catálogo do lugar diz o estado da conexão, e o do Projeto não nomeia a conexão que ele não recebeu', async (t) => {
  const on = await copiesOn(t)
  const clients = await on.enable('clientes')
  await on.enable('vendas')
  await on.copies.grant({
    ...{ companyId: on.companyId, personId: on.anaId },
    ...{ projectId: on.projectId, copyId: clients },
  })
  const inProject = on.hub.data(scopeOf(on, on.anaId, { kind: 'PROJECT', projectId: on.projectId }))
  const named = Catalog.parse(await inCompany(on).describe()).systems[0]?.name
  assert.ok(named, 'a conexão tem nome')

  const before = await catalogOf(inProject)
  assert.deepEqual(
    before.tables.flatMap((table) => table.kept.sources),
    [{ kind: 'NOT_GIVEN', connector: 'sankhya' }],
    'o Projeto não recebeu a conexão: só o conector',
  )
  assert.ok(!JSON.stringify(before).includes(named), 'o nome da conexão não sai no Projeto')

  await on.hub.connectors.grants.grant({
    ...{ companyId: on.companyId, person: { id: on.anaId } },
    ...{ projectId: on.projectId, connectionId: on.connectionId },
  })
  await on.hub.test.asOwner(
    "update connectors.connection set state = 'NEEDS_REAUTH' where id = $1",
    [on.connectionId],
  )
  const company = await catalogOf(inCompany(on))
  assert.equal(company.tables.length, 2)
  for (const table of company.tables)
    assert.deepEqual(
      table.kept.sources.map((one) =>
        one.kind === 'NAMED' ? [one.connection.name, one.state] : null,
      ),
      [[named, 'NEEDS_REAUTH']],
      'no Início toda fonte é NAMED, também a que espera nova autorização',
    )

  const after = await catalogOf(inProject)
  assert.deepEqual(
    after.tables.flatMap((table) =>
      table.kept.sources.map((one) => (one.kind === 'NAMED' ? [one.kind, one.state] : [one.kind])),
    ),
    [['NAMED', 'NEEDS_REAUTH']],
    'o Projeto que recebeu a conexão a nomeia, em qualquer estado',
  )
})

test('toda tabela do catálogo traz descrição', async (t) => {
  const on = await copiesOn(t)
  await on.enable('vendas')
  await on.enable('clientes')
  const seen = await catalogOf(inCompany(on))
  assert.equal(seen.tables.length, 2)
  assert.ok(seen.tables.every(({ description }) => description.length > 0))
})

test('ler uma tabela devolve 200 linhas e a marca de que há mais', async (t) => {
  const on = await copiesOn(t)
  await endedCopy(on, 'vendas')
  await asSync(on.owner, (client) =>
    client.query(`
      INSERT INTO sync.sankhya_vendas
      SELECT (jsonb_populate_record(NULL::sync.sankhya_vendas,
        to_jsonb(v) || jsonb_build_object('NUNOTA', 900000 + g))).*
      FROM (SELECT * FROM sync.sankhya_vendas LIMIT 1) v, generate_series(1, 250) g`),
  )
  const answer = await inCompany(on).read({ kind: 'TABLE', table: 'sankhya_vendas' })
  assert.equal(answer.kind, 'TABLE')
  assert.ok(answer.kind === 'TABLE')
  assert.equal(answer.rows.length, TABLE_PAGE_ROWS)
  assert.equal(answer.complete, false)
  assert.ok(Object.keys(answer.rows[0] ?? {}).includes('NUNOTA'))
})

test('o Hub calado dá CATALOG_UNAVAILABLE', async (t) => {
  const on = await copiesOn(t)
  const database = await unreachableDatabase(t)
  const sources = { systems: on.hub.connectors.access.systems, tables: on.hub.copies.access.tables }
  const silent = createCompanyData({
    ...{
      identity: on.hub.identity,
      access: createAccess({ database, identity: on.hub.identity, sources }),
    },
    ...{ copies: () => on.hub.copies.data, log: logOf(on) },
    ...{ projects: on.hub.projects.ports, companyPostgres: on.hub.postgres.companyPostgres },
    neon: on.hub.neon.neon,
    database,
  })
  const described = await silent(scopeOf(on, on.anaId, { kind: 'COMPANY' })).describe()
  assert.deepEqual(described, { kind: 'CATALOG_UNAVAILABLE' })
  assert.ok(on.hub.lines.some(({ message }) => message === 'DATA_CATALOG_FAILED'))
})

test('o banco da empresa calado dá TABLE_UNAVAILABLE e não lê ao vivo', async (t) => {
  const on = await copiesOn(t)
  await endedCopy(on, 'vendas')
  t.mock.method(on.hub.postgres.companyPostgres, 'readCopies', async () => ({
    kind: 'UNAVAILABLE' as const,
    cause: 'DOWN',
  }))
  const before = on.gate.pages
  const answer = await inCompany(on).read({ kind: 'TABLE', table: 'sankhya_vendas' })
  assert.deepEqual(answer, { kind: 'TABLE_UNAVAILABLE' })
  const failed = on.hub.lines.find(({ message }) => message === 'DATA_ROWS_FAILED')
  assert.equal(failed?.fields.reason, 'DOWN')
  assert.equal(on.gate.pages, before)
})

test('a tabela antes da primeira rodada dá TABLE_UNAVAILABLE', async (t) => {
  const on = await copiesOn(t)
  await endedCopy(on, 'vendas')
  await asSync(on.owner, (client) => client.query('DROP TABLE sync.sankhya_vendas'))
  const answer = await inCompany(on).read({ kind: 'TABLE', table: 'sankhya_vendas' })
  assert.deepEqual(answer, { kind: 'TABLE_UNAVAILABLE' })
  const line = on.hub.lines.find(({ message }) => message === 'DATA_ROWS_FAILED')
  assert.equal(line?.fields.reason, 'NO_TABLE')
})

test('ao vivo e ação respondem NOT_GRANTED', async (t) => {
  const on = await copiesOn(t)
  const data = inCompany(on)
  const [system] = (await catalogOf(data)).systems
  const read = system?.reads[0]
  const action = system?.actions[0]
  assert.ok(read && action)
  const live = await data.read({
    ...{ kind: 'OPERATION', connection: on.connectionId, input: {} },
    operation: OperationId.parse(read.operation),
  })
  assert.deepEqual(live, { kind: 'NOT_GRANTED' })
  const acted = await data.act({
    ...{ connection: on.connectionId, operation: OperationId.parse(action.operation), input: {} },
    call: { thread: ConversationId.parse(randomUUID()), toolCall: ToolCallId.parse(randomUUID()) },
  })
  assert.deepEqual(acted, { kind: 'NOT_GRANTED' })
})
