import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { connectorOf } from '@conexus/connectors'
import { CompanyId, ConnectionId, PersonId, ProjectId } from '@conexus/hub-api'
import { z } from 'zod'
import { call, plantCompany } from '../identity/test-hub.ts'
import type { SessionScope } from './public.ts'
import { TurnKey } from './public.ts'
import { appCalls, CONNECTOR_CALLS_PER_TURN, TURNS_KEPT } from './test-app-calls.ts'
import { linkSankhya, testOf } from './test-connections.ts'
import { withRows } from './test-rows.ts'

const QUERY = 'SELECT COUNT(*) AS N FROM TSIEMP'

async function assistantOn(
  t: Parameters<typeof appCalls>[0],
  a: Parameters<typeof appCalls>[1] = {},
) {
  const on = await appCalls(t, a)
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
  /** How many reads reached the provider's door: one `CONNECTOR_CALLED` line each. */
  function called() {
    return on.hub.lines.filter((line) => line.message === 'CONNECTOR_CALLED').length
  }
  return {
    ...on,
    matriz,
    companyId,
    projectId,
    scope,
    ask,
    called,
    port: on.hub.connectors.assistant,
  }
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
  assert.deepEqual(await on.ask(on.ana), { kind: 'NOT_GRANTED' })
  assert.equal(on.called(), 0, 'nothing reached the provider')
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
  const otherCompany = await plantCompany(on.hub.test, on.carla.id, 'Empresa B', 'empresa-b')
  const otherRoute = `/api/companies/${otherCompany}/connections`
  const other = await linkSankhya(on.hub, on.carla, otherRoute, on.fake.credential, undefined, 'B')
  const otherId = String(Object(other.json()).connection.id)
  const tested = await testOf(on.hub, on.carla, otherRoute, otherId)
  assert.equal(Object(tested.json()).result, 'WORKING', 'company B has a connection that works')

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
  assert.equal(on.called(), CONNECTOR_CALLS_PER_TURN, 'the 51st never reached the provider')
  assert.equal((await on.ask(on.ana, { turn })).kind, 'CALLS_SPENT')
  assert.equal(on.called(), CONNECTOR_CALLS_PER_TURN, 'nor the 52nd')
  assert.equal((await on.ask(on.ana, { turn: randomUUID() })).kind, 'OK')
})

test('o corte e o inteiro: uma leitura de 25 linhas dá ao modelo as 20 do corte, complete falso, e em whole as 25 como vieram', async (t) => {
  const on = await assistantOn(t, { through: (origin) => withRows(t, origin, 25) })
  const answered = await on.ask(on.ana, {}, 'consultar', { sql: QUERY })
  assert.ok(answered.kind === 'OK')
  const { whole, value } = z
    .object({
      whole: z.object({ linhas: z.array(z.unknown()) }),
      value: z.object({ linhas: z.array(z.unknown()) }),
    })
    .parse(answered)
  assert.equal(whole.linhas.length, 25)
  assert.equal(value.linhas.length, 20)
  assert.equal(answered.complete, false)
})

test('uma falha do fornecedor volta como veio, sem corte nem whole', async (t) => {
  const on = await assistantOn(t)
  on.fake.switches.refuse.add('empresas')
  const answered = await on.ask(on.ana)
  assert.equal(answered.kind, 'REFUSED')
  assert.ok(!('whole' in answered))
})

test('duas liberadas ao Projeto: o caderno e a leitura são da escolhida, não da primeira liberada', async (t) => {
  const on = await assistantOn(t)
  const filial = ConnectionId.parse(await on.connect('Filial', false))
  assert.equal((await call(on.hub, on.ana, 'PUT', on.routes.grant(on.matriz))).statusCode, 200)
  // Sankhya is one per Projeto, so the second release is planted where a many connector would have it.
  await on.hub.test.asOwner(
    'insert into connectors.project_connection (project_id, company_id, connector_id, connection_id, exclusive, granted_by, granted_at) select project_id, company_id, connector_id, $1, false, granted_by, granted_at from connectors.project_connection where connection_id = $2',
    [filial, on.matriz],
  )
  const note = {
    mapping: 'TGFPAR.CODPARC',
    provingQuery: QUERY,
    provedAt: new Date().toISOString(),
    provedRows: 1,
    writtenBy: on.ana.id,
  }
  await on.hub.test.asOwner('update connectors.connection set notes = $1::jsonb where id = $2', [
    JSON.stringify({ cliente: note }),
    filial,
  ])
  const chose = on.scope(on.ana, { project: true, chosen: [filial] })
  assert.deepEqual(await on.port.notes(chose, filial), { cliente: note })
  assert.equal(await on.port.notes(chose, on.matriz), null)
  function read(connectionId: ConnectionId) {
    return on.port.read(chose, {
      connectionId,
      turn: TurnKey.parse(randomUUID()),
      operation: 'empresas',
      input: { page: 0 },
    })
  }
  assert.equal((await read(filial)).kind, 'OK')
  assert.deepEqual(await read(on.matriz), { kind: 'NOT_GRANTED' })
})

test('50 por turno: passado o limite de turnos lembrados o mais antigo é esquecido e começa do zero', async (t) => {
  const on = await assistantOn(t)
  const first = randomUUID()
  for (let n = 0; n < CONNECTOR_CALLS_PER_TURN; n += 1)
    assert.equal((await on.ask(on.ana, { turn: first })).kind, 'OK')
  assert.equal((await on.ask(on.ana, { turn: first })).kind, 'CALLS_SPENT')
  for (let n = 0; n < TURNS_KEPT - 1; n += 1) await on.ask(on.ana, { turn: randomUUID() })
  assert.equal((await on.ask(on.ana, { turn: first })).kind, 'CALLS_SPENT', 'still remembered')
  await on.ask(on.ana, { turn: randomUUID() })
  assert.equal((await on.ask(on.ana, { turn: first })).kind, 'OK', 'forgotten')
})

test('quem saiu da empresa recebe a lista vazia e NOT_GRANTED, como quem não pode perguntar', async (t) => {
  const on = await assistantOn(t)
  assert.equal((await on.ask(on.bruno)).kind, 'OK', 'Bruno reads while he is a member')
  const left = await call(
    on.hub,
    on.ana,
    'DELETE',
    `/api/companies/${on.companyId}/members/${on.bruno.id}`,
  )
  assert.equal(left.statusCode, 204, left.body)
  assert.deepEqual(await on.port.connections(on.scope(on.bruno)), [])
  assert.deepEqual(await on.ask(on.bruno), { kind: 'NOT_GRANTED' })
  assert.equal(await on.port.notes(on.scope(on.bruno), on.matriz), null)
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
    [
      home?.by,
      home?.companyId,
      home?.personId,
      home?.operation,
      home?.result,
      'projectId' in (home ?? {}),
    ],
    ['assistant', on.companyId, on.ana.id, 'consultar', 'OK', false],
  )
  assert.deepEqual(
    [project?.by, project?.personId, project?.projectId],
    ['assistant', on.ana.id, on.projectId],
  )
  const logged = JSON.stringify(on.hub.lines)
  assert.ok(!logged.includes(QUERY))
  for (const value of JSON.stringify(answered.whole).match(/[A-Za-z]{5,}/g) ?? [])
    assert.ok(!logged.includes(value), `${value} is in the log`)
})
