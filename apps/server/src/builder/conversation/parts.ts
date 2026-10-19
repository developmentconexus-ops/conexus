import type { Message, MessagePart } from '@conexus/hub-api'
import type { MastraDBMessage, MastraMessagePart } from '@mastra/core/agent-controller'
import { z } from 'zod'
import { NOTICE_PART, Notice as NoticeData } from '../model-accounts/public.ts'

const Text = z.object({ type: z.literal('text'), text: z.string() })
const SourceUrl = z.object({
  type: z.literal('source-url'),
  url: z.url(),
  title: z.string().optional(),
})
const Source = z.object({
  type: z.literal('source'),
  source: z.object({ url: z.url(), title: z.string().optional() }),
})
// A page `web_fetch` answered with an HTTP status: not its call, and not one it refused.
const Fetch = z.object({
  type: z.literal('tool-invocation'),
  toolInvocation: z.object({
    toolName: z.literal('web_fetch'),
    state: z.literal('result'),
    args: z.object({ url: z.url() }),
    result: z.object({ status: z.number() }),
  }),
})
const Notice = z.object({ type: z.literal(NOTICE_PART), data: NoticeData })
const PersonSignal = z.object({ signal: z.object({ type: z.literal('user') }) })

/**
 * What the person sees of one of Mastra's parts: its text, a page read (a source the provider's
 * search cited, or an address `web_fetch` opened) and a queue notice; the rest stays inside.
 */
export function partOf(part: MastraMessagePart | unknown): MessagePart | undefined {
  const text = Text.safeParse(part)
  if (text.success) return text.data
  const cited = SourceUrl.safeParse(part)
  if (cited.success) return { type: 'page', url: cited.data.url, title: cited.data.title ?? null }
  const source = Source.safeParse(part)
  if (source.success) {
    const { url, title } = source.data.source
    return { type: 'page', url, title: title ?? null }
  }
  const fetched = Fetch.safeParse(part)
  if (fetched.success) {
    return { type: 'page', url: fetched.data.toolInvocation.args.url, title: null }
  }
  const notice = Notice.safeParse(part)
  if (notice.success) return { type: 'notice', text: notice.data.data.text }
  return undefined
}

/** A stored message as the person reads it: theirs, or the Builder's; none of Mastra's others. */
export function messageOf(message: MastraDBMessage): Message | undefined {
  const role =
    message.role === 'assistant'
      ? 'builder'
      : message.role === 'user' ||
          (message.role === 'signal' && PersonSignal.safeParse(message.content.metadata).success)
        ? 'person'
        : undefined
  if (role === undefined) return undefined
  const parts = message.content.parts.flatMap((part) => partOf(part) ?? [])
  return { id: message.id, role, parts, createdAt: new Date(message.createdAt).toISOString() }
}
