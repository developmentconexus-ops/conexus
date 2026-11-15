import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { post } from '../../hub/identity/test-hub.ts'
import type { Sent } from '../../platform/test-anthropic.ts'
import type { Block } from '../../platform/test-anthropic-stream.ts'
import { agentsOn } from '../agents/test-agents.ts'
import { talking } from '../assistant/test-assistant.ts'
import { stepped } from '../conversation/test-questions.ts'

/** One streamed call of the Construtor's model: the blocks it answers, from what it was given. */
export type Step = (asked: Sent) => Block[]

/** The answer of the tool the model's last call carried, as the tool returned it. */
export function resultOf(asked: Sent): Record<string, unknown> {
  const text = asked.texts.at(-1)
  assert.ok(text, 'a tool answer')
  return Object(JSON.parse(text))
}

/** A Hub whose Construtor answers `steps`, and a conversation of Ana's with it, its stream open. */
export async function building(t: TestContext, steps: readonly Step[]) {
  const on = await agentsOn(t, stepped(steps))
  const url = await opened(on)
  return { ...on, url, conversation: await talking(t, on.hub, on.ana, url) }
}

/** A conversation of Ana's with the Construtor in the test Projeto, by its Hub address. */
export async function opened(
  on: { hub: Hub; ana: Person; company: string; projectId: string },
  key: string = randomUUID(),
) {
  const url = `${on.company}/projects/${on.projectId}/construtor/conversations`
  const made = await post(on.hub, on.ana, url, {}, key)
  assert.equal(made.statusCode, 201, made.body)
  return `${url}/${String(Object(made.json()).conversation.id)}`
}

/** A step that keeps the tool answer it was given in `into` and ends the turn. */
export function keeping(into: Record<string, unknown>[]): Step {
  return (asked) => {
    into.push(resultOf(asked))
    return [{ type: 'text', text: 'Pronto.' }]
  }
}

/** The items of an answer's list. */
export function listOf(value: unknown): Record<string, unknown>[] {
  assert.ok(Array.isArray(value), 'a list')
  return value.map((each) => Object(each))
}

/** Whether the conversation at `url` is still kept: Mastra's thread is the only record of it. */
export async function kept(on: { hub: Hub }, url: string): Promise<boolean> {
  const id = url.slice(url.lastIndexOf('/') + 1)
  const found = await on.hub.test.mastraPool.query(
    'select count(*)::int as n from mastra.mastra_threads where id = $1',
    [id],
  )
  return found.rows[0]?.n === 1
}
