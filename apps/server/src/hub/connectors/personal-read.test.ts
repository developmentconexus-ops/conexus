import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { CompanyId, ConnectionId, PersonId, ProjectId, RunId } from '@conexus/hub-api'
import type { Person } from '../identity/test-hub.ts'
import { call, post } from '../identity/test-hub.ts'
import type { SessionScope } from './public.ts'
import { TurnKey } from './public.ts'
import { appCalls } from './test-app-calls.ts'
import { linkMercadoLivre, mercadoLivreOn, testOf } from './test-connections.ts'

const BUYER_NAME = 'Fictícia'
const CPF = '52998224725'
const PLANTED = [BUYER_NAME, 'maria.ficticia', CPF, 'COMPRADORFICTICIO', 'Rua Inventada']
const ORDER = { orderId: '2000000000001' }

type Reader = { kind: 'assistant' | 'builder'; person: Person }

/** Empresa Teste with Loja 1 linked, tested and released to the Projeto; the member's role holds `reads`. */
async function shopOn(t: TestContext, reads: Record<string, string[]>) {
  const on = await mercadoLivreOn(t)
  const linked = await linkMercadoLivre(on.hub, on.ana, on.companyId)
  const connectionId = ConnectionId.parse(Object(linked.json()).connection.id)
  await testOf(on.hub, on.ana, on.base, connectionId)
  return withRole(on, connectionId, reads)
}

async function withRole(
  on: Awaited<ReturnType<typeof mercadoLivreOn>>,
  connectionId: ConnectionId,
  reads: Record<string, string[]>,
) {
  const company = `/api/companies/${on.companyId}`
  const made = await post(on.hub, on.ana, `${company}/projects`, { name: 'Vendas' })
  const projectId = ProjectId.parse(Object(made.json()).project.id)
  const grant = `${company}/projects/${projectId}/connections/${connectionId}`
  assert.equal((await call(on.hub, on.ana, 'PUT', grant)).statusCode, 200)
  const role = await call(on.hub, on.ana, 'PUT', `${company}/roles/member`, {
    connectors: reads,
    unattended: false,
  })
  assert.equal(role.statusCode, 200, role.body)
  const companyId = CompanyId.parse(on.companyId)
  async function read(reader: Reader, operation: string, input: unknown) {
    const personId = PersonId.parse(reader.person.id)
    if (reader.kind === 'builder')
      return on.hub.connectors.builder.read(
        { companyId, projectId },
        { connectionId, personId, runId: RunId.parse(randomUUID()), operation, input },
      )
    const scope: SessionScope = {
      companyId,
      personId,
      place: { kind: 'PROJECT', projectId },
      chosen: [connectionId],
    }
    const turn = TurnKey.parse(randomUUID())
    return on.hub.connectors.assistant.read(scope, { connectionId, turn, operation, input })
  }
  return { ...on, read }
}

const ML_READS = { 'mercado-livre': ['pedidos', 'envio', 'notaFiscalDoPedido'] }

test('Assistente e Builder recebem contato e endereço, e perdem o documento', async (t) => {
  const on = await shopOn(t, ML_READS)
  for (const kind of ['assistant', 'builder'] as const) {
    const reader = { kind, person: on.carla }
    const orders = JSON.stringify(await on.read(reader, 'pedidos', { limit: 2 }))
    assert.ok(orders.includes(BUYER_NAME) && orders.includes('COMPRADORFICTICIO'), `${kind}: buyer`)
    assert.ok(!orders.includes('billing_info') && !orders.includes(CPF), `${kind}: no document`)
    const shipment = JSON.stringify(await on.read(reader, 'envio', { shipmentId: '40000000001' }))
    assert.ok(shipment.includes('receiver_name') && shipment.includes('Campinas'), `${kind}: envio`)
  }
})

test('o documento não vai ao modelo, nem para o dono', async (t) => {
  const on = await shopOn(t, ML_READS)
  for (const kind of ['assistant', 'builder'] as const) {
    const owner = { kind, person: on.ana }
    const orders = JSON.stringify(await on.read(owner, 'pedidos', { limit: 2 }))
    assert.ok(orders.includes(BUYER_NAME), `${kind}: the owner reads the buyer`)
    assert.ok(!orders.includes(CPF) && !orders.includes('billing_info'), `${kind}: pedidos`)
    const invoice = await on.read(owner, 'notaFiscalDoPedido', ORDER)
    assert.equal(invoice.kind, 'OK')
    assert.ok(!JSON.stringify(invoice).includes(CPF), `${kind}: notaFiscalDoPedido`)
    assert.ok(!JSON.stringify(invoice).includes('recipient'), `${kind}: notaFiscalDoPedido`)
  }
})

