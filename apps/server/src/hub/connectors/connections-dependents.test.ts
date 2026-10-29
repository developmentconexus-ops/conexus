import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { test } from 'node:test'
import { codeOf } from '../identity/test-hub.ts'
import { connectionsOn, linkSankhya, testOf } from './test-connections.ts'

type Check = { id: string; outcome: string; dependsOn?: { id: string; label: string } }

function checksOf(response: { json(): unknown }): Check[] {
  return Object(response.json()).checks
}

test('testar: a fonte recusada deixa quem depende dela não testado, com o motivo', async (t) => {
  const { hub, fake, ana, base } = await connectionsOn(t)
  const { connection } = Object((await linkSankhya(hub, ana, base, fake.credential)).json())

  fake.switches.refuse.add('empresas')
  const noEmpresas = await testOf(hub, ana, base, connection.id)
  const checks = checksOf(noEmpresas)
  const waiting = checks.filter((check) => check.dependsOn !== undefined)
  assert.ok(waiting.length >= 8)
  assert.ok(waiting.every((check) => check.outcome === 'NOT_TESTED'))
  assert.deepEqual(checks.find((check) => check.id === 'pedidos')?.dependsOn, {
    id: 'empresas',
    label: 'Empresas',
  })
  assert.deepEqual(checks.find((check) => check.id === 'impostosDoPedido')?.dependsOn, {
    id: 'pedidos',
    label: 'Pedidos',
  })
  assert.equal(checks.find((check) => check.id === 'empresas')?.dependsOn, undefined)
  assert.equal(checks.find((check) => check.id === 'clientes')?.outcome, 'READS')
})

test('testar: a fonte que leu vazia deixa o dependente em nada para ler', async (t) => {
  const { hub, fake, ana, base } = await connectionsOn(t, async (origin) => {
    const standIn = createServer(async (request, response) => {
      if (request.url?.startsWith('/v1/empresas')) {
        response.writeHead(200, { 'content-type': 'application/json' })
        response.end(JSON.stringify({ empresas: [] }))
        return
      }
      const forwarded = await fetch(new URL(request.url ?? '/', origin), {
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
  })
  const { connection } = Object((await linkSankhya(hub, ana, base, fake.credential)).json())
  const tested = await testOf(hub, ana, base, connection.id)
  assert.equal(Object(tested.json()).result, 'WORKING')
  const checks = checksOf(tested)
  assert.equal(checks.find((check) => check.id === 'empresas')?.outcome, 'READS')
  assert.equal(checks.find((check) => check.id === 'pedidos')?.outcome, 'NOTHING_TO_READ')
  assert.equal(checks.find((check) => check.id === 'impostosDoPedido')?.outcome, 'NOTHING_TO_READ')
  assert.ok(checks.every((check) => check.dependsOn === undefined))
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
