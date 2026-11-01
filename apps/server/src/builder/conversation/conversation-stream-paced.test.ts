import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import http from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { setFlagsFromString } from 'node:v8'
import { runInNewContext } from 'node:vm'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import {
  conversing,
  endOf,
  messagesOf,
  sent,
  sessionUrl,
  started,
  streamOf,
  title,
} from './test-conversation.ts'
import { sessionStateOf } from './test-questions.ts'

setFlagsFromString('--expose-gc')
const gc: () => void = runInNewContext('gc')

/** How far behind a page may fall before the Hub drops its stream (`STREAM_BEHIND_BYTES`). */
const BEHIND_BYTES = 8 * 1024 * 1024

const OBSERVED = [
  '<observations>',
  '* 🔴 (10:00) Ana pediu a leitura dos clientes.',
  '</observations>',
  '<thread-title>Clientes</thread-title>',
].join('\n')

/**
 * A turn of `steps` tool calls, each carrying `size` characters of its own (a Sankhya read of the
 * founder's turns was about 18 KB), then a last answer. The observer and the title get
 * their own answers.
 */
function longTurn(steps: number, size: number) {
  let step = 0
  return (asked: Sent): Reply => {
    if (!asked.tools.includes('task_write')) return title(asked) ?? { kind: 'text', text: OBSERVED }
    step += 1
    if (step > steps) return { kind: 'text', text: 'Pronto.' }
    const content = `Cliente ${step} `.padEnd(size, 'x')
    const tasks = [{ content, activeForm: 'Lendo os clientes', status: 'completed' }]
    return { kind: 'blocks', blocks: [{ type: 'tool_use', name: 'task_write', input: { tasks } }] }
  }
}

/** The Hub served on a socket file of its own, whose small buffers make a reader that stops felt at once. */
async function served(t: TestContext, hub: Hub): Promise<string> {
  const folder = mkdtempSync(join(tmpdir(), 'conexus-stream-'))
  t.after(() => rmSync(folder, { recursive: true, force: true }))
  const path = join(folder, 'hub.sock')
  await hub.app.listen({ path })
  return path
}

/** The heap in use once what nothing holds is collected. */
function heapUsed(): number {
  gc()
  gc()
  return process.memoryUsage().heapUsed
}

/**
 * The conversation's stream on a real socket, as the browser reads it: `frames` are its events in
 * order, as text. `pace` is how long it waits after each chunk; `stall` reads nothing until `read`.
 */
async function socketStream(
  path: string,
  person: Person,
  url: string,
  options: { pace?: number; stall?: boolean } = {},
) {
  const request = http.get({
    socketPath: path,
    path: `${sessionUrl(url)}/stream`,
    headers: { origin: TEST_ORIGIN, cookie: person.cookie },
  })
  const response = await new Promise<http.IncomingMessage>((resolve, reject) => {
    request.once('response', resolve)
    request.once('error', reject)
  })
  assert.equal(response.statusCode, 200)
  const frames: string[] = []
  const seen = { ended: false }
  let buffered = ''
  let wake: (() => void) | undefined
  if (options.stall) response.pause()
  response.on('data', (chunk: Buffer) => {
    buffered += chunk.toString('utf8')
    const parts = buffered.split('\n\n')
    buffered = parts.pop() ?? ''
    for (const part of parts) if (part.startsWith('data: ')) frames.push(part.slice(6))
    if (options.pace !== undefined) {
      response.pause()
      setTimeout(() => response.resume(), options.pace)
    }
    wake?.()
  })
  function ended() {
    seen.ended = true
    wake?.()
  }
  response.on('close', ended)
  response.on('error', ended)
  request.on('error', ended)
  async function until(done: () => boolean): Promise<void> {
    while (!done()) await new Promise<void>((resolve) => (wake = resolve))
  }
  function close() {
    request.destroy()
  }
  return { frames, seen, until, read: () => response.resume(), close }
}

function typeOf(frame: string): string {
  return String(Object(JSON.parse(frame)).type)
}

function ends(frames: string[]): boolean {
  return frames.some((frame) => typeOf(frame) === 'agent_end')
}

/** The events of the turn, from its start to its end. */
function turnOf(frames: string[]): string[] {
  return frames.slice(
    frames.findIndex((frame) => typeOf(frame) === 'agent_start'),
    frames.findIndex((frame) => typeOf(frame) === 'agent_end') + 1,
  )
}

