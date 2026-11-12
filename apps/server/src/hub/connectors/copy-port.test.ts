import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { setTimeout } from 'node:timers/promises'
import { CompanyId, ConnectionId, PersonId } from '@conexus/hub-api'
import { z } from 'zod'
import { CopyDefinitionV2 } from './public.ts'
import { appCalls } from './test-app-calls.ts'
import { forward, linkMercadoLivre, mercadoLivreOn, testOf } from './test-connections.ts'

/** In front of the double: what reaches it, in order, a copy's page held until the test lets it go. */
function doorOf(t: TestContext) {
  const door: { seen: string[]; held: PromiseWithResolvers<void> | undefined } = {
    seen: [],
    held: undefined,
  }
  const arrived = Promise.withResolvers<void>()
  return {
    door,
    arrived: arrived.promise,
    through: async (origin: string) => {
      const server = createServer(async (incoming, outgoing) => {
        const chunks: Buffer[] = []
        for await (const chunk of incoming) chunks.push(z.instanceof(Buffer).parse(chunk))
        const body = Buffer.concat(chunks)
        const text = body.toString('utf8')
        const kind = text.includes(' AS C0_') ? 'page' : `${incoming.method} ${incoming.url}`
        door.seen.push(kind)
        if (kind === 'page' && door.held !== undefined) {
          arrived.resolve()
          await door.held.promise
          door.held = undefined
        }
        const answered = await forward(origin, incoming, body)
        outgoing.writeHead(answered.status, answered.headers)
        outgoing.end(answered.body)
      })
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
      t.after(() => {
        server.closeAllConnections()
        server.close()
      })
      const { port } = z.object({ port: z.number() }).parse(server.address())
      return `http://127.0.0.1:${port}`
    },
  }
}

test('a cópia toma a vez da conexão página a página', async (t) => {
  const { door, arrived, through } = doorOf(t)
  const on = await appCalls(t, { through })
  const connectionId = ConnectionId.parse(await on.connect('Matriz'))
  const companyId = CompanyId.parse(on.companyId)
  const copies = on.hub.connectors.copies
  const vendas = copies.catalog().find((each) => each.model.id === 'vendas')
  assert.ok(vendas)
  const { definition } = vendas.model
  function page(after: number[] | null) {
    return copies.readPage({
      companyId,
      connectionId,
      // A member, whose role holds no operation of the connector: the copy speaks as its version.
      enabledBy: PersonId.parse(on.carla.id),
      definition,
      position: after === null ? null : { kind: 'KEY', after },
      since: null,
      windowFrom: null,
      limit: 50,
      signal: new AbortController().signal,
    })
  }
  door.seen.length = 0
  door.held = Promise.withResolvers<void>()
  const releasePage = door.held
  const first = page(null)
  await arrived
  const app = on.read()
  // Time for the app's read to reach the double, were it not waiting in the connection's line.
  await setTimeout(200)
  door.seen.push('released')
  releasePage.resolve()
  const read = await first
  assert.equal(read.kind, 'PAGE')
  if (read.kind !== 'PAGE') return
  assert.equal(read.page.rows.length, 50)
  assert.equal(read.page.more, true)
  const next = page([Number(read.page.rows.at(-1)?.[0])])
  assert.equal((await app).statusCode, 200)
  assert.equal((await next).kind, 'PAGE')
  assert.deepEqual(
    door.seen,
    ['page', 'released', 'GET /v1/empresas?page=0', 'page'],
    'o app espera a página da cópia, e só ela',
  )
  assert.ok(
    on.hub.lines.some((line) => line.message === 'CONNECTOR_CALLED' && line.fields.by === 'copy'),
  )
})

async function pageOf(t: TestContext, columns: readonly object[]) {
  const on = await mercadoLivreOn(t)
  const linked = await linkMercadoLivre(on.hub, on.ana, on.companyId)
  const connectionId = ConnectionId.parse(Object(linked.json()).connection.id)
  await testOf(on.hub, on.ana, on.base, connectionId)
  const definition = CopyDefinitionV2.parse({
    version: 2,
    source: { kind: 'OPERATION', operation: 'pedidos', input: {} },
    description: 'Os pedidos',
    columns,
    key: ['id'],
    changedSince: null,
  })
  const read = await on.hub.connectors.copies.readPage({
    companyId: CompanyId.parse(on.companyId),
    connectionId,
    enabledBy: PersonId.parse(on.ana.id),
    definition,
    position: null,
    since: null,
    windowFrom: null,
    limit: 50,
    signal: new AbortController().signal,
  })
  assert.equal(read.kind, 'PAGE')
  return read.kind === 'PAGE' ? JSON.stringify(read.page.rows) : ''
}

const PLANTED_BUYER = ['Maria', 'Fictícia', 'maria.ficticia', '52998224725', 'COMPRADORFICTICIO']

test('a cópia sem tipo', async (t) => {
  const text = await pageOf(t, [
    { name: 'id', type: 'bigint', path: 'id' },
    { name: 'status', type: 'text', path: 'status' },
  ])
  assert.ok(text.includes('paid'), 'the order itself is copied')
  for (const value of PLANTED_BUYER) assert.ok(!text.includes(value), `a cópia guarda ${value}`)
})

test('a cópia com o tipo da coluna: o que o Ligar conferiu entra, e o documento nunca', async (t) => {
  const text = await pageOf(t, [
    { name: 'id', type: 'bigint', path: 'id' },
    { name: 'comprador', type: 'json', path: 'buyer' },
  ])
  assert.ok(text.includes('COMPRADORFICTICIO'), 'the column of kind contato holds the buyer')
  assert.ok(!text.includes('52998224725'), 'the document is a kind no column holds')
})
