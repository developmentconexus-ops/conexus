import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import type { ConversationEvent, Message } from '@conexus/hub-api'
import { ConversationEvent as Event, LAST_EVENT_ID_HEADER } from '@conexus/hub-api'
import { z } from 'zod'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import {
  ANA_OWNER,
  call,
  hubWithLog,
  personOn,
  plantCompany,
  post,
} from '../../hub/identity/test-hub.ts'
import { createStatus } from '../../hub/status/public.ts'
import { createHub, identityOf, subjectsOf } from '../../main.ts'
import type { Anthropic, Reply, Sent } from '../../platform/test-anthropic.ts'
import { plantAnthropic } from '../../platform/test-anthropic.ts'
import { heldCompanyPostgres, testAppPorts } from '../../platform/test-app-ports.ts'
import { fakeCloudflare } from '../../platform/test-cloudflare.ts'
import { silent, TEST_ORIGIN, testWebRoot } from '../../platform/test-database.ts'
import { fakeNeon } from '../../platform/test-neon.ts'

export const MODEL = 'anthropic/claude-sonnet-4-6'
/** One full piece of text (200 characters): the journal says text in pieces of that size. */
export const PARTIAL = 'Começo da resposta. '.repeat(10)

/**
 * A provider answer that sends `PARTIAL` and then holds until released; released at the test's
 * end at the latest, before the Hub drains its turns. Call it before `conversing`.
 */
export function holding(t: TestContext) {
  const hold = Promise.withResolvers<void>()
  t.after(() => hold.resolve())
  const reply: Reply = { kind: 'hold', until: hold.promise, text: PARTIAL }
  return { reply, release: () => hold.resolve() }
}

/**
 * A provider answer that sends nothing until released, so the turn runs with no word said yet;
 * released at the test's end at the latest. Call it before `conversing`.
 */
export function stalling(t: TestContext) {
  const stall = Promise.withResolvers<void>()
  t.after(() => stall.resolve())
  const reply: Reply = { kind: 'hold', until: stall.promise }
  return { reply, release: () => stall.resolve() }
}

/** The title call's answer; every other call is the test's. */
export function title(asked: Sent): Reply | undefined {
  return asked.stream ? undefined : { kind: 'text', text: 'Título' }
}

/** A read conversation's messages, as role and parts. */
export function rolesAndParts(read: { json(): unknown }) {
  const { messages } = Object(read.json()).conversation
  return messages.map((message: { role: string; parts: unknown[] }) => [
    message.role,
    message.parts,
  ])
}
export const KEY = 'sk-ant-conversation-key-0001'

/**
 * Empresa Teste, Ana its owner, an Anthropic key and the default model, and a Projeto, on a Hub
 * whose log lines the test reads; `change` sets its config apart from the test one.
 */
export async function conversing(
  t: TestContext,
  answer: Anthropic['answer'],
  change?: Parameters<typeof hubWithLog>[1],
) {
  const anthropic = plantAnthropic(t, answer)
  const hub = await hubWithLog(t, change)
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id)
  const company = `/api/companies/${companyId}`
  async function link(label: string, key: string, owner = 'company') {
    const body = { owner, provider: 'anthropic', label, key }
    const linked = await post(hub, ana, `${company}/model-accounts`, body)
    assert.equal(linked.statusCode, 201)
    return String(Object(linked.json()).account.id)
  }
  await link('Time 1', KEY)
  assert.equal(
    (
      await call(hub, ana, 'PUT', `${company}/default-model`, {
        model: MODEL,
        effort: 'off',
      })
    ).statusCode,
    200,
  )
  const made = await post(hub, ana, `${company}/projects`, { name: 'Encomendas' })
  assert.equal(made.statusCode, 201)
  const projectId = String(Object(made.json()).project.id)
  const conversations = `${company}/projects/${projectId}/conversations`
  return { hub, ana, companyId, projectId, conversations, anthropic, link, lines: hub.lines }
}

/**
 * A second Hub on the same databases, as after a restart or beside a process that stopped: its
 * own Builder and sessions, nothing shared in memory. `close` drains it as shutdown does.
 */
