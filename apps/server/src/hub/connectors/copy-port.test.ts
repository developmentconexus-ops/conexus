import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { setTimeout } from 'node:timers/promises'
import { CompanyId, ConnectionId, PersonId } from '@conexus/hub-api'
import { z } from 'zod'
import { appCalls } from './test-app-calls.ts'
import { forward } from './test-connections.ts'

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
      input: {
        definition,
        after,
        since: '1900-01-01',
        windowFrom: null,
        limit: 50,
      },
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
