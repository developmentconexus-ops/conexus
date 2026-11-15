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

/** Empresa A's Sankhya, the member's role holding the search. */
async function sankhyaOn(t: TestContext) {
  const on = await appCalls(t, {
    declared: [{ connector: 'sankhya', operations: ['buscarParceiros'] }],
  })
  const connectionId = ConnectionId.parse(await on.connect('Matriz'))
  const companyId = CompanyId.parse(on.companyId)
  const projectId = ProjectId.parse(on.projectId)
  const reads = { sankhya: ['buscarParceiros'] }
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

const ML_READS = { 'mercado-livre': ['pedidos', 'notaFiscalDoPedido'] }
const PARTNER = { codigos: [202] }
const PARTNER_DOCUMENT = '11122233344'

test('o Builder lê pedidos e recebe o comprador como o dublê manda', async (t) => {
  const on = await shopOn(t, ML_READS)
  const orders = await on.read({ kind: 'builder', person: on.carla }, 'pedidos', { limit: 2 })
  assert.equal(orders.kind, 'OK')
  const shown = JSON.stringify(orders)
  assert.ok(
    shown.includes('"buyer"') && shown.includes('COMPRADORFICTICIO'),
    'the buyer comes whole',
  )
})

test('o Assistente e o Builder recebem a nota com o documento de quem recebe', async (t) => {
  const on = await shopOn(t, ML_READS)
  for (const kind of ['assistant', 'builder'] as const) {
    const invoice = await on.read({ kind, person: on.carla }, 'notaFiscalDoPedido', {
      orderId: '2000000000001',
    })
    assert.equal(invoice.kind, 'OK', kind)
    assert.ok(JSON.stringify(invoice).includes('52998224725'), `${kind}: the recipient's document`)
  }
})

test('o membro com a leitura buscarParceiros recebe o parceiro com o documento', async (t) => {
  const on = await sankhyaOn(t)
  for (const person of [on.carla, on.ana]) {
    const text = JSON.stringify(await on.ask(person, 'buscarParceiros', PARTNER))
    assert.ok(text.includes('MARIA APARECIDA'), 'the partner comes with its name')
    assert.ok(text.includes(PARTNER_DOCUMENT), 'the partner comes with its document')
  }
})

test('o membro sem a leitura recebe NOT_IN_ROLE', async (t) => {
  const on = await sankhyaOn(t)
  const role = await call(on.hub, on.ana, 'PUT', `/api/companies/${on.companyId}/roles/member`, {
    connectors: { sankhya: ['consultar'] },
    unattended: false,
  })
  assert.equal(role.statusCode, 200, role.body)
  const refused = await on.ask(on.carla, 'buscarParceiros', PARTNER)
  assert.equal(refused.kind, 'NOT_IN_ROLE')
  assert.ok(!JSON.stringify(refused).includes(PARTNER_DOCUMENT))
})

test('o app recebe o mesmo parceiro, com o documento', async (t) => {
  const on = await sankhyaOn(t)
  const byApp = await on.read({ operation: 'buscarParceiros', input: PARTNER })
  assert.ok(JSON.stringify(byApp.json()).includes(PARTNER_DOCUMENT))
})
