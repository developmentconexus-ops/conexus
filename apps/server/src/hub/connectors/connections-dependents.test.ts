import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { codeOf } from '../identity/test-hub.ts'
import { connectionsOn, linkSankhya, testOf } from './test-connections.ts'

type Check = { id: string; outcome: string; source?: string }

function checksOf(response: { json(): unknown }): Check[] {
  return Object(response.json()).checks
}

/**
 * A server in front of the double: it records every path asked and answers the paths `empty` takes
 * with an empty list of empresas (a source that read nothing); the rest go to the double.
 */
function standingIn(t: TestContext, asked: Set<string>, empty: (path: string) => boolean) {
  return async (origin: string) => {
    const standIn = createServer(async (request, response) => {
      const path = request.url ?? '/'
      asked.add(new URL(path, origin).pathname)
      if (empty(path)) {
        response.writeHead(200, { 'content-type': 'application/json' })
        response.end(JSON.stringify({ empresas: [] }))
        return
      }
      const forwarded = await fetch(new URL(path, origin), {
        method: request.method,
        headers: Object.fromEntries(
          Object.entries(request.headers).flatMap(([name, value]) =>
            typeof value === 'string' && name !== 'host' && name !== 'content-length'
              ? [[name, value]]
              : [],
          ),
        ),
        body: request.method === 'POST' ? Buffer.concat(await request.toArray()) : undefined,
      })
      response.writeHead(forwarded.status, {
        'content-type': forwarded.headers.get('content-type') ?? 'application/json',
      })
      response.end(await forwarded.text())
    })
    await new Promise<void>((resolve) => standIn.listen(0, '127.0.0.1', resolve))
    t.after(() => standIn.close())
    const address = standIn.address()
    return `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`
  }
}

test('testar: a fonte recusada deixa quem depende dela sem ser chamado, com o motivo', async (t) => {
  const asked = new Set<string>()
  const { hub, fake, ana, base } = await connectionsOn(
    t,
    standingIn(t, asked, () => false),
  )
  const { connection } = Object((await linkSankhya(hub, ana, base, fake.credential)).json())

  fake.switches.refuse.add('empresas')
  const noEmpresas = await testOf(hub, ana, base, connection.id)
  const checks = checksOf(noEmpresas)
  const waiting = checks.filter((check) => check.outcome === 'SOURCE_UNREAD')
  assert.ok(waiting.length >= 8)
  assert.equal(checks.find((check) => check.id === 'pedidos')?.source, 'Empresas')
  assert.equal(checks.find((check) => check.id === 'notaFiscal')?.source, 'Notas fiscais')
  const refused = checks.find((check) => check.id === 'empresas')
  assert.equal(refused?.outcome, 'REFUSED')
  assert.equal(Object(refused).native.status, 403)
  assert.equal(checks.find((check) => check.id === 'clientes')?.outcome, 'READS')
  assert.ok(
    checks.every((check) => (check.source === undefined) === (check.outcome !== 'SOURCE_UNREAD')),
  )
  assert.ok(asked.size > 0)
  assert.ok([...asked].every((path) => !path.includes('/pedidos')))
})

test('testar: a fonte que leu vazia fica em nada para olhar e deixa o dependente em nada para ler', async (t) => {
  const { hub, fake, ana, base } = await connectionsOn(
    t,
    standingIn(t, new Set(), (path) => path.startsWith('/v1/empresas')),
  )
  const { connection } = Object((await linkSankhya(hub, ana, base, fake.credential)).json())
  const tested = await testOf(hub, ana, base, connection.id)
  assert.equal(Object(tested.json()).result, 'WORKING')
  const checks = checksOf(tested)
  assert.equal(checks.find((check) => check.id === 'empresas')?.outcome, 'NOTHING_TO_READ')
  assert.equal(checks.find((check) => check.id === 'pedidos')?.outcome, 'NOTHING_TO_READ')
  assert.equal(checks.find((check) => check.id === 'notaFiscal')?.outcome, 'NOTHING_TO_READ')
  assert.ok(checks.every((check) => check.outcome !== 'SOURCE_UNREAD'))
})

test('ligar: os campos colados perdem o espaço das pontas e o vazio é recusado', async (t) => {
  const { hub, fake, ana, base } = await connectionsOn(t)
  const blank = await linkSankhya(hub, ana, base, { ...fake.credential, xToken: '   ' })
  assert.deepEqual([blank.statusCode, codeOf(blank)], [422, 'CONNECTION_CREDENTIAL_INVALID'])
  const padded = Object.fromEntries(
    Object.entries(fake.credential).map(([name, value]) => [name, `  ${value}\n`]),
  )
  const linked = await linkSankhya(hub, ana, base, padded)
  assert.equal(linked.statusCode, 201)
  const tested = await testOf(hub, ana, base, Object(linked.json()).connection.id)
  assert.equal(Object(tested.json()).result, 'WORKING')
})
