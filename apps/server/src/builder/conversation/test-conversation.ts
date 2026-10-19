import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import type { ConversationEvent } from '@conexus/hub-api'
import { ConversationEvent as Event } from '@conexus/hub-api'
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
import type { Anthropic } from '../../platform/test-anthropic.ts'
import { plantAnthropic } from '../../platform/test-anthropic.ts'
import { heldCompanyPostgres, testAppPorts } from '../../platform/test-app-ports.ts'
import { fakeCloudflare } from '../../platform/test-cloudflare.ts'
import { silent, TEST_ORIGIN, testWebRoot } from '../../platform/test-database.ts'
import { fakeNeon } from '../../platform/test-neon.ts'

export const MODEL = 'anthropic/claude-sonnet-4-5'
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
    (await call(hub, ana, 'PUT', `${company}/default-model`, { model: MODEL })).statusCode,
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
  const ports = testAppPorts(config, { neon: fakeNeon(), cloudflare: fakeCloudflare(), postgres })
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
  return { ...hub, app, close }
}

export async function started(hub: Hub, person: Person, conversations: string, body: object = {}) {
  const made = await post(hub, person, conversations, body, randomUUID())
  assert.equal(made.statusCode, 201, made.body)
  return String(Object(made.json()).conversation.id)
}

export function sent(hub: Hub, person: Person, url: string, content: string, key = randomUUID()) {
  return post(hub, person, `${url}/messages`, { content }, key)
}

/** The conversation's stream, read event by event until the test closes it. */
export async function streamOf(hub: Hub, person: Person, url: string) {
  const response = await hub.app.inject({
    method: 'GET',
    url: `${url}/events`,
    headers: { origin: TEST_ORIGIN, cookie: person.cookie },
    payloadAsStream: true,
  })
  assert.equal(response.statusCode, 200)
  assert.match(String(response.headers['content-type']), /^text\/event-stream/)
  const stream = response.stream()
  const waiting: ConversationEvent[] = []
  const seen = { raw: '', comments: 0, ended: false }
  let buffered = ''
  let wake: (() => void) | undefined
  stream.on('data', (chunk: Buffer) => {
    seen.raw += chunk.toString('utf8')
    buffered += chunk.toString('utf8')
    const frames = buffered.split('\n\n')
    buffered = frames.pop() ?? ''
    for (const frame of frames) {
      if (frame.startsWith('data: ')) waiting.push(Event.parse(JSON.parse(frame.slice(6))))
      else if (frame.startsWith(':')) seen.comments += 1
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
  return { next, turn, close, ended, until, seen }
}

/** One question asked on a new conversation of the Project, and the events of its turn; `between` runs once the conversation exists. */
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
  return { url, events: await stream.turn() }
}

/** The notices of a turn, in order. */
export function noticesOf(events: ConversationEvent[]): string[] {
  return events.flatMap((event) => (event.type === 'notice' ? [event.text] : []))
}
