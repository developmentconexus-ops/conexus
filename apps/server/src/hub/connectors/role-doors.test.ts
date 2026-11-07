import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { CompanyId, ConnectionId, PersonId, ProjectId, RunId } from '@conexus/hub-api'
import { ATENDENTE } from '../identity/roles-world.ts'
import { call, post } from '../identity/test-hub.ts'
import type { SessionScope } from './public.ts'
import { TurnKey } from './public.ts'
import { appCalls } from './test-app-calls.ts'

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
  const scope = (place: 'PROJECT' | 'COMPANY' = 'PROJECT'): SessionScope => ({
    companyId,
    personId: PersonId.parse(on.carla.id),
    place: place === 'PROJECT' ? { kind: 'PROJECT', projectId } : { kind: 'COMPANY' },
    chosen: [matriz],
  })
  const ask = (operation: string, input: unknown = { page: 0 }, at = scope()) =>
    on.hub.connectors.assistant.read(at, {
      connectionId: matriz,
      turn: TurnKey.parse(randomUUID()),
      operation,
      input,
    })
  const called = () => on.hub.lines.filter((line) => line.message === 'CONNECTOR_CALLED').length
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
  const read = (operation: string, input: unknown) =>
    on.hub.connectors.builder.read(on.ids, {
      connectionId: on.matriz,
      personId: on.ids.personId,
      runId: RunId.parse(randomUUID()),
      operation,
      input,
    })
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
