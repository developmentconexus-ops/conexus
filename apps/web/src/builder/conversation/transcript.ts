import type { MastraPart, Message, Suspended } from '@conexus/hub-api'
import type { TranscriptItem } from './transcript-items.ts'
import { invocationToItem, thoughtSeconds } from './transcript-items.ts'

export * from './transcript-items.ts'

export function textOf(message: Message): string {
  return message.parts.flatMap((part) => (part.type === 'text' ? [part.text] : [])).join('\n')
}

/** What a command in progress has said, and how it ended: the whole of its tail, not a piece. */
export type Running = {
  output: string
  cuts?: string[]
  exit?: { code: number; success: boolean }
}

/** What Mastra's messages do not carry: the calls waiting on the person, and the commands running. */
export type View = {
  suspended?: Readonly<Record<string, Suspended>>
  running?: Readonly<Record<string, Running>>
  /** When the screen first heard of each tool call, by its id, epoch ms. */
  heard?: Readonly<Record<string, number>>
  /** The answer is still arriving: its last thinking is in progress. */
  live?: boolean
}

function fromParts(
  message: Message,
  thoughts: ReadonlyMap<string, number>,
  view: View,
): TranscriptItem[] {
  if (message.role === 'person') {
    const text = textOf(message)
    return [{ kind: 'person', id: message.id, text, createdAt: message.createdAt }]
  }
  const suspended = { ...view.suspended, ...message.suspended }
  const items: TranscriptItem[] = []
  for (const [index, part] of message.parts.entries()) {
    const id = `${message.id}-${index}`
    // Mastra opens a step with an empty text part: it says nothing and must not split a run of tools.
    if (part.type === 'text') {
      if (part.text.trim() !== '')
        items.push({ kind: 'text', id, text: part.text, cuts: part.cuts })
    } else if (part.type === 'reasoning')
      items.push({
        kind: 'reasoning',
        id,
        reasoning: part.reasoning,
        seconds: thoughts.get(`${message.id}.${index}`) ?? null,
        streaming: false,
        cuts: part.cuts,
      })
    else if (part.type === 'tool-invocation') {
      const item = invocationToItem(
        part.toolInvocation,
        suspended[part.toolInvocation.toolCallId],
        part.cuts,
      )
      if (item) items.push(item)
    } else if (part.type.startsWith('data-conexus-') && part.type !== 'data-conexus-thought') {
      // Mastra's own `data-*` parts (the memory's) are not rows, and must not split a run of tools.
      items.push({ kind: 'conexus', id, partType: part.type, data: part.data, cuts: part.cuts })
    }
  }
  return items
}

/** A tool's own row of a call that ended outside Mastra's parts: its output and its exit. */
function withRunning(item: TranscriptItem, running: Running | undefined): TranscriptItem {
  if (item.kind !== 'tool' || running === undefined) return item
  const failed = running.exit?.success === false
  return {
    ...item,
    output: running.output,
    cuts: running.cuts ?? item.cuts,
    exitCode: running.exit?.code,
    state: failed ? 'output-error' : item.state,
    isError: failed ? true : item.isError,
  }
}

/** The tool calls these parts name, each stamped the first time the screen hears it. */
export function heardOf(
  heard: Readonly<Record<string, number>>,
  parts: readonly MastraPart[],
): Readonly<Record<string, number>> {
  const fresh = parts.flatMap((part) =>
    part.type === 'tool-invocation' && !Object.hasOwn(heard, part.toolInvocation.toolCallId)
      ? [part.toolInvocation.toolCallId]
      : [],
  )
  if (fresh.length === 0) return heard
  const now = Date.now()
  return { ...heard, ...Object.fromEntries(fresh.map((id) => [id, now])) }
}

/** A tool's row counts its clock from when the screen first heard of the call. */
function withHeard(
  item: TranscriptItem,
  heard: Readonly<Record<string, number>> | undefined,
): TranscriptItem {
  return item.kind === 'tool' && heard?.[item.id] !== undefined
    ? { ...item, startedAt: heard[item.id] }
    : item
}

/**
 * The one derivation of the conversation's rows, for a read and for the answer in progress alike.
 * Mastra gives a tool's call and its result in different messages, so a row of the same call
 * keeps the place of the first and the state of the last.
 */
export function fromMessages(messages: readonly Message[], view: View = {}): TranscriptItem[] {
  const thoughts = thoughtSeconds(messages.flatMap((message) => message.parts))
  const items: TranscriptItem[] = []
  const placed = new Map<string, number>()
  for (const message of messages) {
    for (const found of fromParts(message, thoughts, view)) {
      const item = withHeard(withRunning(found, view.running?.[found.id]), view.heard)
      const at = placed.get(item.id)
      if (at === undefined) placed.set(item.id, items.push(item) - 1)
      else items[at] = item
    }
  }
  const last = items.at(-1)
  if (view.live === true && last?.kind === 'reasoning') {
    items[items.length - 1] = { ...last, streaming: true }
  }
  return items
}
