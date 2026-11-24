import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { CompanyId, ConnectionId, PersonId } from '@conexus/hub-api'
import { linkMercadoLivre, mercadoLivreOn, testOf } from '../connectors/test-connections.ts'

export const STORE_A = { ref: '111000111', label: 'LOJA_A' }
export const STORE_B = { ref: '222000222', label: 'LOJA_B' }

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
  const anaId = PersonId.parse(ana.id)
  return { hub, companyId, anaId, connection }
}
