import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { connectorOf } from '@conexus/connectors'
import { CompanyId, PersonId, ProjectId, RunId } from '@conexus/hub-api'
import { call } from '../identity/test-hub.ts'
import { appCalls, readOf } from './test-app-calls.ts'

test('a porta da borda: com sessão e a ligação liberada o app lê e recebe OK com as linhas', async (t) => {
  const on = await appCalls(t)
  await on.connect('Matriz')
  const read = await on.read()
  assert.equal(read.statusCode, 200, read.body)
  const answer = Object(read.json())
  assert.equal(answer.kind, 'OK')
  assert.ok(Array.isArray(answer.value.linhas) && answer.value.linhas.length > 0)
  const names = await on.hub.edge.inject({
    method: 'GET',
    url: '/api/app-connector-calls/connections?host=pedidos--empresa-a&connector=sankhya',
    headers: { 'x-conexus-app-session': on.session },
  })
  assert.deepEqual(names.json(), { names: ['Matriz'] })
})

test('toda recusa de admissão é a mesma NOT_GRANTED', async (t) => {
  const on = await appCalls(t, { declared: [{ connector: 'sankhya', operations: ['empresas'] }] })
  const id = await on.connect('Matriz', false)
  const refused = []
  refused.push(await on.read())
  assert.equal((await call(on.hub, on.ana, 'PUT', on.routes.grant(id))).statusCode, 200)
  refused.push(await on.read({ operation: 'clientes' }))
  refused.push(await on.read({ operation: 'inexistente' }))
  refused.push(await on.read({ connection: 'Outra' }))
  refused.push(await on.read({ connector: 'mercado-livre' }))
  await on.hub.test.asOwner("update connectors.connection set state = 'NEEDS_REAUTH'")
  refused.push(await on.read())
  for (const response of refused) {
    assert.equal(response.statusCode, 200)
    assert.deepEqual(response.json(), { kind: 'NOT_GRANTED' })
  }
})

test('só leitura: uma operação que não é read nunca é lida pela porta', () => {
  const sankhya = connectorOf('sankhya')
  const empresas = sankhya?.operations.find((operation) => operation.id === 'empresas')
  assert.ok(sankhya && empresas)
  const withWrite = { ...sankhya, operations: [{ ...empresas, class: 'write' as const }] }
  assert.equal(readOf(withWrite, 'empresas'), undefined)
  assert.equal(readOf(sankhya, 'empresas')?.id, 'empresas')
})

test('só leitura nas duas portas: uma operação de escrita no kit nunca é lida, pelo app nem pelo Builder', async (t) => {
  const on = await appCalls(t)
  await on.connect('Matriz')
  const sankhya = connectorOf('sankhya')
  const index = sankhya?.operations.findIndex((operation) => operation.id === 'empresas') ?? -1
  const original = sankhya?.operations[index]
  assert.ok(sankhya && original)
  Reflect.set(sankhya.operations, index, { ...original, class: 'write' })
  t.after(() => Reflect.set(sankhya.operations, index, original))
  assert.deepEqual((await on.read()).json(), { kind: 'NOT_GRANTED' })
  const ids = { companyId: CompanyId.parse(on.companyId), projectId: ProjectId.parse(on.projectId) }
  const [granted] = await on.hub.connectors.builder.granted(ids)
  assert.ok(granted)
  const built = await on.hub.connectors.builder.read(ids, {
    connectionId: granted.connectionId,
    personId: PersonId.parse(on.ana.id),
    runId: RunId.parse(randomUUID()),
    operation: 'empresas',
    input: { page: 0 },
  })
  assert.equal(built.kind, 'NOT_GRANTED')
})
