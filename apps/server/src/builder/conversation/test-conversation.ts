import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import type { ConversationEvent } from '@conexus/hub-api'
import { ConversationEvent as Event } from '@conexus/hub-api'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { call, companyOn, post } from '../../hub/identity/test-hub.ts'
import type { Anthropic } from '../../platform/test-anthropic.ts'
import { plantAnthropic } from '../../platform/test-anthropic.ts'
import { TEST_ORIGIN } from '../../platform/test-database.ts'

export const MODEL = 'anthropic/claude-sonnet-4-5'
export const KEY = 'sk-ant-conversation-key-0001'

/** Empresa Teste, Ana its owner, an Anthropic key and the default model, and a Projeto. */
export async function conversing(t: TestContext, answer: Anthropic['answer']) {
  const anthropic = plantAnthropic(t, answer)
  const { hub, ana, companyId } = await companyOn(t)
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
  return { hub, ana, companyId, projectId, conversations, anthropic, link }
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
  let buffered = ''
  let wake: (() => void) | undefined
  stream.on('data', (chunk: Buffer) => {
    buffered += chunk.toString('utf8')
    const frames = buffered.split('\n\n')
    buffered = frames.pop() ?? ''
    for (const frame of frames) {
      if (frame.startsWith('data: ')) waiting.push(Event.parse(JSON.parse(frame.slice(6))))
    }
    wake?.()
  })
  async function next(): Promise<ConversationEvent> {
    for (;;) {
      const event = waiting.shift()
      if (event !== undefined) return event
      await new Promise<void>((resolve) => (wake = resolve))
    }
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
  return { next, turn, close }
}
