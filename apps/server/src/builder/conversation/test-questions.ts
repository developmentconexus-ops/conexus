import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import type { ConversationEvent, MastraPart } from '@conexus/hub-api'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { post } from '../../hub/identity/test-hub.ts'
import type { Anthropic, Reply, Sent } from '../../platform/test-anthropic.ts'
import { ASK_USER_TOOL, SUBMIT_PLAN_TOOL } from './plan-tools.ts'
import { conversing, sent, started, streamOf } from './test-conversation.ts'

type Block = Extract<Reply, { kind: 'blocks' }>['blocks'][number]
type Suspended = Extract<ConversationEvent, { type: 'tool_suspended' }>

/** The tool each kind of card is, as Mastra names the call it parks. */
const CARD_TOOL = { question: ASK_USER_TOOL, plan: SUBMIT_PLAN_TOOL } as const

/** A tool call of the model's. */
export function tool(name: string, input: object): Block {
  return { type: 'tool_use', name, input }
}

/** An `ask_user` call with these questions. */
export function ask(...questions: object[]): Block {
  return tool(ASK_USER_TOOL, { questions })
}

export const WHO = {
  question: 'Quem cadastra as encomendas?',
  options: [{ label: 'Todos (recomendado)' }, { label: 'Só eu' }],
}
export const PLAN = '.conexus/plans/encomendas.md'
/** A write of the plan file `path`; the plan's text is `body`. */
export function writePlan(path: string, body = 'Para a pessoa: um cadastro simples.'): Block {
  return tool('mastra_workspace_write_file', { path, content: `# App de encomendas\n\n${body}\n` })
}
export const WRITE_PLAN = writePlan(PLAN)
export function submitPlan(path: string): Block {
  return tool(SUBMIT_PLAN_TOOL, { path })
}
/** The read the workspace asks for before it overwrites a file. */
export const readPlan = tool('mastra_workspace_read_file', { path: PLAN })
export const SUBMIT = submitPlan(PLAN)

/** The model's steps in order, then `Pronto.`; each call is kept in `calls` for the test to read. */
export function stepping(steps: Block[][], calls: Sent[]): Anthropic['answer'] {
  let step = 0
  return (asked) => {
    if (!asked.stream) return { kind: 'text', text: 'Título' }
    calls.push(asked)
    const blocks = steps[step]
    step += 1
    return blocks === undefined ? { kind: 'text', text: 'Pronto.' } : { kind: 'blocks', blocks }
  }
}

/** The model's steps in order, then `Pronto.`; each call's texts are kept for the test to read. */
export async function conversingWith(t: TestContext, steps: Block[][]) {
  const calls: Sent[] = []
  const hub = await conversing(t, stepping(steps, calls))
  const url = `${hub.conversations}/${await started(hub.hub, hub.ana, hub.conversations)}`
  const stream = await streamOf(hub.hub, hub.ana, url)
  t.after(() => stream.close())
  function send(content = 'Crie um app de encomendas') {
    return sent(hub.hub, hub.ana, url, content)
  }
  return { ...hub, url, stream, calls, send }
}

/**
 * The events of the turn that asks the next card of `type` (its `tool_suspended`), up to its
 * `turnEnd`: a question ends the turn, and its answer opens the next one.
 */
export async function untilCard(
  stream: Awaited<ReturnType<typeof streamOf>>,
  type: keyof typeof CARD_TOOL,
) {
  const events: ConversationEvent[] = []
  let card: Suspended | undefined
  for (;;) {
    const event = await stream.next()
    events.push(event)
    if (event.type === 'tool_suspended' && event.toolName === CARD_TOOL[type]) card ??= event
    if (event.type === 'turnEnd' && card !== undefined) return { events, card }
  }
}

/** The questions and plans a turn parked, in order. */
export function cards(events: ConversationEvent[]): Suspended[] {
  const tools: string[] = Object.values(CARD_TOOL)
  return events.flatMap((event) =>
    event.type === 'tool_suspended' && tools.includes(event.toolName) ? [event] : [],
  )
}

export function answerUrl(url: string, toolCallId: string) {
  return `${url}/questions/${toolCallId}`
}

/** The states of a call as its `tool-invocation` parts say it (`result` once answered), in order. */
export function invocations(parts: MastraPart[], toolCallId: string) {
  return parts.flatMap((part) =>
    part.type === 'tool-invocation' && part.toolInvocation.toolCallId === toolCallId
      ? [part.toolInvocation]
      : [],
  )
}

/** The parked runs in Mastra's database: one run keeps a snapshot of its loop and of its execution. */
export const PARKED = `select distinct run_id from mastra.mastra_workflow_snapshot where snapshot->>'status' = 'suspended'`

/** What `said` resolves to within `ms`, or `undefined`: a stream that says nothing fails the test, not hangs it. */
export async function within<T>(ms: number, said: Promise<T>): Promise<T | undefined> {
  return Promise.race([said, sleep(ms).then(() => undefined)])
}

/** What a call that Mastra closed without an answer reads as: the states of its `tool-invocation` part. */
export const CLOSED = ['output-denied']

export function stateOf(parts: MastraPart[], toolCallId: string): string[] {
  return invocations(parts, toolCallId).map((each) => each.state)
}

const LOOP_PARKED = `select 1 from mastra.mastra_workflow_snapshot where workflow_name = 'agentic-loop' and snapshot->>'status' = 'suspended'`

/**
 * Waits until Mastra keeps the asking run parked: it writes the loop's snapshot a moment after the
 * turn's end, and its own resume refuses an answer that comes first.
 */
export async function untilParked(hub: Hub) {
  for (
    let attempt = 0;
    (await hub.test.mastraPool.query(LOOP_PARKED)).rowCount === 0;
    attempt += 1
  ) {
    assert.ok(attempt < 50, 'Mastra keeps the parked run')
    await sleep(100)
  }
}

/** Answers a card as a person does, once Mastra keeps its run parked. */
export async function answerTo(
  hub: Hub,
  person: Person,
  url: string,
  toolCallId: string,
  body: object,
) {
  await untilParked(hub)
  return post(hub, person, answerUrl(url, toolCallId), body)
}

export async function parkedRows(hub: {
  test: { mastraPool: { query(sql: string): Promise<{ rowCount: number | null }> } }
}) {
  return (await hub.test.mastraPool.query(PARKED)).rowCount
}
