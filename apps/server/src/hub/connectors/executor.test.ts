import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { hubWithLog } from '../identity/test-hub.ts'
import { connectionsOn, linkSankhya, testOf } from './test-connections.ts'

test('a origem, o redirecionamento e o teto', async (t) => {
  const { hub, fake, ana, base } = await connectionsOn(t)
  const { connection } = Object((await linkSankhya(hub, ana, base, fake.credential)).json())

  fake.switches.redirect = true
  const redirected = await testOf(hub, ana, base, connection.id)
  assert.equal(Object(redirected.json()).result, 'UNREACHABLE')
  assert.equal(Object(redirected.json()).connection.state, 'NEW')
  fake.switches.redirect = false

  fake.switches.oversize = true
  const oversize = await testOf(hub, ana, base, connection.id)
  assert.equal(Object(oversize.json()).result, 'WORKING')
  const checks = Object(oversize.json()).checks.map((check: { outcome: string }) => check.outcome)
  assert.equal(checks[0], 'UNREADABLE')
  assert.ok(checks.every((outcome: string) => outcome !== 'READS'))
})

test('o Hub com a origem de um conector que o kit não tem não sobe', async (t) => {
  await assert.rejects(
    hubWithLog(t, (config) => ({
      ...config,
      connectorOrigins: new Map([['nenhum', 'http://127.0.0.1:4180']]),
    })),
    (error: unknown) => {
      assert.equal(Reflect.get(Object(error), 'code'), 'CONFIG_INVALID')
      return true
    },
  )
})

/** Testar on a Hub whose executor's fetch is `fetching` (the executor keeps the fetch of its start). */
async function testingWith(t: TestContext, fetching: () => Promise<Response>) {
  t.mock.method(globalThis, 'fetch', fetching)
  const on = await connectionsOn(t)
  const { connection } = Object(
    (await linkSankhya(on.hub, on.ana, on.base, on.fake.credential)).json(),
  )
  return { ...on, tested: await testOf(on.hub, on.ana, on.base, connection.id) }
}

function unreachableLines(lines: { message: string; fields: Record<string, unknown> }[]) {
  return lines.filter((line) => line.message === 'CONNECTOR_UNREACHABLE').map((line) => line.fields)
}

test('o fornecedor fora do ar é UNREACHABLE e uma linha de log com o tipo e o conector', async (t) => {
  const down = await testingWith(t, () => Promise.reject(new TypeError('fetch failed')))
  assert.equal(Object(down.tested.json()).result, 'UNREACHABLE')
  assert.deepEqual(unreachableLines(down.hub.lines), [{ kind: 'TypeError', connector: 'sankhya' }])
})

test('o prazo do fornecedor é UNREACHABLE e logado pelo tipo', async (t) => {
  const slow = await testingWith(t, () => Promise.reject(new DOMException('cut', 'TimeoutError')))
  assert.equal(Object(slow.tested.json()).result, 'UNREACHABLE')
  assert.deepEqual(unreachableLines(slow.hub.lines), [
    { kind: 'TimeoutError', connector: 'sankhya' },
  ])
})

test('um erro de programação dentro do envio sobe como falha, não vira UNREACHABLE', async (t) => {
  const bug = await testingWith(t, () => Promise.reject(new RangeError('bug')))
  assert.equal(bug.tested.statusCode, 500)
  assert.deepEqual(unreachableLines(bug.hub.lines), [])

  const broken = new ReadableStream({
    start: (controller) => controller.error(new RangeError('bug while reading')),
  })
  const reading = await testingWith(t, () => Promise.resolve(new Response(broken, { status: 200 })))
  assert.equal(reading.tested.statusCode, 500)
})

test('um corpo que não é JSON no login não é um erro: dá UNREACHABLE sem lançar', async (t) => {
  const html = await testingWith(t, () => Promise.resolve(new Response('<html>', { status: 200 })))
  assert.equal(Object(html.tested.json()).result, 'UNREACHABLE')
})
