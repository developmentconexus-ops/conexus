import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ConnectionId } from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import type { ConnectorAccess } from '../public.ts'
import { connectorTools, unansweredRead } from '../public.ts'

const SANKHYA = ConnectionId.parse('11111111-1111-4111-8111-111111111111')
const MARK = /\[\d+ characters cut\]/
const KINDS = ['REFUSED', 'AUTH_REFUSED', 'UNREADABLE'] as const
const CEILING = 41_000

type Native = { status: number; code: string | null; message: string | null; body: unknown }

function characters(text: string) {
  return Array.from(text).length
}

const GRANTED = {
  ...{ connectionId: SANKHYA, connector: 'sankhya', name: 'Matriz' },
  reads: [{ operation: 'consultar', label: 'Consultas', summary: 'consulta', list: null }],
}

function accessOf(read: ConnectorAccess['read']): ConnectorAccess {
  return {
    connections: [GRANTED],
    read,
    log: { info: () => undefined, error: () => undefined },
    notes: async () => null,
    wording: { whose: 'x' },
  }
}

async function readRefused(kind: (typeof KINDS)[number], native: Native) {
  const access = accessOf(async () => ({ kind, native }))
  const read = Object(connectorTools(access, { noteSave: false })).connector_read
  return read.execute(
    { connection: 'Matriz', operation: 'sankhya.consultar', input: {} },
    { requestContext: new RequestContext() },
  )
}

const BIG_BODY = { details: 'x'.repeat(1_000_000) }
const BIG_MESSAGE = 'y'.repeat(100_000)

for (const kind of KINDS) {
  test(`o teto ao modelo vale na recusa ${kind} de uma leitura: o texto inteiro que ele lê tem menos de 41.000 caracteres e a marca de corte, e o registro guarda tudo`, async () => {
    const native = { status: 502, code: '0', message: BIG_MESSAGE, body: BIG_BODY }
    const told = await readRefused(kind, native)
    assert.ok(characters(JSON.stringify(told)) < CEILING, `${characters(JSON.stringify(told))}`)
    assert.match(String(told.native.body), MARK)
    assert.equal(BIG_BODY.details.length, 1_000_000, 'the answer the Hub records is not touched')
    assert.equal(BIG_MESSAGE.length, 100_000)
  })

  test(`o teto ao modelo vale na recusa ${kind} que o teste de ferramenta do Construtor lê`, () => {
    const native = { status: 502, code: null, message: BIG_MESSAGE, body: BIG_BODY }
    const told = JSON.stringify(unansweredRead({ kind, native }))
    assert.ok(characters(told) < CEILING, `${characters(told)}`)
  })
}

test('um corpo de emoji não é partido ao meio, e a mensagem e o corpo curtos chegam como vieram', async () => {
  const emoji = { status: 401, code: 'X', message: null, body: { details: '😀'.repeat(100_000) } }
  const cut = await readRefused('AUTH_REFUSED', emoji)
  assert.ok(cut.native.body.isWellFormed(), 'no character is cut in half')
  assert.ok(characters(cut.native.body) < CEILING)
  const small = { status: 403, code: 'X', message: 'Sem permissão', body: { a: 1 } }
  assert.deepEqual(await readRefused('REFUSED', small), { kind: 'REFUSED', native: small })
})