test('o registro sem o valor', async (t) => {
  const on = await shopOn(t, ML_READS)
  await on.read({ kind: 'assistant', person: on.carla }, 'pedidos', { limit: 2 })
  await on.read({ kind: 'builder', person: on.ana }, 'notaFiscalDoPedido', ORDER)
  const called = on.hub.lines.filter((line) => line.message === 'CONNECTOR_CALLED')
  assert.deepEqual(
    called.map(({ fields }) => [fields.operation, fields.personal, fields.withheld]),
    [
      ['pedidos', 'contato', 'documento'],
      ['notaFiscalDoPedido', '', 'documento'],
    ],
  )
  const logged = JSON.stringify(on.hub.lines)
  for (const value of PLANTED) assert.ok(!logged.includes(value), `the log carries ${value}`)
})

/** Empresa A's Sankhya, the member's role holding the search and the door. */
async function sankhyaOn(t: TestContext) {
  const on = await appCalls(t, {
    declared: [{ connector: 'sankhya', operations: ['buscarParceiros'] }],
  })
  const connectionId = ConnectionId.parse(await on.connect('Matriz'))
  const companyId = CompanyId.parse(on.companyId)
  const projectId = ProjectId.parse(on.projectId)
  const reads = { sankhya: ['buscarParceiros', 'consultar', 'carregar'] }
  const role = await call(on.hub, on.ana, 'PUT', `/api/companies/${companyId}/roles/member`, {
    connectors: reads,
    unattended: false,
  })
  assert.equal(role.statusCode, 200, role.body)
  function ask(person: Person, operation: string, input: unknown) {
    const scope: SessionScope = {
      companyId,
      personId: PersonId.parse(person.id),
      place: { kind: 'PROJECT', projectId },
      chosen: [connectionId],
    }
    const turn = TurnKey.parse(randomUUID())
    return on.hub.connectors.assistant.read(scope, { connectionId, turn, operation, input })
  }
  return { ...on, ask }
}

const PARTNER = { codigos: [202] }

test('Sankhya: o membro com a leitura recebe o parceiro, sem o documento', async (t) => {
  const on = await sankhyaOn(t)
  for (const person of [on.carla, on.ana]) {
    const text = JSON.stringify(await on.ask(person, 'buscarParceiros', PARTNER))
    assert.ok(text.includes('MARIA APARECIDA'), 'the partner comes with its name')
    assert.ok(!text.includes('11122233344') && !text.includes('"documento"'), 'no document')
  }
})

test('a porta fica como hoje', async (t) => {
  const on = await sankhyaOn(t)
  const sql = 'SELECT CODPARC, NOMEPARC, CGC_CPF FROM TGFPAR WHERE CODPARC = 202'
  const loading = { entidade: 'Empresa', campos: ['CODEMP', 'NOMEFANTASIA'], pagina: 0 }
  for (const [operation, input] of [
    ['consultar', { sql }],
    ['carregar', loading],
  ] as const) {
    const byOwner = await on.ask(on.ana, operation, input)
    assert.equal(byOwner.kind, 'OK', operation)
    assert.deepEqual(await on.ask(on.carla, operation, input), byOwner, operation)
  }
  assert.ok(JSON.stringify(await on.ask(on.carla, 'consultar', { sql })).includes('11122233344'))
})

test('o documento vai ao app e não ao Assistente', async (t) => {
  const on = await sankhyaOn(t)
  const byAssistant = JSON.stringify(await on.ask(on.ana, 'buscarParceiros', PARTNER))
  assert.ok(byAssistant.includes('MARIA APARECIDA') && !byAssistant.includes('11122233344'))
  const byApp = await on.read({ operation: 'buscarParceiros', input: PARTNER })
  assert.ok(JSON.stringify(byApp.json()).includes('11122233344'), 'the app receives every kind')
})
