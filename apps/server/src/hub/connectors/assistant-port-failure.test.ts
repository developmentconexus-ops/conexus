import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { CompanyId, ConnectionId, PersonId } from '@conexus/hub-api'
import type { SessionScope } from './public.ts'
import { TurnKey } from './public.ts'
import { appCalls } from './test-app-calls.ts'

test('uma falha inesperada ao checar o papel da pessoa não vira "sem acesso": a lista, a leitura e o caderno rejeitam com ela', async (t) => {
  const on = await appCalls(t)
  const matriz = ConnectionId.parse(await on.connect('Matriz', false))
  const scope: SessionScope = {
    companyId: CompanyId.parse(on.companyId),
    personId: PersonId.parse(on.ana.id),
    place: { kind: 'COMPANY' },
    chosen: [matriz],
  }
  const port = on.hub.connectors.assistant
  await on.hub.test.asOwner('alter table auth.member rename to member_gone')
  function broken(error: unknown) {
    return /relation "auth.member" does not exist/.test(String(Object(error).cause))
  }
  const call = {
    connectionId: matriz,
    turn: TurnKey.parse(randomUUID()),
    operation: 'empresas',
    input: {},
  }
  await assert.rejects(port.connections(scope), broken)
  await assert.rejects(port.read(scope, call), broken)
  await assert.rejects(port.notes(scope, matriz), broken)
})
