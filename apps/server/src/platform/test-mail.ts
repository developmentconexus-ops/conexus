import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import type { Config } from './config.ts'
import type { SendMail } from './mail.ts'
import { createMail } from './mail.ts'
import { silent } from './test-database.ts'

export type Mail = {
  to: string
  subject: string
  text: string
  html: string
  from: { address: string; name: string }
}
type MailMode = 'DELIVER' | 'BOUNCE' | 'FAIL' | 'HOLD'

/**
 * A fake of the mail provider (T15): it keeps each message and answers as `mode` says. HOLD keeps
 * nothing and never answers, and `held` resolves when such a request has arrived.
 */
export async function mailServer(t: TestContext) {
  const sent: Mail[] = []
  const state: { mode: MailMode } = { mode: 'DELIVER' }
  const held = Promise.withResolvers<void>()
  const heldReplies: (() => void)[] = []
  function keep({ to, subject, text, html, from }: Mail) {
    sent.push({ to, subject, text, html, from })
  }
  const server = createServer((request, response) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.on('end', () => {
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      if (state.mode === 'HOLD') {
        heldReplies.push(() => {
          keep(body)
          const result = { delivered: [body.to], permanent_bounces: [], queued: [] }
          response.writeHead(200, { 'content-type': 'application/json' })
          response.end(JSON.stringify({ success: true, result }))
        })
        return held.resolve()
      }
      if (state.mode === 'FAIL') return response.writeHead(500).end()
      keep(body)
      const bounced = state.mode === 'BOUNCE' ? [body.to] : []
      const delivered = state.mode === 'DELIVER' ? [body.to] : []
      const result = { delivered, permanent_bounces: bounced, queued: [] }
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(JSON.stringify({ success: true, result }))
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => {
    server.closeAllConnections()
    server.close()
  })
  const address = server.address()
  assert.ok(address !== null && typeof address === 'object')
  const url = `http://127.0.0.1:${address.port}/email/sending/send`
  return {
    url,
    sent,
    state,
    held: held.promise,
    releaseHeld: () => {
      for (const reply of heldReplies.splice(0)) reply()
    },
  }
}

/** The mail adapter of a test Hub, over the provider its configuration names (the fake above, T15). */
export function testMail(config: Config): SendMail {
  return createMail({ config, log: silent })
}
