import { posix } from 'node:path'

export const SRC = 'apps/server/src'
export const OLD = `${SRC}/builder`

export const AREAS = ['g5a', 'g5b', 'g5c', 'g5d', 'g5e', 'g5f'] as const
export type Area = (typeof AREAS)[number]

type Row = { area: Area; to: string }

/**
 * The owner of each file of builder/, by its subject and never by who imports it (card "Uma sala e os nomes
 * certos", U7): a folder's row takes its files, a file's row takes a file whose owner is not its folder's, and the
 * longest row wins. A row's target is a folder of src/, or the file's whole new path when it ends in an extension.
 * Six areas, delivered in two pull requests (G5-harness, G5-agents); a row names the area that moves it.
 */
const ROWS = new Map<string, Row>([
  ['mastra', { area: 'g5a', to: 'harness/mastra' }],
  ['model-accounts', { area: 'g5b', to: 'harness/model-accounts' }],
  ['machine', { area: 'g5c', to: 'harness/machine' }],
  ['schema', { area: 'g5d', to: 'harness/schema' }],
  ['controller-kit', { area: 'g5d', to: 'harness/spec' }],
  ['controller-kit/instructions.ts', { area: 'g5d', to: 'harness/prompt' }],
  ['controller-context', { area: 'g5d', to: 'harness/memory' }],
  ['conversation', { area: 'g5f', to: 'agents/app-builder' }],
  ['conversation/guard.ts', { area: 'g5d', to: 'harness/routes' }],
  ['conversation/guard.test.ts', { area: 'g5d', to: 'harness/routes' }],
  ['conversation/stream.ts', { area: 'g5d', to: 'harness/routes' }],
  ['conversation/conversation-routes.test.ts', { area: 'g5d', to: 'harness/routes' }],
  ['conversation/conversation-stream.test.ts', { area: 'g5d', to: 'harness/routes' }],
  ['conversation/conversation-stream-paced.test.ts', { area: 'g5d', to: 'harness/routes' }],
  ['conversation/test-conversation.ts', { area: 'g5d', to: 'harness/routes' }],
  ['conversation/test-parts.ts', { area: 'g5d', to: 'harness/routes' }],
  ['conversation/test-questions.ts', { area: 'g5d', to: 'harness/routes' }],
  ['conversation/test-research.ts', { area: 'g5d', to: 'harness/routes' }],
  ['conversation/end.ts', { area: 'g5d', to: 'harness/turn' }],
  ['conversation/turn-line.ts', { area: 'g5d', to: 'harness/turn' }],
  ['conversation/turn-line.test.ts', { area: 'g5d', to: 'harness/turn' }],
  ['conversation/drain.test.ts', { area: 'g5d', to: 'harness/turn' }],
  ['conversation/storage.ts', { area: 'g5d', to: 'harness/memory' }],
  ['conversation/conversation-pool.test.ts', { area: 'g5d', to: 'harness/memory' }],
  ['conversation/prompt/conexus.md', { area: 'g5d', to: 'harness/prompt' }],
  ['conversation/builder-end.ts', { area: 'g5f', to: 'agents/app-builder/end.ts' }],
  ['company-tools', { area: 'g5e', to: 'harness/tools/company' }],
  ['data-tools', { area: 'g5e', to: 'harness/tools/data' }],
  ['connectors', { area: 'g5e', to: 'harness/tools/connectors' }],
  ['app-data', { area: 'g5e', to: 'harness/tools/app-data' }],
  ['runs', { area: 'g5f', to: 'agents/app-builder/runs' }],
  ['git', { area: 'g5f', to: 'agents/app-builder/git' }],
  ['assistant', { area: 'g5f', to: 'agents/assistant' }],
  ['automations', { area: 'g5f', to: 'agents/assistant/automations' }],
  ['construtor', { area: 'g5f', to: 'agents/agent-builder' }],
  ['agents', { area: 'g5f', to: 'agents/saved-agent' }],
  ['tools', { area: 'g5f', to: 'agents/saved-agent/tools' }],
])

/** The folders of builder/ the table names, for the paths a document gives without their tree. */
export const ROWS_TOP = [...new Set([...ROWS.keys()].map((row) => row.split('/')[0] ?? row))]

/** The one agent whose door another agent reads: the Construtor de agentes reads the saved agent's. */
export const READS = new Map<string, string>([['agent-builder', 'saved-agent']])

function rowKeyOf(rel: string): string | undefined {
  return [...ROWS.keys()]
    .filter((row) => rel === row || rel.startsWith(`${row}/`))
    .sort((a, b) => b.length - a.length)[0]
}

/** Where a file of builder/ ends up, and in which pull request. */
export function destinationOf(file: string): { area: Area; to: string } | undefined {
  const rel = file.slice(OLD.length + 1)
  const key = rowKeyOf(rel)
  const row = key === undefined ? undefined : ROWS.get(key)
  if (key === undefined || row === undefined) return undefined
  const whole = /\.\w+$/.test(row.to)
  const tail = rel === key ? posix.basename(rel) : rel.slice(key.length + 1)
  return { area: row.area, to: `${SRC}/${whole ? row.to : `${row.to}/${tail}`}` }
}

export function isOld(file: string): boolean {
  return file.startsWith(`${OLD}/`)
}

/** A folder row of the table, from its old path to its new one, for the paths documents cite. */
export function folderRows(area: Area): ReadonlyMap<string, string> {
  return new Map(
    [...ROWS]
      .filter(([row, one]) => one.area === area && !/\.\w+$/.test(row) && !/\.\w+$/.test(one.to))
      .map(([row, one]) => [`${OLD}/${row}`, `${SRC}/${one.to}`]),
  )
}
