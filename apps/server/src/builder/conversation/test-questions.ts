import type { TestContext } from 'node:test'
import type { ConversationEvent, MastraPart } from '@conexus/hub-api'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
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

/** The model's steps in order, then `Pronto.`; each call's texts are kept for the test to read. */
export async function conversingWith(t: TestContext, steps: Block[][]) {
  let step = 0
  const calls: Sent[] = []
  const hub = await conversing(t, (asked) => {
    if (!asked.stream) return { kind: 'text', text: 'Título' }
    calls.push(asked)
    const blocks = steps[step]
    step += 1
    return blocks === undefined ? { kind: 'text', text: 'Pronto.' } : { kind: 'blocks', blocks }
  })
  const url = `${hub.conversations}/${await started(hub.hub, hub.ana, hub.conversations)}`
  const stream = await streamOf(hub.hub, hub.ana, url)
  t.after(() => stream.close())
  function send(content = 'Crie um app de encomendas') {
    return sent(hub.hub, hub.ana, url, content)
  }
  return { ...hub, url, stream, calls, send }
}

/** The events up to the next card of `type` the turn waits on (its `tool_suspended`), the card last. */
export async function untilCard(
  stream: Awaited<ReturnType<typeof streamOf>>,
  type: keyof typeof CARD_TOOL,
) {
  const events: ConversationEvent[] = []
  for (;;) {
    const event = await stream.next()
    events.push(event)
    if (event.type === 'tool_suspended' && event.toolName === CARD_TOOL[type]) {
      return { events, card: event }
    }
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
