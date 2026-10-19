import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setTimeout } from 'node:timers/promises'
import { conversing, sent, started, streamOf } from './test-conversation.ts'

// The pool's idle time (POOL_LIMITS) and a margin: what lets Neon put the branch to sleep (D27).
const QUIET_MS = 15_000

test('depois de um turno, o login do Mastra não segura conexão: zero em 15 s', {
  timeout: 60_000,
}, async (t) => {
  const { hub, ana, conversations } = await conversing(t, () => ({ kind: 'text', text: 'Olá' }))
  const id = await started(hub, ana, conversations)
  const url = `${conversations}/${id}`
  const stream = await streamOf(hub, ana, url)
  assert.equal((await sent(hub, ana, url, 'Oi')).statusCode, 202)
  await stream.turn()
  stream.close()
  const database = new URL(hub.test.mastraUrl.reveal()).pathname.slice(1)
  async function open() {
    const rows = await hub.test.asOwner(
      `select count(*)::int as n from pg_stat_activity where usename = 'mastra_runtime' and datname = $1`,
      [database],
    )
    return rows[0]?.n
  }
  assert.ok(Number(await open()) > 0, 'the turn went through Mastra’s login')
  await setTimeout(QUIET_MS)
  assert.equal(await open(), 0)
})
