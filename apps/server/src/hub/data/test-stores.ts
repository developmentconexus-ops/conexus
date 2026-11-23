import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { CompanyId, ConnectionId, PersonId } from '@conexus/hub-api'
import { createCompanyDatabase } from '../../platform/test-company-postgres.ts'
import { CopyDefinitionV2 } from '../connectors/public.ts'
import { linkMercadoLivre, mercadoLivreOn, testOf } from '../connectors/test-connections.ts'
import { plantCopy } from '../copies/test-planted.ts'
import { post } from '../identity/test-hub.ts'

export const STORE_A = { ref: '111000111', label: 'LOJA_A' }
export const STORE_B = { ref: '222000222', label: 'LOJA_B' }

const ORDERS_COPY = CopyDefinitionV2.parse({
  version: 2,
  source: { kind: 'OPERATION', operation: 'pedidos', input: {} },
  description: 'Os pedidos de cada loja',
  columns: [
    { name: 'id', type: 'bigint', path: 'id', description: 'O número do pedido' },
    { name: 'status', type: 'text', path: 'status', description: 'A situação do pedido' },
    {
      ...{ name: 'atualizado', type: 'timestamp', path: 'date_last_updated' },
      description: 'Quando o pedido mudou pela última vez',
    },
  ],
  key: ['id'],
  changedSince: null,
})

export async function storeWithOrders(t: TestContext) {
  const on = await mercadoLivreOn(t)
  const { hub, ana } = on
  const companyId = CompanyId.parse(on.companyId)
  on.fake.switches.account = STORE_A
  const linked = await linkMercadoLivre(hub, ana, companyId, {
    ...{ connector: 'mercado-livre', name: 'Loja A' },
  })
  assert.equal(Object(linked.json()).result, 'LINKED', linked.body)
  const connection = ConnectionId.parse(Object(linked.json()).connection.id)
  const tested = await testOf(hub, ana, on.base, connection)
  assert.equal(Object(tested.json()).connection?.state, 'ACTIVE', tested.body)
  const made = await post(hub, ana, `/api/companies/${companyId}/projects`, { name: 'Pedidos' })
  assert.equal(made.statusCode, 201, made.body)
  const [neonProject] = hub.neon.projects()
  assert.ok(neonProject, 'the company database')
  const owner = await createCompanyDatabase(t)
  hub.neon.ownedBy(neonProject.id, owner)
  const anaId = PersonId.parse(ana.id)
  await plantCopy(
    { hub, companyId, anaId, owner },
    'pedidos',
    ORDERS_COPY,
    { connector: 'mercado-livre', connection },
    { runs: [{ outcome: 'COMPLETE' }] },
  )
  return { hub, companyId, anaId, connection }
}
