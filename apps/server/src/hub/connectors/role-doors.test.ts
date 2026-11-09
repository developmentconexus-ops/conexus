import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { CompanyId, ConnectionId, OperationId, PersonId, ProjectId, RunId } from '@conexus/hub-api'
import { call, post } from '../identity/test-hub.ts'
import { SANKHYA_READS } from '../identity/test-kit.ts'
import type { SessionScope } from './public.ts'
import { operationLabel, TurnKey } from './public.ts'
import { appCalls } from './test-app-calls.ts'

const ATENDENTE = { label: 'Atendente', connectors: { sankhya: ['pedidos'] } }
const QUERY = 'SELECT COUNT(*) AS N FROM TSIEMP'

/** Empresa A with Sankhya linked and released to the Projeto, and Carla moved to the company's own role "Atendente". */
async function atendenteOn(t: Parameters<typeof appCalls>[0]) {
  const on = await appCalls(t)
  const matriz = ConnectionId.parse(await on.connect('Matriz'))
  const base = `/api/companies/${on.companyId}`
  assert.equal((await post(on.hub, on.ana, `${base}/roles`, ATENDENTE)).statusCode, 201)
  await on.hub.test.asOwner(
    "update auth.member set role = 'atendente' where company_id = $1 and user_id = $2",
    [on.companyId, on.carla.id],
  )
  const companyId = CompanyId.parse(on.companyId)
  const projectId = ProjectId.parse(on.projectId)
  function scope(): SessionScope {
    return {
      companyId,
      personId: PersonId.parse(on.carla.id),
      place: { kind: 'PROJECT', projectId },
      chosen: [matriz],
    }
  }
  function ask(operation: string, input: unknown = { page: 0 }, at = scope()) {
    return on.hub.connectors.assistant.read(at, {
      connectionId: matriz,
      turn: TurnKey.parse(randomUUID()),
      operation,
      input,
    })
  }
  function called() {
    return on.hub.lines.filter((line) => line.message === 'CONNECTOR_CALLED').length
  }
  const ids = { companyId, projectId, personId: PersonId.parse(on.carla.id) }
  return { ...on, matriz, base, scope, ask, called, ids }
}

test('o papel na leitura: o Assistente de um Atendente recebe só pedidos, e outra operação é recusada com o nome do papel, sem pedido ao dublê', async (t) => {
  const on = await atendenteOn(t)
  const [connection] = await on.hub.connectors.assistant.connections(on.scope())
  assert.deepEqual(
    connection?.reads.map((read) => read.operation),
    ['pedidos'],
  )
  const before = on.called()
  const refused = await on.ask('empresas')
  assert.deepEqual(refused, { kind: 'NOT_IN_ROLE', role: 'atendente', operation: 'empresas' })
  assert.equal(on.called(), before)
  assert.equal((await on.ask('pedidos', { pagina: 1 })).kind === 'NOT_IN_ROLE', false)
  const line = on.hub.lines.find((one) => one.message === 'CONNECTOR_READ_REFUSED')
  assert.equal(line?.fields.role, 'atendente')
  assert.ok(!JSON.stringify(line?.fields).includes('page'))
})

test('o papel muda: tirar a operação no meio da conversa faz a próxima chamada recusar', async (t) => {
  const on = await atendenteOn(t)
  assert.equal((await on.ask('pedidos', { pagina: 1 })).kind === 'NOT_IN_ROLE', false)
  const changed = await call(on.hub, on.ana, 'PUT', `${on.base}/roles/atendente`, {
    connectors: { sankhya: ['empresas'] },
    unattended: false,
  })
  assert.equal(changed.statusCode, 200)
  assert.equal((await on.ask('pedidos', { pagina: 1 })).kind, 'NOT_IN_ROLE')
  assert.notEqual((await on.ask('empresas')).kind, 'NOT_IN_ROLE')
})

test('o papel na leitura: no Builder, a lista e a leitura seguem o papel, e a porta de leitura some sem a operação', async (t) => {
  const on = await atendenteOn(t)
  const [granted] = await on.hub.connectors.builder.granted(on.ids)
  assert.deepEqual(
    granted?.reads.map((read) => read.operation),
    ['pedidos'],
  )
  function read(operation: string, input: unknown) {
    return on.hub.connectors.builder.read(on.ids, {
      connectionId: on.matriz,
      personId: on.ids.personId,
      runId: RunId.parse(randomUUID()),
      operation,
      input,
    })
  }
  const before = on.called()
  assert.equal((await read('consultar', { sql: QUERY })).kind, 'NOT_IN_ROLE')
  assert.equal((await read('empresas', { page: 0 })).kind, 'NOT_IN_ROLE')
  assert.equal(on.called(), before)
})

test('a prova do caderno pelo papel: sem consultar, gravar e ler o caderno dá NOT_IN_ROLE e o dublê não recebe a consulta', async (t) => {
  const on = await atendenteOn(t)
  const before = on.called()
  const saved = await on.hub.connectors.builder.saveNote(on.ids, {
    connectionId: on.matriz,
    personId: on.ids.personId,
    runId: RunId.parse(randomUUID()),
    concept: 'Empresa',
    mapping: 'TSIEMP guarda as empresas',
    provingQuery: QUERY,
  })
  assert.equal(saved.kind, 'NOT_IN_ROLE')
  assert.equal(on.called(), before)
  const notes = await on.hub.connectors.builder.notes(on.ids, on.matriz)
  assert.equal(Object(notes).kind, 'NOT_IN_ROLE')
})

