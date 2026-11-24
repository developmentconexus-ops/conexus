import type { Room } from './room.ts'
import type { ToolItem } from './rows.ts'
import { specOf, toolStatus } from './tool-registry.ts'

/** The line of a group of tools: how many, what they did, and how many failed. */
export function summaryOfTools(
  tools: readonly ToolItem[],
  room: Room,
): { short: string; full: string } {
  const count = tools.length
  const verbs: string[] = []
  for (const tool of tools) {
    const verb = specOf(tool.toolName, room)?.verb ?? 'usou'
    if (!verbs.includes(verb)) verbs.push(verb)
  }
  const failed = tools.filter((tool) => {
    const status = toolStatus(tool, room)
    return status === 'error' || status === 'denied'
  }).length
  const baseFull = `${count} ferramentas: ${verbs.join(', ')}`
  const full =
    failed > 0 ? `${baseFull} · ${failed} ${failed === 1 ? 'falhou' : 'falharam'}` : baseFull
  return { short: `${count} ferramentas`, full }
}
