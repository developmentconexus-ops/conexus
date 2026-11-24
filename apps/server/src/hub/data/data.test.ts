import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { Catalog, ConversationId, OperationId, PersonId, ToolCallId } from '@conexus/hub-api'
import { unreachableDatabase } from '../../platform/test-database.ts'
import type { Place } from '../access/public.ts'
import { createAccess } from '../access/public.ts'
import { readerAt } from '../access/test-principal.ts'
import { memberOn } from '../identity/test-hub.ts'
import { createCompanyData } from './public.ts'
import type { CompanyOn } from './test-company.ts'
import { companyOn } from './test-company.ts'

const DAVI = { name: 'Davi Costa', email: 'davi@example.test' }
const BIA = { name: 'Bia Reis', email: 'bia@example.test' }

function scopeOf(on: CompanyOn, personId: PersonId, place: Place) {
  return readerAt({ companyId: on.companyId, personId, place })
}

function inCompany(on: CompanyOn, personId: PersonId = on.anaId) {
  return on.hub.data(scopeOf(on, personId, { kind: 'COMPANY' }), { thread: null })
}

async function catalogOf(data: ReturnType<typeof inCompany>) {
  const described = await data.describe()
  assert.equal(described.kind, 'CATALOG')
  return Catalog.parse(described)
}

function logOf(on: CompanyOn) {
  function line(fields: Record<string, unknown>, message: string) {
    on.hub.lines.push({ fields, message })
  }
  return { info: line, error: line }
}

test('descrever na empresa: cada papel vê os sistemas e nenhuma tabela', async (t) => {
  const on = await companyOn(t)
  const developer = await memberOn(on.hub, on.companyId, DAVI, 'developer')
  const admin = await memberOn(on.hub, on.companyId, BIA, 'admin')
  const described = await inCompany(on).describe()
  assert.deepEqual(Object.keys(described).sort(), ['kind', 'systems'])
  for (const person of [
    on.anaId,
    ...[developer, admin, on.carla].map(({ id }) => PersonId.parse(id)),
  ]) {
    const seen = await catalogOf(inCompany(on, person))
    assert.equal(seen.systems.length, 1, person)
  }
})

test('descrever num Projeto: a conexão liberada, e só ela', async (t) => {
  const on = await companyOn(t)
  const inProject = on.hub.data(
    scopeOf(on, on.anaId, { kind: 'PROJECT', projectId: on.projectId }),
    { thread: null },
  )
  assert.deepEqual(
    (await catalogOf(inProject)).systems,
    [],
    'a conexão não liberada ao Projeto fica fora',
  )
  await on.hub.connectors.grants.grant({
    ...{ companyId: on.companyId, person: { id: on.anaId } },
    ...{ projectId: on.projectId, connectionId: on.connectionId },
  })
  const released = await catalogOf(inProject)
  assert.deepEqual(
    released.systems.map(({ connection }) => connection),
    [on.connectionId],
  )
})

test('o Hub calado dá CATALOG_UNAVAILABLE', async (t) => {
  const on = await companyOn(t)
  const database = await unreachableDatabase(t)
  const sources = { systems: on.hub.connectors.access.systems }
  const silent = createCompanyData({
    ...{
      identity: on.hub.identity,
      access: createAccess({ database, identity: on.hub.identity, sources }),
    },
    ...{ log: logOf(on), projects: on.hub.projects.ports },
    ...{ database, connectors: () => on.hub.connectors },
  })
  const described = await silent(scopeOf(on, on.anaId, { kind: 'COMPANY' }), {
    thread: null,
  }).describe()
  assert.deepEqual(described, { kind: 'CATALOG_UNAVAILABLE' })
  assert.ok(on.hub.lines.some(({ message }) => message === 'DATA_CATALOG_FAILED'))
})

test('sem turno, ao vivo e ação respondem NOT_GRANTED e não chamam o sistema', async (t) => {
  const on = await companyOn(t)
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
  assert.ok(!on.hub.lines.some(({ message }) => message === 'CONNECTOR_CALLED'))
})
