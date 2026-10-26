import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { test } from 'node:test'
import { post } from '../../hub/identity/test-hub.ts'
import type { Sent } from '../../platform/test-anthropic.ts'
import {
  conversing,
  endOf,
  holding,
  PARTIAL,
  sessionUrl,
  started,
  streamOf,
  title,
} from './test-conversation.ts'

const ANSWER = 'Recebi os arquivos.'
const BUILDER_SYSTEM = 'You are the Conexus Builder'
const MiB = 1024 * 1024

const PDF_TYPE = 'application/pdf'
const MARKDOWN = '# Observações\n\nSem glúten.\n'
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n')
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

function dataUrl(type: string, bytes: Buffer): string {
  return `data:${type};base64,${bytes.toString('base64')}`
}

const OBSERVACOES = { filename: 'observacoes.md', mediaType: 'text/markdown' }
const markdown = { ...OBSERVACOES, data: dataUrl(OBSERVACOES.mediaType, Buffer.from(MARKDOWN)) }
const pdf = { filename: 'precos.pdf', mediaType: PDF_TYPE, data: dataUrl(PDF_TYPE, PDF) }
const png = { filename: 'logo.png', mediaType: 'image/png', data: dataUrl('image/png', PNG) }

type File = { filename: string; mediaType: string; data: string }

async function conversation(t: Parameters<typeof conversing>[0]) {
  const calls: Sent[] = []
  const hub = await conversing(t, (asked) => {
    if (!asked.stream) return title(asked) ?? { kind: 'text', text: 'Título' }
    if (asked.system.startsWith(BUILDER_SYSTEM)) calls.push(asked)
    return { kind: 'text', text: ANSWER }
  })
  const url = `${hub.conversations}/${await started(hub.hub, hub.ana, hub.conversations)}`
  const stream = await streamOf(hub.hub, hub.ana, url)
  t.after(() => stream.close())
  const messages = `${sessionUrl(url)}/messages`
  function send(message: string, files: File[]) {
    return post(hub.hub, hub.ana, messages, { message, files })
  }
  return { ...hub, calls, url, stream, send, messages }
}

test('um PDF de 2 MiB passa; 30 MiB e um byte é 413', async (t) => {
  const { hub, ana, calls, stream, send, messages } = await conversation(t)
  const big = { ...pdf, data: dataUrl(PDF_TYPE, Buffer.concat([PDF, Buffer.alloc(2 * MiB)])) }
  const accepted = await send('Veja o PDF', [big])
  assert.deepEqual([accepted.statusCode, accepted.json()], [200, { ok: true }])
  assert.equal(endOf(await stream.turn()), 'complete')
  assert.deepEqual(
    calls.map((call) => call.media),
    [[{ type: 'document', mediaType: PDF_TYPE }]],
  )
  const refused = await post(hub, ana, messages, { message: 'a'.repeat(30 * MiB + 1) })
  assert.equal(refused.statusCode, 413)
  assert.equal(Object(refused.json()).code, 'REQUEST_TOO_LARGE')
  assert.equal(calls.length, 1, 'the model is not called for a body over the ceiling')
})

test('cada tipo chega ao modelo na sua forma', async (t) => {
  const { calls, stream, send } = await conversation(t)
  assert.equal((await send('Veja', [markdown, pdf, png])).statusCode, 200)
  assert.equal(endOf(await stream.turn()), 'complete')
  const [call] = calls
  assert.ok(call)
  assert.ok(call.texts.some((text) => text.includes('[File: observacoes.md]')))
  assert.ok(call.texts.some((text) => text.includes('Sem glúten.')))
  assert.deepEqual(call.media, [
    { type: 'document', mediaType: PDF_TYPE },
    { type: 'image', mediaType: 'image/png' },
  ])
})

test('só o arquivo, sem texto', async (t) => {
  const { calls, stream, send } = await conversation(t)
  assert.equal((await send('', [pdf])).statusCode, 200)
  assert.equal(endOf(await stream.turn()), 'complete')
  const [call] = calls
  assert.ok(call)
  assert.deepEqual(call.media, [{ type: 'document', mediaType: PDF_TYPE }])
  assert.ok(
    call.texts.every((text) => text.trim() !== ''),
    'no empty text part reaches the model',
  )
})

test('o arquivo enviado no meio do trabalho entra na volta', async (t) => {
  const held = holding(t)
  const calls: Sent[] = []
  const { hub, ana, conversations } = await conversing(t, (asked) => {
    if (!asked.stream) return title(asked) ?? { kind: 'text', text: 'Título' }
    if (asked.system.startsWith(BUILDER_SYSTEM)) calls.push(asked)
    return asked.media.length > 0 ? { kind: 'text', text: ANSWER } : held.reply
  })
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  const messages = `${sessionUrl(url)}/messages`
  assert.equal((await post(hub, ana, messages, { message: 'Crie um app' })).statusCode, 200)
  assert.equal(await stream.text(), PARTIAL)
  const steered = await post(hub, ana, messages, { message: 'Os preços', files: [pdf] })
  assert.deepEqual([steered.statusCode, steered.json()], [200, { ok: true }])
  held.release()
  assert.equal(endOf(await stream.turn()), 'complete')
  assert.deepEqual(calls.at(-1)?.media, [{ type: 'document', mediaType: PDF_TYPE }])
})

test('um arquivo que é uma URL é recusado e nada é buscado', async (t) => {
  let hits = 0
  const target = createServer((_, response) => {
    hits += 1
    response.end(PNG)
  })
  await new Promise<void>((resolve) => target.listen(0, '127.0.0.1', resolve))
  t.after(() => target.close())
  const { calls, send } = await conversation(t)
  const address = target.address()
  assert.ok(address !== null && typeof address === 'object')
  const refused = await send('Veja', [
    { ...png, data: `http://127.0.0.1:${address.port}/logo.png` },
  ])
  assert.equal(refused.statusCode, 400)
  assert.equal(Object(refused.json()).code, 'REQUEST_MALFORMED')
  assert.equal(calls.length, 0, 'the model is not called')
  assert.equal(hits, 0, 'the Hub fetched nothing')
})
