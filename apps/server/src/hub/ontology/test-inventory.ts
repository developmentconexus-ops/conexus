import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { z } from 'zod'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import { connectionsOn, forward, linkSankhya } from '../connectors/test-connections.ts'
import type { Hub } from '../identity/test-hub.ts'
import type { InventoryTuning } from './inventory.ts'

/** What passed through a door in front of a connector double, and when its dictionary reads start to be spoiled. */
export type Door = { calls: number; asked: number; spoilAfter: number }

/** In front of a double: every call counted, and each dictionary query past `spoilAfter` answered with a page that is not JSON. */
export function doorOf(t: TestContext): {
  door: Door
  through: (origin: string) => Promise<string>
} {
  const door: Door = { calls: 0, asked: 0, spoilAfter: Number.POSITIVE_INFINITY }
  async function through(origin: string) {
    const server = createServer(async (incoming, outgoing) => {
      const chunks: Buffer[] = []
      for await (const chunk of incoming) chunks.push(z.instanceof(Buffer).parse(chunk))
      const body = incoming.method === 'GET' ? undefined : Buffer.concat(chunks)
      door.calls += 1
      if (incoming.url?.includes('executeQuery')) {
        door.asked += 1
        if (door.asked > door.spoilAfter) {
          outgoing.writeHead(200, { 'content-type': 'text/html' })
          outgoing.end('<html>valor da empresa</html>')
          return
        }
      }
      const answered = await forward(origin, incoming, body)
      const headers = { ...answered.headers }
      delete headers['content-length']
      delete headers['content-encoding']
      outgoing.writeHead(answered.status, headers)
      outgoing.end(answered.body)
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    t.after(() => {
      server.closeAllConnections()
      server.close()
    })
    const { port } = z.object({ port: z.number() }).parse(server.address())
    return `http://127.0.0.1:${port}`
  }
  return { door, through }
}

/** A Hub with the Sankhya double behind a door that can start spoiling the dictionary's pages after some calls. */
export async function inventoryOn(t: TestContext, inventory?: InventoryTuning) {
  const { door, through } = doorOf(t)
  const on = await connectionsOn(t, through, { inventory: inventory ?? {} })
  return { ...on, door }
}

type On = Awaited<ReturnType<typeof inventoryOn>>

/** Ligar the double's Sankhya as Ana, and the connection's id. */
export async function linked(on: On): Promise<string> {
  const made = await linkSankhya(on.hub, on.ana, on.base, on.fake.credential)
  assert.equal(made.statusCode, 201, made.body)
  return z.object({ connection: z.object({ id: z.string() }) }).parse(made.json()).connection.id
}

export function inventoryPath(on: On, connectionId: string): string {
  return `/api/companies/${on.companyId}/ontology/inventories/${connectionId}`
}

/** Ler de novo: a POST with no body. */
export function rerun(hub: Hub, cookie: string, path: string) {
  return hub.app.inject({
    method: 'POST',
    url: `${path}/runs`,
    headers: { origin: TEST_ORIGIN, cookie },
  })
}

/** The page's view, once no run is open (the workflow started by the route has ended). */
export async function settled(hub: Hub, cookie: string, path: string) {
  for (let tries = 0; tries < 200; tries += 1) {
    const read = await hub.app.inject({ method: 'GET', url: path, headers: { cookie } })
    assert.equal(read.statusCode, 200, read.body)
    const view = z
      .object({ running: z.boolean(), last: z.unknown() })
      .passthrough()
      .parse(read.json())
    if (!view.running && view.last !== null) return read.json()
    await sleep(50)
  }
  throw new Error('the inventory did not settle')
}
