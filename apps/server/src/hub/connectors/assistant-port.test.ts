import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { connectorOf } from '@conexus/connectors'
import { CompanyId, ConnectionId, PersonId, ProjectId } from '@conexus/hub-api'
import { call, plantCompany } from '../identity/test-hub.ts'
import type { SessionScope } from './public.ts'
import { TurnKey } from './public.ts'
import { appCalls, CONNECTOR_CALLS_PER_TURN, shaped } from './test-app-calls.ts'
import { linkSankhya, testOf } from './test-connections.ts'

const QUERY = 'SELECT COUNT(*) AS N FROM TSIEMP'

async function assistantOn(t: Parameters<typeof appCalls>[0]) {
  const on = await appCalls(t)
  const matriz = ConnectionId.parse(await on.connect('Matriz', false))
  const companyId = CompanyId.parse(on.companyId)
  const projectId = ProjectId.parse(on.projectId)
  function scope(
    who: { id: string },
    a: { project?: boolean; chosen?: readonly ConnectionId[] } = {},
  ): SessionScope {
    return {
      companyId,
      personId: PersonId.parse(who.id),
      place: a.project === true ? { kind: 'PROJECT', projectId } : { kind: 'COMPANY' },
      chosen: a.chosen ?? [matriz],
    }
  }
  function ask(
    who: { id: string },
    a: Parameters<typeof scope>[1] & { connectionId?: ConnectionId; turn?: string } = {},
    operation = 'empresas',
    input: unknown = { page: 0 },
  ) {
    return on.hub.connectors.assistant.read(scope(who, a), {
      connectionId: a.connectionId ?? matriz,
      turn: TurnKey.parse(a.turn ?? randomUUID()),
      operation,
      input,
    })
  }
  return { ...on, matriz, companyId, projectId, scope, ask, port: on.hub.connectors.assistant }
}

test('o Início: a dona e a administradora leem uma ligação ACTIVE escolhida, sem liberação de Projeto; o membro, NEEDS_REAUTH, outra empresa e uma apagada dão a mesma resposta', async (t) => {
  const on = await assistantOn(t)
  for (const who of [on.ana, on.bruno]) {
    const answered = await on.ask(who)
    assert.equal(answered.kind, 'OK')
  }
  assert.deepEqual(await on.ask(on.carla), { kind: 'NOT_GRANTED' })

  const otherCompany = await plantCompany(on.hub.test, on.carla.id, 'Empresa B', 'empresa-b')
  const otherRoute = `/api/companies/${otherCompany}/connections`
  const linked = await linkSankhya(on.hub, on.carla, otherRoute, on.fake.credential, undefined, 'B')
  const foreign = ConnectionId.parse(Object(linked.json()).connection.id)
  assert.equal((await testOf(on.hub, on.carla, otherRoute, foreign)).statusCode, 200)
  const never = await on.ask(on.ana, { chosen: [foreign], connectionId: foreign })

  const second = ConnectionId.parse(await on.connect('Filial', false))
  await on.hub.test.asOwner(
    "update connectors.connection set state = 'NEEDS_REAUTH' where id = $1",
    [second],
  )
  const reauth = await on.ask(on.ana, { chosen: [second], connectionId: second })

  const third = ConnectionId.parse(await on.connect('Apagada', false))
  assert.equal(
    (await call(on.hub, on.ana, 'DELETE', `${on.routes.connections}/${third}`)).statusCode,
    200,
  )
  const removed = await on.ask(on.ana, { chosen: [third], connectionId: third })
  for (const answer of [never, reauth, removed]) assert.deepEqual(answer, { kind: 'NOT_GRANTED' })
})

test('o Projeto: uma escolhida e liberada ao Projeto dá OK; uma escolhida mas não liberada dá NOT_GRANTED', async (t) => {
  const on = await assistantOn(t)
  assert.deepEqual(await on.ask(on.ana, { project: true }), { kind: 'NOT_GRANTED' })
  assert.equal((await call(on.hub, on.ana, 'PUT', on.routes.grant(on.matriz))).statusCode, 200)
  assert.equal((await on.ask(on.ana, { project: true })).kind, 'OK')
})

test('a escolha: o que o lugar oferece e a conversa não escolheu dá NOT_GRANTED e caderno null; escolhida de novo, OK; o caderno de quem o Projeto não recebeu também é null', async (t) => {
  const on = await assistantOn(t)
  assert.deepEqual(await on.ask(on.ana, { chosen: [] }), { kind: 'NOT_GRANTED' })
  assert.equal(await on.port.notes(on.scope(on.ana, { chosen: [] }), on.matriz), null)
  assert.equal((await on.ask(on.ana)).kind, 'OK')
  assert.deepEqual(await on.port.notes(on.scope(on.ana), on.matriz), {})
  assert.equal(await on.port.notes(on.scope(on.ana, { project: true }), on.matriz), null)
  assert.equal(await on.port.notes(on.scope(on.carla), on.matriz), null)
})

