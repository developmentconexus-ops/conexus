import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ConnectionId } from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import type { ConnectorAccess } from '../connectors/public.ts'
import { connectorTools } from '../connectors/public.ts'
import type { InventoryCall } from './public.ts'

const SANKHYA = ConnectionId.parse('11111111-1111-4111-8111-111111111111')
const LOJA = ConnectionId.parse('22222222-2222-4222-8222-222222222222')

function connection(connector: string, connectionId: ConnectionId, name: string) {
  return { connectionId, connector, name, reads: [] }
}

const QUIET = { info: () => undefined, error: () => undefined }

function toolsOver(connections: ConnectorAccess['connections']) {
  const asked: InventoryCall[] = []
  const access: ConnectorAccess = {
    connections,
    read: () => Promise.reject(new Error('o inventário não lê do sistema')),
    log: QUIET,
    wording: { whose: 'x', limit: 'y' },
  }
  const tools = connectorTools(access, {
    reads: false,
    inventory: async (call) => {
      asked.push(call)
      return {
        kind: 'OK',
        readAt: '2026-11-13T12:00:00.000Z',
        entries: [
          { kind: 'FIELD', name: 'TGFCAB.AD_CANAL', type: 'I', label: 'Canal', custom: true },
        ],
        more: false,
      }
    },
  })
  return { tools, asked }
}

function run(tools: object, input: object) {
  return Object(tools).inventory_search.execute(input, { requestContext: new RequestContext() })
}

test('inventory_search lê o inventário da conexão que o turno oferece, sem chamar o sistema', async () => {
  const { tools, asked } = toolsOver([connection('sankhya', SANKHYA, 'Matriz')])
  const found = await run(tools, { connection: 'Matriz', text: 'canal', limit: 5 })
  assert.equal(found.kind, 'OK')
  assert.equal(found.entries[0].custom, true)
  assert.deepEqual(asked, [{ connectionId: SANKHYA, text: 'canal', kind: undefined, limit: 5 }])
})

test('inventory_search: uma conexão fora do acesso é NOT_GRANTED, e o nome repetido pede o conector', async () => {
  const { tools, asked } = toolsOver([
    connection('sankhya', SANKHYA, 'Matriz'),
    connection('mercado-livre', LOJA, 'Matriz'),
  ])
  const outside = await run(tools, {
    connection: 'Matriz',
    connector: 'tiny',
    text: 'canal',
    limit: 5,
  })
  assert.deepEqual(outside, { kind: 'NOT_GRANTED' })
  const twice = await run(tools, { connection: 'Matriz', text: 'canal', limit: 5 })
  assert.deepEqual(twice, { kind: 'AMBIGUOUS_CONNECTION' })
  assert.equal(asked.length, 0)
  const named = await run(tools, {
    connection: 'Matriz',
    connector: 'mercado-livre',
    text: 'canal',
    limit: 1,
  })
  assert.equal(named.kind, 'OK')
  assert.equal(asked[0]?.connectionId, LOJA)
})