export async function hubBeside(t: TestContext, hub: Hub) {
  const { test, config } = hub
  const identity = identityOf({ database: test.database, config, log: silent })
  const postgres = heldCompanyPostgres(config)
  const ports = testAppPorts(
    config,
    { neon: fakeNeon(), cloudflare: fakeCloudflare(), postgres },
    hub.builder.folder,
  )
  const subjects = subjectsOf({
    ...{ mastraPool: test.mastraPool, database: test.database, config, identity },
    ...{ ...ports, log: silent },
  })
  const status = createStatus({ version: config.version, database: test.database })
  const webRoot = testWebRoot(t)
  const app = await createHub(config, { status, identity, ...subjects, webRoot })
  let closed: Promise<void> | undefined
  function close() {
    closed ??= subjects.conversations.close().then(() => app.close())
    return closed
  }
  t.after(close)
  const builder = {
    ...hub.builder,
    bucket: ports.bucket,
    control: ports.control,
    knobs: ports.knobs,
  }
  // What `runServer` does once it listens: the runs whose lease ended are settled.
  function restart() {
    return subjects.runs.settleRuns()
  }
  return { ...hub, app, runs: subjects.runs, builder, close, restart }
}

export async function started(hub: Hub, person: Person, conversations: string, body: object = {}) {
  const made = await post(hub, person, conversations, body, randomUUID())
  assert.equal(made.statusCode, 201, made.body)
  return String(Object(made.json()).conversation.id)
}

export function sent(hub: Hub, person: Person, url: string, content: string, key = randomUUID()) {
  return post(hub, person, `${url}/messages`, { content }, key)
}

/**
 * The conversation's stream, read event by event until the test closes it; `lastEventId` reopens
 * it as a browser does, and `seen.ids` holds each event's id.
 */
export async function streamOf(hub: Hub, person: Person, url: string, lastEventId?: string) {
  const resumed = lastEventId === undefined ? {} : { [LAST_EVENT_ID_HEADER]: lastEventId }
  const response = await hub.app.inject({
    method: 'GET',
    url: `${url}/events`,
    headers: { origin: TEST_ORIGIN, cookie: person.cookie, ...resumed },
    payloadAsStream: true,
  })
  assert.equal(response.statusCode, 200)
  assert.match(String(response.headers['content-type']), /^text\/event-stream/)
  const stream = response.stream()
  const waiting: ConversationEvent[] = []
  const ids: string[] = []
  const seen = { raw: '', comments: 0, ended: false, ids }
  let buffered = ''
  let wake: (() => void) | undefined
  stream.on('data', (chunk: Buffer) => {
    seen.raw += chunk.toString('utf8')
    buffered += chunk.toString('utf8')
    const frames = buffered.split('\n\n')
    buffered = frames.pop() ?? ''
    for (const frame of frames) {
      if (frame.startsWith(':')) seen.comments += 1
      const [id, data] = frame.split('\n')
      if (id?.startsWith('id: ') && data?.startsWith('data: ')) {
        seen.ids.push(id.slice(4))
        waiting.push(Event.parse(JSON.parse(data.slice(6))))
      }
    }
    wake?.()
  })
  stream.on('end', () => {
    seen.ended = true
    wake?.()
  })
  async function until(done: () => boolean): Promise<void> {
    while (!done()) await new Promise<void>((resolve) => (wake = resolve))
  }
  async function next(): Promise<ConversationEvent> {
    await until(() => waiting.length > 0)
    const event = waiting.shift()
    assert.ok(event !== undefined)
    return event
  }
  /** The next event that is not the `turn` that opens a turn. */
  async function said(): Promise<ConversationEvent> {
    const event = await next()
    return event.type === 'turn' ? next() : event
  }
  /** Every event until the turn ends, the end included. */
  async function turn(): Promise<ConversationEvent[]> {
    const seen: ConversationEvent[] = []
    for (;;) {
      const event = await next()
      seen.push(event)
      if (event.type === 'turnEnd') return seen
    }
  }
  function close() {
    stream.destroy()
  }
  /** Waits for the stream's own end, from the server: true once it came, with no event left. */
  async function ended(): Promise<boolean> {
    await until(() => seen.ended)
    return waiting.length === 0
  }
  return { next, said, turn, close, ended, until, seen }
}

/**
 * One question asked on a new conversation of the Project, and the events of its turn with their
 * ids; `between` runs once the conversation exists.
 */