test('só leitura: uma operação que não é read nunca sai pela porta da empresa', async (t) => {
  const on = await assistantOn(t)
  const sankhya = connectorOf('sankhya')
  const index = sankhya?.operations.findIndex((operation) => operation.id === 'empresas') ?? -1
  const original = sankhya?.operations[index]
  assert.ok(sankhya && original)
  Reflect.set(sankhya.operations, index, { ...original, class: 'write' })
  t.after(() => Reflect.set(sankhya.operations, index, original))
  const logins = on.fake.logins()
  assert.deepEqual(await on.ask(on.ana), { kind: 'NOT_GRANTED' })
  assert.equal(on.fake.logins(), logins, 'nothing reached the provider')
})

test('a lista: no Início cada ACTIVE da empresa, num Projeto só as liberadas, com a escolha; NEW, NEEDS_REAUTH e outra empresa ficam de fora; quem não pode perguntar recebe vazia', async (t) => {
  const on = await assistantOn(t)
  const filial = ConnectionId.parse(await on.connect('Filial', false))
  const stale = ConnectionId.parse(await on.connect('Velha', false))
  await on.hub.test.asOwner(
    "update connectors.connection set state = 'NEEDS_REAUTH' where id = $1",
    [stale],
  )
  const fresh = await linkSankhya(
    on.hub,
    on.ana,
    on.routes.connections,
    on.fake.credential,
    undefined,
    'Nova',
  )
  assert.equal(Object(fresh.json()).connection.state, 'NEW')
  await plantCompany(on.hub.test, on.carla.id, 'Empresa B', 'empresa-b')

  const home = await on.port.connections(on.scope(on.ana))
  assert.deepEqual(
    home.map(({ name, chosen, connector }) => [name, chosen, connector]),
    [
      ['Matriz', true, 'sankhya'],
      ['Filial', false, 'sankhya'],
    ],
  )
  const [first] = home
  assert.ok(first)
  assert.ok(first.reads.some((read) => read.operation === 'empresas'))
  assert.ok(first.skill.name.startsWith('conexus-'))

  assert.deepEqual(await on.port.connections(on.scope(on.ana, { project: true })), [])
  await call(on.hub, on.ana, 'PUT', on.routes.grant(filial))
  const inProject = await on.port.connections(on.scope(on.bruno, { project: true }))
  assert.deepEqual(
    inProject.map(({ name, chosen }) => [name, chosen]),
    [['Filial', false]],
  )
  assert.deepEqual(await on.port.connections(on.scope(on.carla)), [])
})

test('50 por turno: a 51ª chamada do mesmo turno é CALLS_SPENT sem chamar o fornecedor; outro turno começa do zero', async (t) => {
  const on = await assistantOn(t)
  const turn = randomUUID()
  const kinds = []
  for (let n = 0; n < CONNECTOR_CALLS_PER_TURN + 1; n += 1)
    kinds.push((await on.ask(on.ana, { turn })).kind)
  assert.equal(kinds.filter((kind) => kind === 'OK').length, CONNECTOR_CALLS_PER_TURN)
  assert.equal(kinds.at(-1), 'CALLS_SPENT')
  const logins = on.fake.logins()
  assert.equal((await on.ask(on.ana, { turn })).kind, 'CALLS_SPENT')
  assert.equal(on.fake.logins(), logins)
  assert.equal((await on.ask(on.ana, { turn: randomUUID() })).kind, 'OK')
})

test('o corte e o inteiro: OK dá ao modelo o corte do Builder e, em whole, a resposta como veio; nada fica guardado entre chamadas', async (t) => {
  const on = await assistantOn(t)
  const answered = await on.ask(on.ana, {}, 'consultar', { sql: QUERY })
  assert.equal(answered.kind, 'OK')
  assert.ok(answered.kind === 'OK')
  assert.deepEqual(answered.value, shaped(answered.whole).value)
  assert.equal(answered.complete, shaped(answered.whole).complete)
  assert.deepEqual(answered.whole, { completo: true, linhas: [{ N: 2 }] })
  const tables = await on.hub.test.asOwner(
    "select table_schema, table_name from information_schema.columns where column_name in ('whole', 'reads') and table_schema not in ('pg_catalog', 'information_schema')",
  )
  assert.deepEqual(tables, [])
})

test('a linha: CONNECTOR_CALLED com empresa, pessoa, by assistant, o projectId só num Projeto, a operação e o resultado; nunca o corpo nem o SQL', async (t) => {
  const on = await assistantOn(t)
  await call(on.hub, on.ana, 'PUT', on.routes.grant(on.matriz))
  const answered = await on.ask(on.ana, {}, 'consultar', { sql: QUERY })
  assert.ok(answered.kind === 'OK')
  await on.ask(on.ana, { project: true })
  const lines = on.hub.lines.filter((line) => line.message === 'CONNECTOR_CALLED')
  const [home, project] = lines.map((line) => line.fields)
  assert.equal(lines.length, 2)
  assert.deepEqual(
    [home?.by, home?.companyId, home?.operation, home?.result, 'projectId' in (home ?? {})],
    ['assistant', on.companyId, 'consultar', 'OK', false],
  )
  assert.deepEqual([project?.by, project?.projectId], ['assistant', on.projectId])
  const logged = JSON.stringify(on.hub.lines)
  assert.ok(!logged.includes(QUERY))
  for (const value of JSON.stringify(answered.whole).match(/[A-Za-z]{5,}/g) ?? [])
    assert.ok(!logged.includes(value), `${value} is in the log`)
})
