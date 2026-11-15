import type { MastraMessagePart } from '@mastra/client-js'
import { z } from 'zod'

/**
 * A page the model's answer rests on, from Mastra's `source` part. `linked` is false for an
 * address that is not `http:` or `https:`: the title shows as text and the address is no link.
 */
export type MessageSource = {
  url: string
  title: string | undefined
  domain: string
  linked: boolean
}
/** A message's cited pages as a row of its transcript. */
export type CitedRow = { kind: 'sources'; id: string; sources: readonly MessageSource[] }

const SourcePart = z.object({
  type: z.literal('source'),
  source: z.object({
    sourceType: z.literal('url'),
    url: z.string(),
    title: z.string().optional(),
  }),
})

function sourceOf(url: string, title: string | undefined): MessageSource | undefined {
  const named = title === undefined || title.trim() === '' ? undefined : title
  const parsed = URL.parse(url)
  if (parsed?.protocol === 'http:' || parsed?.protocol === 'https:')
    return { url, title: named, domain: parsed.hostname, linked: true }
  return named === undefined ? undefined : { url, title: named, domain: '', linked: false }
}

/** The pages a message cites, each once: the `source` parts of Mastra, as the model's provider gave them. */
export function sourcesOf(parts: readonly MastraMessagePart[]): MessageSource[] {
  const seen = new Set<string>()
  const sources: MessageSource[] = []
  for (const part of parts) {
    const read = SourcePart.safeParse(part)
    if (!read.success || seen.has(read.data.source.url)) continue
    seen.add(read.data.source.url)
    const source = sourceOf(read.data.source.url, read.data.source.title)
    if (source !== undefined) sources.push(source)
  }
  return sources
}
