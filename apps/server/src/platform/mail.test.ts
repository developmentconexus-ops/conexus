import assert from 'node:assert/strict'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { Email } from '@conexus/hub-api'
import { createMail } from './mail.ts'
import { testConfig, unreachableDatabaseUrl } from './test-database.ts'

type Received = { authorization: string | undefined; body: unknown }
type Reply = (response: ServerResponse) => void

const MESSAGE = {
  to: Email.parse('bruno@example.test'),
  subject: 'Convite para Empresa Teste',
  text: 'Abra o link para entrar.',
}

function json(status: number, body: unknown): Reply {
  return (response) => {
    response.writeHead(status, { 'content-type': 'application/json' })
    response.end(JSON.stringify(body))
  }
}

function sent(result: { delivered?: string[]; permanent_bounces?: string[]; queued?: string[] }) {
  return json(200, {
    success: true,
    errors: [],
    messages: [],
    result: { delivered: [], permanent_bounces: [], queued: [], ...result },
  })
}

/** A fake of the provider's send endpoint (T15): it records each request and answers with `reply`. */
async function fakeProvider(t: TestContext, reply: Reply) {
  const received: Received[] = []
  const server = createServer((request: IncomingMessage, response) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.on('end', () => {
      received.push({
        authorization: request.headers.authorization,
        body: JSON.parse(Buffer.concat(chunks).toString('utf8')),
      })
      reply(response)
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => {
    server.closeAllConnections()
    server.close()
  })
  const address = server.address()
  assert.ok(address !== null && typeof address === 'object')
  const { port } = address
  const lines: { level: string; message: string; fields: Record<string, unknown> }[] = []
  const log = {
    info: (fields: Record<string, unknown>, message: string) =>
      lines.push({ level: 'info', message, fields }),
    error: (fields: Record<string, unknown>, message: string) =>
      lines.push({ level: 'error', message, fields }),
  }
  const config = testConfig(
    await unreachableDatabaseUrl(),
    `http://127.0.0.1:${port}/email/sending/send`,
  )
  return { send: createMail({ config, log }), received, lines, config }
}

/** Holds the request open and never answers. */
const silent: Reply = () => undefined

function never(): AbortSignal {
  return new AbortController().signal
}

test('correio: entregue, o pedido leva o token, a mensagem e o remetente "Conexus", e o registro não leva o endereço', async (t) => {
  const provider = await fakeProvider(t, sent({ delivered: ['bruno@example.test'] }))
  assert.equal(await provider.send(MESSAGE, never()), 'DELIVERED')
  assert.deepEqual(provider.received, [
    {
      authorization: `Bearer ${provider.config.mailToken.reveal()}`,
      body: {
        to: MESSAGE.to,
        from: { address: provider.config.mailFrom, name: 'Conexus' },
        subject: MESSAGE.subject,
        text: MESSAGE.text,
      },
    },
  ])
  assert.deepEqual(provider.lines, [
    { level: 'info', message: 'MAIL_SENT', fields: { outcome: 'DELIVERED' } },
  ])
})

test('correio: na fila também passa', async (t) => {
  const provider = await fakeProvider(t, sent({ queued: ['bruno@example.test'] }))
  assert.equal(await provider.send(MESSAGE, never()), 'QUEUED')
})

test('correio: endereço que volta é MAIL_BOUNCED', async (t) => {
  const provider = await fakeProvider(t, sent({ permanent_bounces: ['bruno@example.test'] }))
  await assert.rejects(provider.send(MESSAGE, never()), { code: 'MAIL_BOUNCED' })
  assert.deepEqual(provider.lines, [
    { level: 'info', message: 'MAIL_FAILED', fields: { outcome: 'BOUNCED' } },
  ])
})

const BIG = 'x'.repeat(16 * 1024)

for (const [name, reply, reason] of [
  ['resposta 503, sem ler o corpo', json(503, { success: false }), 'status'],
  [
    'success: false',
    json(200, { success: false, result: { delivered: [], permanent_bounces: [], queued: [] } }),
    'unsuccessful',
  ],
  [
    'resposta fora do esquema',
    json(200, { success: true, result: { delivered: 'bruno' } }),
    'shape',
  ],
  ['resposta que não é JSON', (response: ServerResponse) => response.end('<html>'), 'shape'],
  ['nenhum destino na resposta', sent({}), 'shape'],
  ['resposta acima de 16 KiB', json(200, { success: true, padding: BIG }), 'too-large'],
] as const) {
  test(`correio: ${name} é MAIL_UNAVAILABLE, num só pedido`, async (t) => {
    const provider = await fakeProvider(t, reply)
    await assert.rejects(provider.send(MESSAGE, never()), { code: 'MAIL_UNAVAILABLE' })
    assert.equal(provider.received.length, 1)
    assert.equal(provider.lines.length, 1)
    assert.equal(provider.lines[0]?.message, 'MAIL_FAILED')
    assert.equal(provider.lines[0]?.fields.reason, reason)
    const logged = JSON.stringify(provider.lines)
    assert.doesNotMatch(logged, /bruno|example\.test/)
    assert.ok(!logged.includes(provider.config.mailToken.reveal()))
  })
}

// Mock timers do not reach AbortSignal.timeout, so this case waits the real 10 s.
test('correio: o prazo de 10 s passa sem resposta, MAIL_UNAVAILABLE', async (t) => {
  const provider = await fakeProvider(t, silent)
  await assert.rejects(provider.send(MESSAGE, never()), { code: 'MAIL_UNAVAILABLE' })
  assert.deepEqual(provider.lines, [
    { level: 'error', message: 'MAIL_FAILED', fields: { reason: 'unreachable' } },
  ])
})

test('correio: o cliente que sai cancela o envio, MAIL_UNAVAILABLE', async (t) => {
  const provider = await fakeProvider(t, silent)
  const client = new AbortController()
  const sending = provider.send(MESSAGE, client.signal)
  while (provider.received.length === 0) await new Promise((resolve) => setImmediate(resolve))
  client.abort()
  await assert.rejects(sending, { code: 'MAIL_UNAVAILABLE' })
})
