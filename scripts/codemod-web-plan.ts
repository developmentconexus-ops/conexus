import { readFileSync } from 'node:fs'
import { posix } from 'node:path'
import type { Named, Ref } from './codemod-web-imports.ts'
import { isCode, isDoor, isTest, namesOfDoor, parse, refsOf } from './codemod-web-imports.ts'

export const SRC = 'apps/web/src'
export const OLD = `${SRC}/builder`

/**
 * The owner of each file of builder/, by its subject and never by who imports it (card "Uma sala e os nomes certos",
 * U3): a folder's row takes its files, a file's row takes a file whose owner is not its folder's, and the longest
 * row wins.
 */
const OWNERS = new Map<string, string>([
  ['assistant', 'agents/assistant'],
  ['automations', 'agents/assistant/automations'],
  ['tools', 'agents/saved-agent/tools'],
  ['model-accounts', 'harness/model-accounts'],
  ['observational-memory', 'harness/memory'],
  ['preview', 'agents/app-builder/preview'],
  ['source', 'agents/app-builder/source'],
  ['conversation', 'harness/room'],
  ['conversation/conversation-switch.tsx', 'agents/app-builder'],
  ['conversation/first-message.tsx', 'agents/app-builder'],
  ['conversation/panel.tsx', 'agents/app-builder'],
  ['conversation/panel.test.tsx', 'agents/app-builder'],
  ['conversation/panel-sources.test.tsx', 'agents/app-builder'],
  ['conversation/workbench.tsx', 'agents/app-builder'],
  ['conversation/workbench.test.tsx', 'agents/app-builder'],
  ['agents', 'agents/saved-agent'],
  ['agents/construtor-area.tsx', 'agents/agent-builder'],
  ['agents/construtor-area.test.tsx', 'agents/agent-builder'],
  ['agents/construtor-card.test.tsx', 'agents/agent-builder'],
  ['agents/construtor-chat.tsx', 'agents/agent-builder'],
  ['agents/construtor-chat.test.tsx', 'agents/agent-builder'],
  ['agents/construtor-loader.ts', 'agents/agent-builder'],
  ['agents/construtor-queries.ts', 'agents/agent-builder'],
  ['agents/construtor-text.ts', 'agents/agent-builder'],
  ['agents/draft-panel.tsx', 'agents/agent-builder'],
  ['agents/draft-panel.test.tsx', 'agents/agent-builder'],
  ['agents/tool-chip.tsx', 'agents/agent-builder'],
])

/** The one agent whose door another agent reads: the Construtor de agentes reads the saved agent's, as on the server. */
const READS = new Map<string, string>([['agent-builder', 'saved-agent']])

export type Move = { from: string; to: string }

export type Graph = {
  texts: Map<string, string>
  refs: Map<string, Ref[]>
  doors: Map<string, Map<string, Named>>
}

function isOld(file: string): boolean {
  return file.startsWith(`${OLD}/`)
}

export function graphOf(files: readonly string[]): Graph {
  const graph: Graph = { texts: new Map(), refs: new Map(), doors: new Map() }
  for (const file of files.filter(isCode)) {
    const text = readFileSync(file, 'utf8')
    graph.texts.set(file, text)
    if (isDoor(file) && isOld(file)) graph.doors.set(file, namesOfDoor(file, text))
    else graph.refs.set(file, refsOf(file, parse(file, text)))
  }
  return graph
}

export function reached(graph: Graph, ref: Ref): string[] {
  const door = graph.doors.get(ref.target)
  if (door === undefined) return [ref.target]
  return ref.names.map((name) => {
    const named = door.get(name.imported)
    if (named === undefined) throw new Error(`${ref.target} does not export ${name.imported}`)
    return named.file
  })
}

function rowOf(inside: string): string | undefined {
  return [...OWNERS.keys()]
    .filter((row) => inside === row || inside.startsWith(`${row}/`))
    .sort((a, b) => b.length - a.length)[0]
}

export function plan(files: readonly string[]): Move[] {
  const moves: Move[] = []
  const homeless: string[] = []
  for (const file of files.filter((one) => isOld(one) && !isDoor(one))) {
    const inside = file.slice(OLD.length + 1)
    const row = rowOf(inside)
    const to = row === undefined ? undefined : OWNERS.get(row)
    if (row === undefined || to === undefined) homeless.push(file)
    else
      moves.push({
        from: file,
        to: `${SRC}/${to}/${inside === row ? posix.basename(inside) : inside.slice(row.length + 1)}`,
      })
  }
  if (homeless.length > 0)
    throw new Error(`no row of the table owns these files:\n${homeless.join('\n')}`)
  return moves.sort((a, b) => a.from.localeCompare(b.from))
}

function ownerOf(file: string): string | undefined {
  const [top, agent] = file.slice(SRC.length + 1).split('/')
  if (top === 'harness') return 'harness'
  return top === 'agents' ? agent : undefined
}

function isHelper(file: string): boolean {
  return isTest(file) || /\/test-[^/]+$/.test(file)
}

export function againstDirection(graph: Graph, newOf: (file: string) => string): string[] {
  const found: string[] = []
  for (const [file, refs] of graph.refs) {
    const at = newOf(file)
    const from = ownerOf(at)
    if (from === undefined || isHelper(at)) continue
    for (const ref of refs)
      reached(graph, ref).forEach((target, index) => {
        const to = ownerOf(newOf(target))
        if (to === undefined || to === from || to === 'harness' || READS.get(from) === to) return
        const name = ref.names[index]?.imported ?? '*'
        found.push(`${at} reads ${name} of ${newOf(target)}`)
      })
  }
  return found
}

export function refuseCollisions(moves: readonly Move[]): void {
  const taken = new Map<string, string>()
  for (const move of moves) {
    const other = taken.get(move.to)
    if (other !== undefined) throw new Error(`${other} and ${move.from} both become ${move.to}`)
    taken.set(move.to, move.from)
  }
}

export function folderMoves(): ReadonlyMap<string, string> {
  return new Map(
    [...OWNERS]
      .filter(([row]) => !/\.\w+$/.test(row))
      .map(([row, to]) => [`${OLD}/${row}`, `${SRC}/${to}`]),
  )
}
