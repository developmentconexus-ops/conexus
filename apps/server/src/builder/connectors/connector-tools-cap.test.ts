import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ConnectionId } from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import type { ConnectorAccess } from './public.ts'
import { connectorTools } from './public.ts'

const SANKHYA = ConnectionId.parse('11111111-1111-4111-8111-111111111111')
const MARK = /\[\d+ characters cut\]/

function characters(text: string) {
  return Array.from(text).length
}

async function refused(native: {
  status: number
  code: string | null
  message: string | null
  body: unknown
}) {
  const access: ConnectorAccess = {
    connections: [
      {
        connectionId: SANKHYA,
        connector: 'sankhya',
        name: 'Matriz',
        reads: [{ operation: 'consultar', label: 'Consultas', summary: 'consulta' }],
      },
    ],
    // The Hub's record is made before the tool shapes what the model reads.
    read: async () => ({ kind: 'REFUSED', native }),
    log: { info: () => undefined, error: () => undefined },
    notes: async () => null,
    wording: { whose: 'x' },
  }
  const read = Object(connectorTools(access, { noteSave: false })).connector_read
  return read.execute(
    { connection: 'Matriz', operation: 'sankhya.consultar', input: {} },
    { requestContext: new RequestContext() },
  )
}

test('o teto ao modelo vale na leitura recusada: o corpo de 1 MB chega com o começo, o fim e a marca de corte, e o registro guarda tudo', async () => {
  const body = { details: 'x'.repeat(1_000_000) }
  const native = { status: 200, code: '0', message: 'y'.repeat(100_000), body }
  const told = await refused(native)
  assert.equal(told.kind, 'READ_FAILED')
  for (const text of [told.native.body, told.native.message, told.reason]) {
    assert.ok(characters(text) < 41_000 + 200, `${characters(text)}`)
  }
  assert.match(told.native.body, MARK)
  assert.match(told.native.message, MARK)
  assert.match(told.reason, MARK)
  assert.equal(native.body.details.length, 1_000_000, 'the answer the Hub records is not touched')
  assert.equal(native.message.length, 100_000)
})

test('o teto ao modelo vale também na recusa de acesso', async () => {
  const native = { status: 403, code: 'X', message: null, body: { details: '😀'.repeat(100_000) } }
  const told = await refused(native)
  assert.equal(told.kind, 'REFUSED')
  assert.ok(characters(told.native.body) < 41_000)
  assert.ok(told.native.body.isWellFormed(), 'no character is cut in half')
  assert.match(told.native.body, MARK)
})

test('o que cabe no teto chega como veio', async () => {
  const native = { status: 403, code: 'X', message: 'Sem permissão', body: { a: 1 } }
  assert.deepEqual(await refused(native), { kind: 'REFUSED', native })
})
