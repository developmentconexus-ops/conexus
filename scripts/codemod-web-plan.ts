import { readFileSync } from 'node:fs'
import { posix } from 'node:path'
import type { Named, Ref } from './codemod-web-imports.ts'
import { isCode, isDoor, isTest, namesOfDoor, parse, refsOf } from './codemod-web-imports.ts'

export const SRC = 'apps/web/src'
export const OLD = `${SRC}/builder`
const ROOM = `${SRC}/harness/room`

type Agent = 'app-builder' | 'assistant' | 'agent-builder' | 'saved-agent'
type Label = Agent | 'shared'

export type Move = { from: string; to: string; by: string }

type Home = { to: string; by: string }

const WHOLE = new Map<string, { to: string; label: Label }>([
  ['assistant', { to: 'agents/assistant', label: 'assistant' }],
  ['automations', { to: 'agents/assistant/automations', label: 'assistant' }],
  ['tools', { to: 'agents/saved-agent/tools', label: 'saved-agent' }],
  ['model-accounts', { to: 'harness/model-accounts', label: 'shared' }],
  ['observational-memory', { to: 'harness/memory', label: 'shared' }],
])

const DIVIDED = new Map<string, { room: string; homes: Map<Agent, string>; both?: Agent }>([
  ['conversation', { room: ROOM, homes: new Map([['app-builder', `${SRC}/agents/app-builder`]]) }],
  [
    'agents',
    {
      room: ROOM,
      homes: new Map([
        ['agent-builder', `${SRC}/agents/agent-builder`],
        ['saved-agent', `${SRC}/agents/saved-agent`],
      ]),
      both: 'saved-agent',
    },
  ],
  [
    'preview',
    {
      room: `${ROOM}/preview`,
      homes: new Map([['app-builder', `${SRC}/agents/app-builder/preview`]]),
    },
  ],
  [
    'source',
    {
      room: `${ROOM}/source`,
      homes: new Map([['app-builder', `${SRC}/agents/app-builder/source`]]),
    },
  ],
])

const ROUTES: readonly (readonly [RegExp, Label])[] = [
  [/\.agents\.construtor\./, 'agent-builder'],
  [/agents\.(index|\$agentId|tools)|settings\/data-reads/, 'saved-agent'],
  [
    /automations|assistant|conversations\/\$conversationId\.tsx$|settings\/(account|company-memory)|\$companyId\/(index|route)\.tsx$/,
    'assistant',
  ],
  [/\$projectId\.(tsx|index|conversations)|welcome\/build/, 'app-builder'],
]

export type Graph = {
  texts: Map<string, string>
  refs: Map<string, Ref[]>
  doors: Map<string, Map<string, Named>>
}

function folderOf(file: string): string | undefined {
  return file.startsWith(`${OLD}/`) ? file.slice(OLD.length + 1).split('/')[0] : undefined
}

