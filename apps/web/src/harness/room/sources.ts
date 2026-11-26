import { CONVERSATION_TOOL, ReadCut } from '@conexus/hub-api'
import type { MastraMessagePart } from '@mastra/client-js'
import { z } from 'zod'
import { clockOf, dayGroupOf, dayOf } from '../../platform/dates.ts'
import { operationOf, stringArg } from './tool-args.ts'

/**
 * What a message's answer rests on: a page the model cited, from Mastra's `source` part (`linked`
 * is false for an address that is not `http:` or `https:`: the title shows as text and the address
 * is no link), or a company's data read live from the system's connection as the answer was written.
 */
export type MessageSource =
  | { kind: 'web'; url: string; title: string | undefined; domain: string; linked: boolean }
  | { kind: 'data'; connector: string; connection: string; table: string; at: string }
/** A message's sources as a row of its transcript. */
export type CitedRow = { kind: 'sources'; id: string; sources: readonly MessageSource[] }

const SourcePart = z.object({
  type: z.literal('source'),
  source: z.object({
    sourceType: z.literal('url'),
    url: z.string(),
    title: z.string().optional(),
  }),
})

const ToolPart = z.object({
  type: z.literal('tool-invocation'),
  toolInvocation: z.object({
    state: z.literal('result'),
    toolName: z.string(),
    args: z.unknown(),
    result: z.unknown(),
  }),
})

const LiveResult = ReadCut.required({ at: true })

/** "hoje às 08:45", "ontem às 08:45" or "em 17/10/2026 às 08:45": the one way a data source says when. */
export function whenOf(at: string, now: Date): string {
  const clock = clockOf(at)
  switch (dayGroupOf(at, now)) {
    case 'TODAY':
      return `hoje às ${clock}`
    case 'YESTERDAY':
      return `ontem às ${clock}`
    default:
      return `em ${dayOf(at)} às ${clock}`
  }
}

function sourceOf(url: string, title: string | undefined): MessageSource | undefined {
  const named = title === undefined || title.trim() === '' ? undefined : title
  const parsed = URL.parse(url)
  if (parsed?.protocol === 'http:' || parsed?.protocol === 'https:')
    return { kind: 'web', url, title: named, domain: parsed.hostname, linked: true }
  return named === undefined
    ? undefined
    : { kind: 'web', url, title: named, domain: '', linked: false }
}

/** The connector and the operation a live read names: `connector_read`'s "sankhya.consultar" or a typed read's `sankhya_pedidos`. */
function liveRead(
  toolName: string,
  args: unknown,
): { connector: string; operation: string } | undefined {
  const [connector, operation] =
    toolName === CONVERSATION_TOOL.connectorRead ? operationOf(args) : toolName.split(/_(.*)/s)
  return connector && operation ? { connector, operation } : undefined
}

function liveOf(toolName: string, args: unknown, result: unknown): MessageSource[] {
  const read = LiveResult.safeParse(result)
  const named = liveRead(toolName, args)
  const connection = stringArg(args, 'connection')
  if (!read.success || named === undefined || connection === undefined) return []
  return [
    {
      kind: 'data',
      connector: named.connector,
      connection,
      table: named.operation,
      at: read.data.at,
    },
  ]
}

/** The one key a source is told apart by: a page's address, or a table of a system. */
export function keyOf(source: MessageSource): string {
  if (source.kind === 'web') return source.url
  return `${source.connector}:${source.connection}:${source.table}`
}

/** The sources a message shows, each once: the pages the model cited and the data its tools read. */
export function sourcesOf(parts: readonly MastraMessagePart[]): MessageSource[] {
  const seen = new Set<string>()
  const sources: MessageSource[] = []
  for (const part of parts) {
    for (const source of sourcesIn(part)) {
      const key = keyOf(source)
      if (seen.has(key)) continue
      seen.add(key)
      sources.push(source)
    }
  }
  return sources
}

function sourcesIn(part: MastraMessagePart): MessageSource[] {
  const cited = SourcePart.safeParse(part)
  if (cited.success) {
    const source = sourceOf(cited.data.source.url, cited.data.source.title)
    return source === undefined ? [] : [source]
  }
  const tool = ToolPart.safeParse(part)
  if (!tool.success) return []
  const { toolName, args, result } = tool.data.toolInvocation
  return liveOf(toolName, args, result)
}
