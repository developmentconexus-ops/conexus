import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CODE, EXAMPLE_CALL, edge, SESSION } from './test-edge.ts'

const LIVE = { Cookie: `__Host-conexus-app=${SESSION}; __Host-conexus-binding=bindingsecreta` }

async function logged(hub: () => Response | Promise<Response>, path = '/') {
  const lines: string[] = []
  const original = console.error
  console.error = (line: string) => lines.push(line)
  try {
    await edge({ hub }).fetch(path, { headers: LIVE })
  } finally {
    console.error = original
  }
  return lines
}

const CASES = [
  ['NETWORK', () => Promise.reject(new TypeError('Network connection lost.'))],
  ['TOO_LARGE', () => Response.json({ ...EXAMPLE_CALL, padding: 'x'.repeat(20_000) })],
  ['UNREADABLE', () => Response.json({ caller: { personName: 'Ana' } })],
  ['UNEXPECTED_STATUS', () => new Response('<html>bad gateway</html>', { status: 502 })],
  ['TIMEOUT', () => Promise.reject(new DOMException('The operation timed out.', 'TimeoutError'))],
] as const

for (const [reason, hub] of CASES) {
  test(`log do Hub sem resposta: ${reason}, e nada do pedido`, async () => {
    const lines = await logged(hub, '/pedidos?cliente=Maria')
    assert.deepEqual(
      lines.map((line) => JSON.parse(line)),
      [{ level: 50, msg: 'EDGE_HUB_UNAVAILABLE', status: 503, reason }],
    )
    for (const secret of [
      SESSION,
      'bindingsecreta',
      'Maria',
      'pedidos',
      'pedidos--empresa-a',
      CODE,
    ]) {
      assert.ok(!(lines[0] ?? '').includes(secret), secret)
    }
  })
}

test('log da passagem sem resposta do Hub: a razão, e nada do pedido', async () => {
  const lines: string[] = []
  const original = console.error
  console.error = (line: string) => lines.push(line)
  try {
    await edge({ hub: () => Promise.reject(new TypeError('down')) }).fetch(
      `/__conexus/passagem?code=${CODE}`,
      { headers: { Cookie: `__Host-conexus-binding=${'b'.repeat(43)}` } },
    )
  } finally {
    console.error = original
  }
  assert.deepEqual(
    lines.map((line) => JSON.parse(line)),
    [{ level: 50, msg: 'EDGE_HUB_UNAVAILABLE', status: 503, reason: 'NETWORK' }],
  )
})
