import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import type { AgentControllerWireEvent, MastraMessagePart } from '@mastra/core/agent-controller'
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
import type { FailureLog } from '../../platform/failure.ts'
import { shutDown } from '../../platform/lifecycle.ts'
import type { Anthropic, Reply, Sent } from '../../platform/test-anthropic.ts'
import { plantAnthropic } from '../../platform/test-anthropic.ts'
import { heldCompanyPostgres, testAppPorts } from '../../platform/test-app-ports.ts'
import { fakeCloudflare } from '../../platform/test-cloudflare.ts'
import { silent, TEST_ORIGIN, testWebRoot } from '../../platform/test-database.ts'
import { fakeNeon } from '../../platform/test-neon.ts'
import { noticesIn } from './test-parts.ts'

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

/** The title call's answer; every other call is the test's. */
export function title(asked: Sent): Reply | undefined {
  return asked.stream ? undefined : { kind: 'text', text: 'Título' }
}

/**
 * A conversation's messages read again, as role and parts, without what Mastra keeps beside each
 * part for itself (`createdAt`, `providerMetadata`) and its `step-start` markers.
 */
export async function rolesAndParts(hub: Hub, person: Person, url: string) {
  const messages = await messagesOf(hub, person, url)
  return messages.map((message) => [
    message.role,
    message.parts.flatMap((part) => {
      if (part.type === 'step-start') return []
      const { createdAt: _at, providerMetadata: _kept, ...drawn } = Object(part)
      return [drawn]
    }),
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
  const model = { model: MODEL, effort: 'off' }
  assert.equal((await call(hub, ana, 'PUT', `${company}/default-model`, model)).statusCode, 200)
  const made = await post(hub, ana, `${company}/projects`, { name: 'Encomendas' })
  assert.equal(made.statusCode, 201)
  const projectId = String(Object(made.json()).project.id)
  const conversations = `${company}/projects/${projectId}/conversations`
  return { hub, ana, companyId, projectId, conversations, anthropic, link, lines: hub.lines }
}

/**
 * A second Hub on the same databases, as after a restart or beside a process that stopped: its
 * own Builder and sessions, nothing shared in memory, its lines in `log`.
 */
export async function hubBeside(t: TestContext, hub: Hub, log: FailureLog = silent) {
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
    ...{ ...ports, log },
  })
  const status = createStatus({ version: config.version, database: test.database })
  const app = await createHub(config, { status, identity, ...subjects, webRoot: testWebRoot(t) })
  let closed: Promise<void> | undefined
  /** Shuts the Hub down as a stop signal does, waiting up to `settleMs` for the answers in flight. */
  function close(settleMs = 0) {
    const { conversations } = subjects
    closed ??= shutDown([app], {
      ...{ settleMs, settle: conversations.settle, drain: conversations.close },
      release: async () => undefined,
    })
    return closed
  }
  t.after(() => close())
  const builder = {
    ...hub.builder,
    bucket: ports.bucket,
    control: ports.control,
    knobs: ports.knobs,
  }
  return { ...hub, app, runs: subjects.runs, builder, close }
}

export async function started(hub: Hub, person: Person, conversations: string, body: object = {}) {
  const made = await post(hub, person, conversations, body, randomUUID())
  assert.equal(made.statusCode, 201, made.body)
  return String(Object(made.json()).conversation.id)
}

/** One event of Mastra's stream, as the screen receives it (`AgentControllerWireEvent`). */
export type StreamEvent = AgentControllerWireEvent

const Frame = z.looseObject({ type: z.string() })

/** How the run of these events ended (`agent_end`'s reason), or `undefined` when the last is another. */
export function endOf(events: readonly StreamEvent[] | undefined): string | undefined {
  const last = events?.at(-1)
  return last?.type === 'agent_end' ? (last.reason ?? 'complete') : undefined
}

/** The conversation's id at the end of its Hub URL. */
function conversationIdOf(url: string): string {
  return url.slice(url.lastIndexOf('/') + 1)
}

/** Where Mastra's routes serve the conversation's session (`guard.ts`). */
export function sessionUrl(url: string): string {
  return `/api/builder/agent-controller/builder/sessions/${conversationIdOf(url)}`
}

/** The person's message, through Mastra's own route, as the screen sends it. */
export function sent(hub: Hub, person: Person, url: string, content: string) {
  return post(hub, person, `${sessionUrl(url)}/messages`, { message: content })
}

/** Parar, through Mastra's own route. */
export function stopped(hub: Hub, person: Person, url: string) {
  return post(hub, person, `${sessionUrl(url)}/abort`, {})
}

/**
 * The conversation's stream, Mastra's own route, read event by event until the test closes it.
 * `seed` is the display state it opens with; `next` skips the display states Mastra says after
 * every event, which `seen.displays` keeps.
 */
