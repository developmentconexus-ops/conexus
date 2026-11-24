import type { MastraMessagePart } from '@mastra/client-js'
import type { Stored } from './messages.ts'

export type Invocation = Extract<MastraMessagePart, { type: 'tool-invocation' }>['toolInvocation']

export function isTerminal(state: Invocation['state']): boolean {
  return state === 'result' || state === 'output-error' || state === 'output-denied'
}

/**
 * Whether the read's copy of a message draws every part of the held one, as Factory's
 * `windowCopyCovers`: the same text or more, the same calls, each settled in the copy if settled
 * in the held one.
 */
function copyCovers(
  held: readonly MastraMessagePart[],
  copy: readonly MastraMessagePart[],
): boolean {
  if (copy.length < held.length) return false
  return held.every((part, index) => {
    const there = copy[index]
    if (part.type === 'text' && there?.type === 'text') return there.text.startsWith(part.text)
    if (part.type === 'tool-invocation' && there?.type === 'tool-invocation') {
      return (
        part.toolInvocation.toolCallId === there.toolInvocation.toolCallId &&
        (!isTerminal(part.toolInvocation.state) || isTerminal(there.toolInvocation.state))
      )
    }
    return JSON.stringify(part) === JSON.stringify(there)
  })
}

function callsOf(message: Stored): string[] {
  return message.content.parts.flatMap((part) =>
    part.type === 'tool-invocation' ? [part.toolInvocation.toolCallId] : [],
  )
}

/**
 * The messages the read saves of a run the screen holds: Mastra tells one message for the whole run
 * and saves one for each step, so the read's step is the held message, matched by the id of a call
 * (Factory `claimOnScreenEntries`). The held message takes the read's parts when they cover it
 * (`adoptCoveringWindowCopies`); otherwise it takes the calls the read settled (`reconcileToolResults`),
 * which a gap in the stream can have swallowed.
 */
export function claimed(
  held: readonly Stored[],
  read: readonly Stored[],
): { held: Stored[]; read: Stored[] } {
  const told = new Set(held.map((message) => message.id))
  const saved = new Set(read.map((message) => message.id))
  const owner = new Map<string, string>()
  for (const message of held.filter((each) => !saved.has(each.id)))
    for (const call of callsOf(message)) owner.set(call, message.id)
  const copies = new Map<string, Stored[]>()
  const rest: Stored[] = []
  for (const message of read) {
    const id = told.has(message.id)
      ? undefined
      : callsOf(message)
          .map((call) => owner.get(call))
          .find((each) => each !== undefined)
    if (id === undefined) rest.push(message)
    else copies.set(id, [...(copies.get(id) ?? []), message])
  }
  return {
    held: held.map((message) => adopted(message, copies.get(message.id) ?? [])),
    read: rest,
  }
}

function adopted(message: Stored, copies: readonly Stored[]): Stored {
  const covering = copies.findLast((copy) => copyCovers(message.content.parts, copy.content.parts))
  if (covering)
    return { ...message, content: { ...message.content, parts: covering.content.parts } }
  const settled = new Map<string, MastraMessagePart>()
  for (const part of copies.flatMap((copy) => copy.content.parts))
    if (part.type === 'tool-invocation' && isTerminal(part.toolInvocation.state))
      settled.set(part.toolInvocation.toolCallId, part)
  const parts = message.content.parts.map((part) =>
    part.type === 'tool-invocation' && !isTerminal(part.toolInvocation.state)
      ? (settled.get(part.toolInvocation.toolCallId) ?? part)
      : part,
  )
  return { ...message, content: { ...message.content, parts } }
}
