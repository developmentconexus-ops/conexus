import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { sankhyaFake } from '@conexus/connectors'
import { hubWithLog } from '../identity/test-hub.ts'
import { connectionsOn, linkSankhya, testOf } from './test-connections.ts'

/** The program's own fetch, taken before any test replaces the global one. */
const realFetch = globalThis.fetch

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
async function testingWith(t: TestContext, fetching: (request: Request) => Promise<Response>) {
  t.mock.method(globalThis, 'fetch', fetching)
  const on = await connectionsOn(t)
  const { connection } = Object(
    (await linkSankhya(on.hub, on.ana, on.base, on.fake.credential)).json(),
  )
  const tested = await testOf(on.hub, on.ana, on.base, connection.id)
  return { ...on, connectionId: connection.id, tested }
}

function unreachableLines(lines: { message: string; fields: Record<string, unknown> }[]) {
  return lines.filter((line) => line.message === 'CONNECTOR_UNREACHABLE').map((line) => line.fields)
}

test('o fornecedor fora do ar é UNREACHABLE e uma linha de log com o tipo e o conector', async (t) => {
  const down = await testingWith(t, () => Promise.reject(new TypeError('fetch failed')))
  assert.equal(Object(down.tested.json()).result, 'UNREACHABLE')
  assert.deepEqual(unreachableLines(down.hub.lines), [
    { kind: 'TypeError', connector: 'sankhya', connectionId: down.connectionId },
  ])
})

test('o prazo do fornecedor é UNREACHABLE e logado pelo tipo', async (t) => {
  const slow = await testingWith(t, () => Promise.reject(new DOMException('cut', 'TimeoutError')))
  assert.equal(Object(slow.tested.json()).result, 'UNREACHABLE')
  assert.deepEqual(unreachableLines(slow.hub.lines), [
    { kind: 'TimeoutError', connector: 'sankhya', connectionId: slow.connectionId },
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

test('uma falha de rede loga o código da causa', async (t) => {
  const refused = await testingWith(t, () =>
    Promise.reject(new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } })),
  )
  assert.deepEqual(unreachableLines(refused.hub.lines), [
    {
      kind: 'TypeError',
      cause: 'ECONNREFUSED',
      connector: 'sankhya',
      connectionId: refused.connectionId,
    },
  ])
})

test('um 5xx guarda o que o fornecedor disse e é UNREACHABLE', async (t) => {
  const down = await testingWith(t, () =>
    Promise.resolve(Response.json({ code: 'E500', message: 'fora do ar' }, { status: 503 })),
  )
  const answer = Object(down.tested.json())
  assert.equal(answer.result, 'UNREACHABLE')
  assert.deepEqual(answer.native, {
    status: 503,
    code: 'E500',
    message: 'fora do ar',
    body: { code: 'E500', message: 'fora do ar' },
  })
  assert.equal(answer.connection.state, 'NEW')
  assert.deepEqual(unreachableLines(down.hub.lines), [
    { status: 503, connector: 'sankhya', connectionId: down.connectionId },
  ])
})

test('o corpo de erro perde os valores da credencial antes de ser lido', async (t) => {
  const { clientSecret = '', xToken = '' } = sankhyaFake().credential
  const refused = await testingWith(t, () =>
    Promise.resolve(
      Response.json(
        { code: 'BAD', message: `segredo ${clientSecret}`, echo: { header: xToken } },
        { status: 401 },
      ),
    ),
  )
  const answer = Object(refused.tested.json())
  assert.equal(answer.result, 'AUTH_REFUSED')
  assert.equal(answer.native.message, 'segredo [redacted]')
  assert.deepEqual(answer.native.body.echo, { header: '[redacted]' })
  assert.equal(refused.tested.body.includes(clientSecret), false)
})

test('um login com um status ou corpo inesperado é UNREADABLE com o que veio, não UNREACHABLE', async (t) => {
  const odd = await testingWith(t, () => Promise.resolve(Response.json({ ok: 1 }, { status: 200 })))
  const answer = Object(odd.tested.json())
  assert.equal(answer.result, 'UNREADABLE')
  assert.equal(answer.native.status, 200)
  assert.equal(answer.connection.state, 'NEW')
  const html = await testingWith(t, () => Promise.resolve(new Response('<html>', { status: 200 })))
  assert.equal(Object(html.tested.json()).result, 'UNREADABLE')
  const teapot = await testingWith(t, () => Promise.resolve(Response.json({}, { status: 418 })))
  assert.equal(Object(teapot.tested.json()).result, 'UNREADABLE')
})

test('um corpo de erro que não é JSON chega como texto e o status decide', async (t) => {
  const login = await testingWith(t, () =>
    Promise.resolve(new Response('Unauthorized', { status: 401 })),
  )
  const refused = Object(login.tested.json())
  assert.equal(refused.result, 'AUTH_REFUSED')
  assert.equal(refused.native.body, 'Unauthorized')
  assert.equal(refused.connection.state, 'NEEDS_REAUTH')

  const gateway = await testingWith(t, () =>
    Promise.resolve(new Response('<html>502 Bad Gateway</html>', { status: 502 })),
  )
  const down = Object(gateway.tested.json())
  assert.equal(down.result, 'UNREACHABLE')
  assert.equal(down.native.body, '<html>502 Bad Gateway</html>')
})

test('o token sai de todo corpo de uma operação, no envelope do gateway e no erro REST', async (t) => {
  let bearer = ''
  const planted = await testingWith(t, async (request) => {
    if (request.headers.get('authorization') === null) {
      const login = await realFetch(request)
      bearer = Object(await login.clone().json()).access_token
      return login
    }
    const planted = { code: 'BAD', message: `token ${bearer}`, echo: bearer }
    return new URL(request.url).searchParams.has('serviceName')
      ? Response.json({ status: '0', statusMessage: `token ${bearer}`, echo: bearer })
      : Response.json(planted, { status: 400 })
  })
  assert.notEqual(bearer, '')
  assert.equal(planted.tested.body.includes(bearer), false)
  const checks: { id: string; native: { message: string; body: { echo: string } } }[] = Object(
    planted.tested.json(),
  ).checks
  function byId(id: string) {
    return checks.find((check) => check.id === id)?.native
  }
  assert.deepEqual(
    [byId('consultar')?.message, byId('consultar')?.body.echo],
    ['token [redacted]', '[redacted]'],
  )
  assert.equal(byId('empresas')?.body.echo, '[redacted]')
})