/** The conversations of a second Projeto of the same company: its turn runs beside the first's. */
export async function beside(
  where: { hub: Hub; person: Person; conversations: string },
  name: string,
) {
  const projects = where.conversations.replace(/\/[^/]+\/conversations$/, '')
  const made = await post(where.hub, where.person, projects, { name })
  assert.equal(made.statusCode, 201, made.body)
  return {
    ...where,
    conversations: `${projects}/${String(Object(made.json()).project.id)}/conversations`,
  }
}

export async function asked(
  t: TestContext,
  where: { hub: Hub; person: Person; conversations: string; between?: () => Promise<void> },
  content = 'Compare dois apps de encomenda de padaria',
) {
  const { hub, person, conversations } = where
  const url = `${conversations}/${await started(hub, person, conversations)}`
  const stream = await streamOf(hub, person, url)
  t.after(() => stream.close())
  await where.between?.()
  assert.equal((await sent(hub, person, url, content)).statusCode, 202)
  return { url, events: await stream.turn(), ids: stream.seen.ids }
}

/**
 * The conversation's messages once the last is the Builder's, read again for at most five seconds:
 * Mastra saves a turn just after its end.
 */
export async function answeredOf(hub: Hub, person: Person, url: string): Promise<Message[]> {
  for (let attempt = 0; ; attempt += 1) {
    const read = await call(hub, person, 'GET', url)
    assert.equal(read.statusCode, 200, read.body)
    const messages: Message[] = Object(read.json()).conversation.messages
    if (messages.at(-1)?.role === 'builder' || attempt === 50) return messages
    await new Promise((done) => setTimeout(done, 100))
  }
}

/**
 * The conversation's messages, read once: Mastra saves a completed turn before it passes on its
 * `finish`, so a read at `turnEnd` has it.
 */
export async function messagesOf(hub: Hub, person: Person, url: string): Promise<Message[]> {
  const read = await call(hub, person, 'GET', url)
  assert.equal(read.statusCode, 200, read.body)
  return Object(read.json()).conversation.messages
}

/** The failures a turn said, in order. */
export function failuresOf(events: ConversationEvent[]): string[] {
  return events.flatMap((event) =>
    event.type === 'part' && event.part.type === 'failure' ? [event.part.code] : [],
  )
}

/** The notices of a turn, in order. */
export function noticesOf(events: ConversationEvent[]): string[] {
  return events.flatMap((event) => (event.type === 'notice' ? [event.text] : []))
}

/** The notices the person reads again in the conversation's Builder messages, in order. */
export async function keptNotices(hub: Hub, person: Person, url: string): Promise<string[]> {
  const messages = await answeredOf(hub, person, url)
  return messages
    .filter((message) => message.role === 'builder')
    .flatMap((message) => message.parts)
    .flatMap((part) => (part.type === 'notice' ? [part.text] : []))
}

const GEMINI_URL = 'https://generativelanguage.googleapis.com/'
const GeminiAsked = z.object({
  tools: z.array(z.object({ functionDeclarations: z.array(z.object({ name: z.string() })) })),
})

/**
 * Stands in for Gemini's API beside the Anthropic double: one text answer, in its stream or its
 * JSON form, and the tools each call offered. It puts back the `fetch` it found, if still its own.
 */
export function plantGemini(t: TestContext): string[][] {
  const offered: string[][] = []
  const before = globalThis.fetch
  async function gemini(input: string | URL | Request, init?: RequestInit) {
    const url = input instanceof Request ? input.url : String(input)
    if (!url.startsWith(GEMINI_URL)) return before(input, init)
    const asked = GeminiAsked.safeParse(JSON.parse(String(init?.body)))
    const names = asked.success ? asked.data.tools.flatMap((tool) => tool.functionDeclarations) : []
    offered.push(names.map((tool) => tool.name).sort())
    const chunk = {
      candidates: [
        { content: { role: 'model', parts: [{ text: 'Resposta' }] }, finishReason: 'STOP' },
      ],
      usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1, totalTokenCount: 2 },
    }
    if (!url.includes(':streamGenerateContent')) return Response.json(chunk)
    const headers = { 'content-type': 'text/event-stream' }
    return new Response(`data: ${JSON.stringify(chunk)}\n\n`, { headers })
  }
  globalThis.fetch = gemini
  t.after(() => {
    if (globalThis.fetch === gemini) globalThis.fetch = before
  })
  return offered
}
