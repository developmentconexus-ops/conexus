import assert from 'node:assert/strict'
import { test } from 'node:test'
import { connectorOf } from '@conexus/connectors'
import { CompanyId, ConnectionId, PersonId, ProjectId } from '@conexus/hub-api'
import { plantCompany } from '../identity/test-hub.ts'
import type { SessionScope } from './public.ts'
import { appCalls } from './test-app-calls.ts'

test('operationOf: uma leitura de uma ligação que o Projeto recebeu dá a entrada do kit; uma operação que não é leitura, uma ligação não recebida, o membro e outra empresa, nada', async (t) => {
  const on = await appCalls(t)
  const matriz = ConnectionId.parse(await on.connect('Matriz'))
  const filial = ConnectionId.parse(await on.connect('Filial', false))
  const elsewhere = CompanyId.parse(await plantCompany(on.hub.test, on.ana.id, 'Outra Empresa'))
  function scope(who: { id: string }, companyId = CompanyId.parse(on.companyId)): SessionScope {
    return {
      companyId,
      personId: PersonId.parse(who.id),
      place: { kind: 'PROJECT', projectId: ProjectId.parse(on.projectId) },
      chosen: [],
    }
  }
  const port = on.hub.connectors.assistant
  const kit = connectorOf('sankhya')?.operations.find((each) => each.id === 'pedidos')
  assert.ok(kit !== undefined)
  for (const who of [on.ana, on.bruno]) {
    const input = await port.operationOf(scope(who), { connectionId: matriz, operation: 'pedidos' })
    assert.equal(input, kit.input)
  }
  const refused = [
    await port.operationOf(scope(on.ana), { connectionId: matriz, operation: 'apagarPedido' }),
    await port.operationOf(scope(on.ana), { connectionId: filial, operation: 'pedidos' }),
    await port.operationOf(scope(on.carla), { connectionId: matriz, operation: 'pedidos' }),
    await port.operationOf(scope(on.ana, elsewhere), {
      connectionId: matriz,
      operation: 'pedidos',
    }),
  ]
  assert.deepEqual(refused, [undefined, undefined, undefined, undefined])
})
