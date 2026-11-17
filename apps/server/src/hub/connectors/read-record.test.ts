import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { CompanyId, ConnectionId, OperationId, PersonId, ProjectId, RunId } from '@conexus/hub-api'
import { principalFor } from '../access/public.ts'
import { chooserAt, versionAt } from '../access/test-principal.ts'
import { ordersCopy, STORE_A, storesOn } from '../copies/test-sources.ts'
import { call, post } from '../identity/test-hub.ts'
import { TurnKey } from './public.ts'
import { appCalls } from './test-app-calls.ts'
import { linkMercadoLivre, mercadoLivreOn, testOf } from './test-connections.ts'

async function shopOn(t: TestContext, reads: string[]) {
  const on = await mercadoLivreOn(t)
  const linked = await linkMercadoLivre(on.hub, on.ana, on.companyId)
  const connectionId = ConnectionId.parse(Object(linked.json()).connection.id)
  await testOf(on.hub, on.ana, on.base, connectionId)
  const company = `/api/companies/${on.companyId}`
  const made = await post(on.hub, on.ana, `${company}/projects`, { name: 'Vendas' })
  const projectId = ProjectId.parse(Object(made.json()).project.id)
  const grant = `${company}/projects/${projectId}/connections/${connectionId}`
  assert.equal((await call(on.hub, on.ana, 'PUT', grant)).statusCode, 200)
  const role = await call(on.hub, on.ana, 'PUT', `${company}/roles/member`, {
    connectors: { 'mercado-livre': reads },
    unattended: false,
  })
  assert.equal(role.statusCode, 200, role.body)
  const companyId = CompanyId.parse(on.companyId)
  const personId = PersonId.parse(on.carla.id)
  const place = { kind: 'PROJECT', projectId } as const
  const operation = 'pedidos'
  const input = { limit: 2 }
  function through(
    scope: Parameters<typeof on.hub.connectors.assistant.read>[0],
    name = operation,
  ) {
    const turn = TurnKey.parse(randomUUID())
    return on.hub.connectors.assistant.read(scope, { connectionId, turn, operation: name, input })
  }
  const declared = [{ connectionId, operation: OperationId.parse(operation) }]
  const scopes = {
    assistant: chooserAt({ companyId, personId, place }, [connectionId]),
    construtor: principalFor({ consumer: 'construtor', companyId, personId, projectId }),
    agent: versionAt({ companyId, personId, place }, declared, [connectionId]),
  }
  function records() {
    return on.hub.test.asOwner(
      'select * from data.data_read where company_id = $1 order by at, id',
      [on.companyId],
    )
  }
  function builder() {
    return on.hub.connectors.builder.read(
      { companyId, projectId },
      { connectionId, personId, runId: RunId.parse(randomUUID()), operation, input },
    )
  }
  return { ...on, through, scopes, records, builder, connectionId, projectId, personId }
}

test('a leitura ao vivo deixa uma linha LIVE', async (t) => {
  const on = await shopOn(t, ['pedidos'])
  for (const scope of [on.scopes.assistant, on.scopes.construtor, on.scopes.agent]) {
    assert.equal((await on.through(scope)).kind, 'OK')
  }
  assert.equal((await on.builder()).kind, 'OK')
  const records = await on.records()
  assert.deepEqual(
    records.map((record) => record.agent),
    ['ASSISTANT', 'CONSTRUTOR', 'AGENT', 'BUILDER'],
  )
  for (const record of records) {
    assert.equal(record.verb, 'LIVE')
    assert.equal(record.connection_id, on.connectionId)
    assert.equal(record.operation, 'pedidos')
    assert.equal(record.outcome, 'OK')
    assert.equal(record.rows, null)
    assert.deepEqual(record.tables, [])
    assert.equal(record.person_id, on.personId)
    assert.equal(record.project_id, on.projectId)
  }
})

test('a cópia não entra no Registro', async (t) => {
  const on = await storesOn(t, { stores: [STORE_A] })
  const copyId = await on.planted('pedidos', ordersCopy(false), [STORE_A.ref])
  assert.deepEqual(await on.ended(copyId), { kind: 'COMPLETE' })
  const records = await on.hub.test.asOwner('select * from data.data_read where company_id = $1', [
    on.companyId,
  ])
  assert.deepEqual(records, [])
})

test('a leitura ao vivo recusada deixa linha', async (t) => {
  const on = await shopOn(t, ['notaFiscalDoPedido'])
  const refused = await on.through(on.scopes.assistant)
  assert.equal(refused.kind, 'NOT_IN_ROLE')
  const [record, ...rest] = await on.records()
  assert.deepEqual(rest, [])
  assert.equal(record?.outcome, 'NOT_IN_ROLE')
  assert.equal(record?.verb, 'LIVE')
  assert.equal(record?.rows, null)
})

test('sem linha, a leitura ao vivo não devolve o valor', async (t) => {
  const on = await shopOn(t, ['pedidos'])
  await on.hub.test.asOwner(`create function data.refuse_read() returns trigger language plpgsql as $$
    begin raise exception 'down' using errcode = '57P01'; end $$`)
  await on.hub.test.asOwner(
    'create trigger refuse before insert on data.data_read for each row execute function data.refuse_read()',
  )
  const answer = await on.through(on.scopes.assistant)
  assert.deepEqual(answer, { kind: 'UNREACHABLE' })
  assert.deepEqual(await on.records(), [])
  assert.ok(on.hub.lines.some(({ message }) => message === 'DATA_READ_UNRECORDED'))
})

test('a leitura do app deixa uma linha APP', async (t) => {
  const on = await appCalls(t, {
    declared: [{ connector: 'sankhya', operations: ['buscarParceiros'] }],
  })
  await on.connect('Matriz')
  const answer = await on.read({ operation: 'buscarParceiros', input: { codigos: [202] } })
  assert.equal(answer.statusCode, 200, answer.body)
  const records = await on.hub.test.asOwner('select * from data.data_read where company_id = $1', [
    on.companyId,
  ])
  assert.deepEqual(
    records.map((record) => [record.agent, record.verb, record.outcome, record.project_id]),
    [['APP', 'LIVE', 'OK', on.projectId]],
  )
})