export function graphOf(files: readonly string[]): Graph {
  const graph: Graph = { texts: new Map(), refs: new Map(), doors: new Map() }
  for (const file of files.filter(isCode)) {
    const text = readFileSync(file, 'utf8')
    graph.texts.set(file, text)
    if (isDoor(file) && folderOf(file) !== undefined) graph.doors.set(file, namesOfDoor(file, text))
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

function labelOf(file: string): Label | undefined {
  const folder = folderOf(file)
  if (folder !== undefined) return WHOLE.get(folder)?.label
  if (!file.startsWith(`${SRC}/`)) return undefined
  if (!file.startsWith(`${SRC}/routes/`)) return 'shared'
  return ROUTES.find(([pattern]) => pattern.test(file))?.[1] ?? 'shared'
}

function labelsOf(reach: ReadonlyMap<string, Set<Label>>, file: string): Label[] {
  const own = reach.get(file)
  if (own !== undefined) return [...own]
  const labelled = labelOf(file)
  return labelled === undefined ? [] : [labelled]
}

function spread(
  reach: ReadonlyMap<string, Set<Label>>,
  labels: readonly Label[],
  targets: readonly string[],
): boolean {
  let grew = false
  for (const into of targets.map((target) => reach.get(target))) {
    for (const label of labels) {
      if (into === undefined || into.has(label)) continue
      into.add(label)
      grew = true
    }
  }
  return grew
}

function reachOf(graph: Graph, files: readonly string[]): Map<string, Set<Label>> {
  const reach = new Map<string, Set<Label>>(files.map((file) => [file, new Set()]))
  const sources = [...graph.refs].filter(([file]) => !isTest(file))
  for (let changed = true; changed; ) {
    changed = false
    for (const [file, refs] of sources) {
      const targets = refs.flatMap((ref) => reached(graph, ref))
      changed = spread(reach, labelsOf(reach, file), targets) || changed
    }
  }
  return reach
}

function homeOf(file: string, reach: ReadonlySet<Label>): Home {
  const divided = DIVIDED.get(folderOf(file) ?? '')
  const by = `reached by ${[...reach].sort().join(', ')}`
  if (divided === undefined) throw new Error(`${file} is in no divided folder`)
  const homes = [...reach].map((label) =>
    label === 'shared' ? undefined : divided.homes.get(label),
  )
  const [only] = homes
  if (homes.some((home) => home === undefined)) return { to: divided.room, by }
  if (reach.size === 1 && only !== undefined) return { to: only, by }
  const both = divided.both === undefined ? undefined : divided.homes.get(divided.both)
  return { to: both ?? divided.room, by }
}

function stem(file: string): string {
  return posix
    .basename(file)
    .replace(/\.test\.tsx?$/, '')
    .replace(/\.tsx?$/, '')
}

function siblingOf(test: string, files: readonly string[]): string | undefined {
  const own = stem(test)
  return files
    .filter((file) => posix.dirname(file) === posix.dirname(test) && !isTest(file))
    .filter((file) => own === stem(file) || own.startsWith(`${stem(file)}-`))
    .sort((a, b) => stem(b).length - stem(a).length)[0]
}

function usersOf(graph: Graph): Map<string, string[]> {
  const users = new Map<string, string[]>()
  for (const [file, refs] of graph.refs)
    for (const target of refs.flatMap((ref) => reached(graph, ref)))
      users.set(target, [...(users.get(target) ?? []), file])
  return users
}

function neighboursOf(graph: Graph, users: ReadonlyMap<string, string[]>, file: string): string[] {
  if (isTest(file)) return (graph.refs.get(file) ?? []).flatMap((ref) => reached(graph, ref))
  return (users.get(file) ?? []).filter((user) => folderOf(user) === folderOf(file))
}

function placeNextTo(near: readonly string[], file: string, home: Map<string, Home>): boolean {
  const dests = new Set(near.filter((one) => home.has(one)).map((one) => home.get(one)?.to))
  const divided = DIVIDED.get(folderOf(file) ?? '')
  if (isTest(file)) dests.delete(divided?.room)
  const [only] = [...dests]
  if (dests.size === 0 || divided === undefined) return false
  const both = divided.both === undefined ? undefined : divided.homes.get(divided.both)
  const to = dests.size === 1 && only !== undefined ? only : (both ?? divided.room)
  const by = isTest(file) ? 'the test of what it imports' : 'used only by that agent'
  home.set(file, { to, by })
  return true
}

function placeByNeighbours(graph: Graph, files: readonly string[], home: Map<string, Home>): void {
  const users = usersOf(graph)
  for (let changed = true; changed; ) {
    changed = false
    for (const file of files.filter((one) => !home.has(one)))
      changed = placeNextTo(neighboursOf(graph, users, file), file, home) || changed
  }
}

function dividedHomes(graph: Graph, files: readonly string[]): Map<string, Home> {
  const reach = reachOf(graph, files)
  const home = new Map<string, Home>()
  for (const file of files) {
    const labels = reach.get(file)
    if (!isTest(file) && labels !== undefined && labels.size > 0)
      home.set(file, homeOf(file, labels))
  }
  for (const test of files.filter(isTest)) {
    const sibling = siblingOf(test, files)
    const near = sibling === undefined ? undefined : home.get(sibling)
    if (near !== undefined)
      home.set(test, { to: near.to, by: `the test of ${posix.basename(sibling ?? '')}` })
  }
  placeByNeighbours(graph, files, home)
  for (const file of files) {
    const room = DIVIDED.get(folderOf(file) ?? '')?.room ?? ROOM
    if (!home.has(file)) home.set(file, { to: room, by: 'no one agent alone uses it' })
  }
  return home
}

function relativeIn(folder: string, file: string): string {
  return file.slice(OLD.length + folder.length + 2)
}

export function plan(files: readonly string[], graph: Graph): Move[] {
  const moves: Move[] = []
  const divided: string[] = []
  for (const file of files.filter((one) => one.startsWith(`${OLD}/`) && !isDoor(one))) {
    const folder = folderOf(file) ?? ''
    const whole = WHOLE.get(folder)
    if (whole !== undefined)
      moves.push({
        from: file,
        to: `${SRC}/${whole.to}/${relativeIn(folder, file)}`,
        by: `the folder ${folder}/ moves whole`,
      })
    else if (DIVIDED.has(folder)) divided.push(file)
    else throw new Error(`${file}: a folder the table does not name`)
  }
  const homes = dividedHomes(graph, divided.filter(isCode))
  for (const file of divided) {
    const folder = folderOf(file) ?? ''
    const home = homes.get(file) ?? {
      to: DIVIDED.get(folder)?.room ?? ROOM,
      by: 'not code: with the room',
    }
    moves.push({ from: file, to: `${home.to}/${relativeIn(folder, file)}`, by: home.by })
  }
  return moves.sort((a, b) => a.from.localeCompare(b.from))
}

export function refuseCollisions(moves: readonly Move[]): void {
  const taken = new Map<string, string>()
  for (const move of moves) {
    const other = taken.get(move.to)
    if (other !== undefined) throw new Error(`${other} and ${move.from} both become ${move.to}`)
    taken.set(move.to, move.from)
  }
}

export function wholeMoves(): ReadonlyMap<string, string> {
  return new Map([...WHOLE].map(([folder, { to }]) => [`${OLD}/${folder}`, `${SRC}/${to}`]))
}
