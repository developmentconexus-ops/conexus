import { CONSTRUTOR_TOOL, ConstrutorResult } from '@conexus/hub-api'
import type { TranscriptItem } from './rows.ts'

const DRAFTING: readonly string[] = [CONSTRUTOR_TOOL.agentDraft, CONSTRUTOR_TOOL.agentSet]

/**
 * The calls of one answer whose card the answer's last result of the same agent replaces (step 24.3,
 * criterion 26): the card reads the live draft, so one card per agent is the whole of it, and the
 * earlier calls stay as the line of the tool.
 */
export function supersededCards(items: readonly TranscriptItem[]): ReadonlySet<string> {
  const latest = new Map<string, string>()
  const superseded = new Set<string>()
  for (const item of items) {
    if (item.kind !== 'tool' || !DRAFTING.includes(item.toolName)) continue
    const result = ConstrutorResult.safeParse(item.result)
    if (!result.success || result.data.kind !== 'SAVED') continue
    const earlier = latest.get(result.data.agent.id)
    if (earlier !== undefined) superseded.add(earlier)
    latest.set(result.data.agent.id, item.toolCallId)
  }
  return superseded
}