export async function streamOf(hub: Hub, person: Person, url: string) {
  const response = await hub.app.inject({
    method: 'GET',
    url: `${sessionUrl(url)}/stream`,
    headers: { origin: TEST_ORIGIN, cookie: person.cookie },
    payloadAsStream: true,
  })
  assert.equal(response.statusCode, 200)
  assert.match(String(response.headers['content-type']), /^text\/event-stream/)
  const stream = response.stream()
  const waiting: StreamEvent[] = []
  const displays: StreamEvent[] = []
  const seen = { raw: '', comments: 0, ended: false, displays }
  let buffered = ''
  let wake: (() => void) | undefined
  stream.on('data', (chunk: Buffer) => {
    seen.raw += chunk.toString('utf8')
    buffered += chunk.toString('utf8')
    const frames = buffered.split('\n\n')
    buffered = frames.pop() ?? ''
    for (const frame of frames) {
      if (frame.startsWith(':')) seen.comments += 1
      if (!frame.startsWith('data: ')) continue
      const event: StreamEvent = JSON.parse(frame.slice(6))
      Frame.parse(event)
      if (event.type === 'display_state_changed') displays.push(event)
      else waiting.push(event)
    }
    wake?.()
  })
  // The Hub's close destroys an open stream: it ends without its last chunk.
  stream.on('close', () => {
    seen.ended = true
    wake?.()
  })
  async function until(done: () => boolean): Promise<void> {
    while (!done()) await new Promise<void>((resolve) => (wake = resolve))
  }
  async function next(): Promise<StreamEvent> {
    await until(() => waiting.length > 0)
    const event = waiting.shift()
    assert.ok(event !== undefined)
    return event
  }
  /** The display state the stream opened with. */
  async function seed() {
    await until(() => displays.length > 0)
    const [first] = displays
    assert.ok(first?.type === 'display_state_changed')
    return first.displayState
  }
  /** The next piece of the model's text (a `text-delta`), whatever events come before it. */
  async function text(): Promise<string> {
    for (;;) {
      const event = await next()
      if (event.type === 'message_update' && event.event.type === 'text-delta') {
        return event.event.delta
      }
    }
  }
  /** Every event until the run ends (`agent_end`), the end included. */
  async function turn(): Promise<StreamEvent[]> {
    const said: StreamEvent[] = []
    for (;;) {
      const event = await next()
      said.push(event)
      if (event.type === 'agent_end') return said
    }
  }
  function close() {
    stream.destroy()
  }
  return { next, seed, text, turn, close, until, seen }
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
  assert.equal((await sent(hub, person, url, content)).statusCode, 200)
  return { url, events: await stream.turn() }
}

/**
 * A message of the transcript as a test reads it: the person's or the Builder's, with Mastra's
 * parts and the calls it left waiting, by call (`metadata.suspendedTools`, as the Factory UI reads it).
 */
export type Read = {
  id: string
  role: 'person' | 'builder'
  parts: MastraMessagePart[]
  suspended: Record<string, unknown>
  createdAt: string
}

const Suspension = z.looseObject({ toolCallId: z.string() })
const Metadata = z.looseObject({ suspendedTools: z.record(z.string(), z.unknown()).optional() })

function suspendedOf(metadata: unknown): Record<string, unknown> {
  const read = Metadata.safeParse(metadata ?? {})
  const tools = read.success ? Object.values(read.data.suspendedTools ?? {}) : []
  return Object.fromEntries(
    tools.flatMap((each) => {
      const call = Suspension.safeParse(each)
      return call.success ? [[call.data.toolCallId, call.data]] : []
    }),
  )
}

const Listed = z.object({
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.string(),
      createdAt: z.string(),
      content: z.looseObject({ parts: z.array(z.looseObject({ type: z.string() })) }),
    }),
  ),
})

/** The whole transcript, oldest first, as the screen asks it. */
const OLDEST_FIRST = new URLSearchParams({
  perPage: 'false',
  orderBy: JSON.stringify({ field: 'createdAt', direction: 'ASC' }),
})

/**
 * The conversation's transcript, Mastra's own route (`threads/:threadId/messages`) as the screen
 * reads it: the person's messages (`user`, and `signal` for one sent to a run) and the Builder's.
 */
export async function messagesOf(hub: Hub, person: Person, url: string): Promise<Read[]> {
  const id = conversationIdOf(url)
  const read = await call(
    hub,
    person,
    'GET',
    `${sessionUrl(url)}/threads/${id}/messages?${OLDEST_FIRST}`,
  )
  assert.equal(read.statusCode, 200, read.body)
  return Listed.parse(read.json()).messages.flatMap((message): Read[] => {
    const role =
      message.role === 'assistant'
        ? 'builder'
        : message.role === 'user' || message.role === 'signal'
          ? 'person'
          : undefined
    if (role === undefined) return []
    const parts: MastraMessagePart[] = Object(message.content).parts
    const suspended = suspendedOf(message.content.metadata)
    return [{ id: message.id, role, parts, suspended, createdAt: message.createdAt }]
  })
}

/**
 * The transcript once its last message is the Builder's, read again for at most five seconds:
 * Mastra saves an errored run's messages a moment after its end.
 */
export async function answeredOf(hub: Hub, person: Person, url: string): Promise<Read[]> {
  for (let attempt = 0; ; attempt += 1) {
    const messages = await messagesOf(hub, person, url)
    if (messages.at(-1)?.role === 'builder' || attempt === 50) return messages
    await new Promise((done) => setTimeout(done, 100))
  }
}

/**
 * The transcript once two reads, a moment apart, agree: a failed turn's answer lands a moment after
 * its `agent_end` (Mastra 1.79 ends an errored run before its memory saves it), after the failure
 * the conversation saved before that end.
 */
export async function settledOf(hub: Hub, person: Person, url: string): Promise<Read[]> {
  for (let last = await answeredOf(hub, person, url), attempt = 0; ; attempt += 1) {
    await new Promise((done) => setTimeout(done, 300))
    const again = await answeredOf(hub, person, url)
    if (JSON.stringify(again) === JSON.stringify(last) || attempt === 15) return again
    last = again
  }
}

/**
 * The notices of the conversation's last turn, as the person reads them with its answer: Mastra's
 * stream does not say the answer's data parts, so the transcript is read once it settles.
 */
export async function turnNotices(hub: Hub, person: Person, url: string): Promise<string[]> {
  const messages = await settledOf(hub, person, url)
  const turn = messages.slice(messages.findLastIndex((message) => message.role === 'person') + 1)
  return noticesIn(turn.flatMap((message) => message.parts))
}