test('o funil: uma versão publicada lê só o que declara, e a que não declarou a consulta livre recebe NOT_IN_ROLE sem pedido ao dublê', async (t) => {
  const on = await atendenteOn(t)
  const declared = [{ connectionId: on.matriz, operation: OperationId.parse('pedidos') }]
  const version = { ...on.scope(), speaksAs: { kind: 'VERSION', declared } } as const
  const before = on.called()
  const free = await on.ask('consultar', { sql: QUERY }, version)
  assert.deepEqual(free, { kind: 'NOT_IN_ROLE', role: null, operation: 'consultar' })
  assert.equal(on.called(), before)
  assert.notEqual((await on.ask('pedidos', { pagina: 1 }, version)).kind, 'NOT_IN_ROLE')
  const [connection] = await on.hub.connectors.assistant.connections(version)
  assert.deepEqual(
    connection?.reads.map((read) => read.operation),
    ['pedidos'],
  )
})

test('publicar pelo papel: quem publica o app precisa poder cada operação que a versão declara, e o dono, que pode, publica', async (t) => {
  const on = await appCalls(t, { declared: [{ connector: 'sankhya', operations: ['empresas'] }] })
  await on.connect('Matriz')
  await on.hub.test.asOwner('update apps.app set published_version_id = null')
  await on.hub.test.asOwner(
    "update auth.member set role = 'developer' where company_id = $1 and user_id = $2",
    [on.companyId, on.bruno.id],
  )
  const changed = await call(
    on.hub,
    on.ana,
    'PUT',
    `/api/companies/${on.companyId}/roles/developer`,
    {
      connectors: { sankhya: ['pedidos'] },
      unattended: false,
    },
  )
  assert.equal(changed.statusCode, 200, changed.body)
  const route = `/api/companies/${on.companyId}/projects/${on.projectId}/published-version`
  const refused = await call(on.hub, on.bruno, 'PUT', route, { number: 1 })
  assert.equal(refused.statusCode, 409, refused.body)
  assert.equal(Object(refused.json()).code, 'NOT_IN_ROLE')
  assert.equal(Object(refused.json()).operation, operationLabel('sankhya', 'empresas'))
  const [none] = await on.hub.test.asOwner('select published_version_id from apps.app')
  assert.equal(Object(none).published_version_id, null)
  assert.equal((await call(on.hub, on.ana, 'PUT', route, { number: 1 })).statusCode, 200)
})

test('mudar o Membro: sem o Financeiro, o Assistente do Membro não traz contasAReceber e a leitura dá NOT_IN_ROLE com o papel, sem pedido ao dublê', async (t) => {
  const on = await appCalls(t)
  const matriz = ConnectionId.parse(await on.connect('Matriz'))
  const base = `/api/companies/${on.companyId}`
  const financeiro = ['contasAReceber', 'contasAPagar']
  const changed = await call(on.hub, on.ana, 'PUT', `${base}/roles/member`, {
    connectors: { sankhya: SANKHYA_READS.filter((read) => !financeiro.includes(read)) },
    unattended: false,
  })
  assert.equal(changed.statusCode, 200, changed.body)
  const scope: SessionScope = {
    companyId: CompanyId.parse(on.companyId),
    personId: PersonId.parse(on.carla.id),
    place: { kind: 'PROJECT', projectId: ProjectId.parse(on.projectId) },
    chosen: [matriz],
  }
  const [connection] = await on.hub.connectors.assistant.connections(scope)
  const offered = connection?.reads.map((read) => read.operation) ?? []
  assert.ok(offered.includes('pedidos'))
  assert.ok(!offered.includes('contasAReceber'))
  const before = on.hub.lines.filter((line) => line.message === 'CONNECTOR_CALLED').length
  const refused = await on.hub.connectors.assistant.read(scope, {
    connectionId: matriz,
    turn: TurnKey.parse(randomUUID()),
    operation: 'contasAReceber',
    input: { page: 0 },
  })
  assert.deepEqual(refused, { kind: 'NOT_IN_ROLE', role: 'member', operation: 'contasAReceber' })
  assert.equal(on.hub.lines.filter((line) => line.message === 'CONNECTOR_CALLED').length, before)
})

test('a versão publicada roda para quem conversa sem a operação: a que declara empresas lê para um Atendente que só tem pedidos, e sem a versão ele é recusado', async (t) => {
  const on = await atendenteOn(t)
  const declared = [{ connectionId: on.matriz, operation: OperationId.parse('empresas') }]
  assert.equal((await on.ask('empresas')).kind, 'NOT_IN_ROLE')
  const version = { ...on.scope(), speaksAs: { kind: 'VERSION', declared } } as const
  const answered = await on.ask('empresas', { page: 0 }, version)
  assert.equal(answered.kind, 'OK')
  assert.equal(on.called(), 1)
})