/** Waits for a log line of the Hub that `matches`. */
async function lineOf(
  hub: { lines: { fields: Record<string, unknown>; message: string }[] },
  matches: (fields: Record<string, unknown>) => boolean,
) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const found = hub.lines.find(
      (line) => line.message === 'BUILDER_STREAM_ENDED' && matches(line.fields),
    )
    if (found !== undefined) return found.fields
    await new Promise((done) => setTimeout(done, 25))
  }
  assert.fail(
    `no such BUILDER_STREAM_ENDED line: ${JSON.stringify(hub.lines.filter((line) => line.message === 'BUILDER_STREAM_ENDED'))}`,
  )
}

test('um turno de 96 passos com uma página que não lê não enche o heap do Hub: o stream manda só o que a tela lê', async (t) => {
  const { hub, ana, conversations, lines } = await conversing(t, longTurn(96, 4_000))
  const path = await served(t, hub)
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stalled = await socketStream(path, ana, url, { stall: true })
  t.after(() => stalled.close())
  const reading = await streamOf(hub, ana, url)
  t.after(() => reading.close())
  assert.deepEqual(Object.keys(await reading.seed()).toSorted(), [
    'isRunning',
    'omProgress',
    'pendingSuspensions',
  ])
  assert.equal((await sent(hub, ana, url, 'Leia os clientes')).statusCode, 200)
  assert.equal(endOf(await reading.turn()), 'complete')
  const conversationId = url.slice(url.lastIndexOf('/') + 1)
  const memory = lines.find((line) => line.message === 'HUB_MEMORY')?.fields
  assert.equal(memory?.conversationId, conversationId, 'the end of the turn says the memory')
  assert.ok(Number(memory?.heapLimitMib) > 0 && Number(memory?.rssMib) > 0)
  const held = heapUsed()
  stalled.close()
  const fields = await lineOf({ lines }, (line) => line.reason === 'CLOSED')
  assert.equal(fields.conversationId, conversationId)
  const freed = held - heapUsed()
  // Mastra's own stream held about 1 GB for such a turn (2026-10-31, `stall.mjs`, 96 steps); here
  // it ran the test's process out of its 2 GB heap, as it did the Hub's.
  assert.ok(freed < 32 * 1024 * 1024, `the stalled page held ${Math.round(freed / 1048576)} MiB`)
})

test('uma página que lê devagar recebe todos os eventos, na ordem, como a que lê depressa', async (t) => {
  const { hub, ana, conversations } = await conversing(t, longTurn(24, 18_000))
  const path = await served(t, hub)
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const slow = await socketStream(path, ana, url, { pace: 20 })
  t.after(() => slow.close())
  const fast = await socketStream(path, ana, url)
  t.after(() => fast.close())
  assert.equal((await sent(hub, ana, url, 'Leia os clientes')).statusCode, 200)
  await fast.until(() => ends(fast.frames))
  await slow.until(() => ends(slow.frames) || slow.seen.ended)
  assert.ok(turnOf(fast.frames).length > 24 * 3)
  assert.deepEqual(turnOf(slow.frames), turnOf(fast.frames))
  assert.equal(slow.seen.ended, false)
})

test(`uma página ${BEHIND_BYTES / 1048576} MiB atrás perde o stream, que é registrado; ao reabrir, a sessão e a transcrição a põem em dia`, async (t) => {
  const { hub, ana, conversations, lines } = await conversing(t, longTurn(16, 100_000))
  const path = await served(t, hub)
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stalled = await socketStream(path, ana, url, { stall: true })
  t.after(() => stalled.close())
  const reading = await streamOf(hub, ana, url)
  t.after(() => reading.close())
  await reading.seed()
  assert.equal((await sent(hub, ana, url, 'Leia os clientes')).statusCode, 200)
  const behind = await lineOf({ lines }, (line) => line.reason === 'BEHIND')
  assert.ok(Number(behind.bytes) > BEHIND_BYTES)
  stalled.read()
  await stalled.until(() => stalled.seen.ended)
  assert.equal(endOf(await reading.turn()), 'complete')
  // Mastra's client opens the stream again and the screen reads the session and the transcript.
  const again = await streamOf(hub, ana, url)
  t.after(() => again.close())
  assert.equal((await again.seed()).isRunning, false)
  assert.equal((await sessionStateOf(hub, ana, url)).tasks.length, 1)
  const messages = await messagesOf(hub, ana, url)
  assert.ok(messages.length >= 2)
})
