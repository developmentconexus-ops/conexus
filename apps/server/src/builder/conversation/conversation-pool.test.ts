import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setTimeout } from 'node:timers/promises'
import { conversing, sent, started, streamOf, title } from './test-conversation.ts'

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

test('quem segura a conversa enquanto a outra solta abre uma sessão nova', async (t) => {
  const { hub, ana, conversations } = await conversing(
    t,
    (asked) =>
      title(asked) ?? {
        kind: 'text',
        text: 'Olá',
      },
  )
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  for (let round = 0; round < 5; round += 1) {
    const holder = await streamOf(hub, ana, url)
    holder.close()
    // Opens while the first holder's release deletes the session: Mastra makes this one wait for it.
    const next = await streamOf(hub, ana, url)
    t.after(() => next.close())
    assert.equal((await sent(hub, ana, url, `Oi ${round}`)).statusCode, 202)
    const events = await next.turn()
    assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
    next.close()
  }
})
