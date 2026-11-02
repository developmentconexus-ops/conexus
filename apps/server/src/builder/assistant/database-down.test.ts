import assert from 'node:assert/strict'
import type { Server, Socket } from 'node:net'
import { connect, createServer } from 'node:net'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { call, codeOf, post } from '../../hub/identity/test-hub.ts'
import { mastraPoolAt } from '../../platform/test-mastra-database.ts'
import { hubBeside, sent } from '../conversation/test-conversation.ts'
import { assisting, created } from './test-assistant.ts'

type Outage = 'REFUSED' | 'SILENT'

/**
 * Mastra's database behind a door of this test: shut, the port refuses (`REFUSED`) or accepts and
 * never answers (`SILENT`); opened, it reaches the database, so the Hub's end can close Mastra.
 */
async function doorTo(url: { reveal(): string }, outage: Outage) {
  const target = new URL(url.reveal())
  const sockets = new Set<Socket>()
  let reaching = false
  function listening(): Promise<Server> {
    const server = createServer((socket) => {
      sockets.add(socket)
      socket.on('close', () => sockets.delete(socket))
      if (!reaching) return
      const upstream = connect(Number(target.port), target.hostname)
      socket.pipe(upstream).pipe(socket)
      upstream.on('error', () => socket.destroy())
      socket.on('error', () => upstream.destroy())
    })
    return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)))
  }
  let port = 0
  let server = await listening()
  const address = server.address()
  port = typeof address === 'object' && address !== null ? address.port : 0
  async function shut() {
    await new Promise((resolve) => server.close(resolve))
  }
  if (outage === 'REFUSED') await shut()
  const through = new URL(url.reveal())
  through.host = `127.0.0.1:${port}`
  return {
    address: through.toString(),
    async open() {
      for (const socket of sockets) socket.destroy()
      if (outage === 'REFUSED') server = await listening()
      reaching = true
    },
    async close() {
      for (const socket of sockets) socket.destroy()
      await shut()
    },
  }
}

/**
 * Ana's Assistant on a Hub whose own database answers and whose Mastra database is out as
 * `outage` says: every Assistant route she calls answers 503 DATABASE_UNAVAILABLE, and a creation
 * keeps no row.
 */
async function everyRouteUnavailable(t: TestContext, outage: Outage) {
  const on = await assisting(t)
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const door = await doorTo(on.hub.config.mastraDatabaseUrl, outage)
  const mastraPool = mastraPoolAt(door.address)
  const broken = { ...on.hub, test: { ...on.hub.test, mastraPool } }
  const down = await hubBeside(t, broken, undefined, false)
  t.after(() => door.close())
  const answers = {
    list: await call(down, on.ana, 'GET', on.assistant),
    create: await post(down, on.ana, on.assistant, { connections: [on.matriz] }),
    read: await call(down, on.ana, 'GET', url),
    choose: await call(down, on.ana, 'PUT', `${url}/connections`, { connections: [] }),
    message: await sent(down, on.ana, url, 'Quanto vendemos?'),
  }
  // The Hub ends while its test database lives, closing Mastra through the door opened again.
  await door.open()
  await down.close()
  await mastraPool.end()
  for (const [route, answer] of Object.entries(answers)) {
    assert.equal(answer.statusCode, 503, `${route}: ${answer.body}`)
    assert.equal(codeOf(answer), 'DATABASE_UNAVAILABLE', route)
  }
  const kept = await on.hub.test.asOwner(
    'select count(*)::int as n from builder.assistant_conversation',
  )
  assert.deepEqual(kept, [{ n: 1 }], 'the refused creation kept no conversation')
}

test('banco do Mastra recusando a ligação: cada rota do Assistente responde 503 DATABASE_UNAVAILABLE, e criar não guarda a conversa', async (t) => {
  await everyRouteUnavailable(t, 'REFUSED')
})

test('banco do Mastra que aceita e nunca responde: o prazo de ligação dá 503 DATABASE_UNAVAILABLE em cada rota do Assistente', async (t) => {
  await everyRouteUnavailable(t, 'SILENT')
})
