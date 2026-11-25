import { readFileSync } from 'node:fs'
import type { Named, Ref } from './codemod-imports.ts'
import { isCode, isDoor, isTest, namesOfDoor, parse, refsOf } from './codemod-imports.ts'
import type { Area } from './codemod-server-areas.ts'
import { destinationOf, isOld, READS, SRC } from './codemod-server-areas.ts'

export type Move = { from: string; to: string }

/**
 * What the area does to the door of an old subject: `kept` (no file of it moves), `carried` (the whole
 * folder moves to one subject that nothing else joins, so its door moves with it), `trimmed` (some files
 * move, so the door drops their names) or `dissolved` (every file moves to different subjects, so the
 * door goes and each new subject gets one made of the names its outside importers use).
 */
type DoorKind = 'kept' | 'carried' | 'trimmed' | 'dissolved'

export type Graph = {
  texts: Map<string, string>
  refs: Map<string, Ref[]>
  /** The names of each door the area dissolves or trims: every one a plain re-export. */
  doors: Map<string, Map<string, Named>>
  /** The names every door re-exports, a door that holds code of its own included, for the direction check. */
  reexports: Map<string, Map<string, Named>>
}

export type Plan = {
  moves: Move[]
  /** The doors the area removes: each new subject's own is made from the names its importers use. */
  removed: string[]
  newOf: (file: string) => string
  kinds: Map<string, DoorKind>
  synthesized: Set<string>
}

const TREES = /^(hub|builder|harness|agents)\/([^/]+)\//

export function subjectOf(file: string): string | undefined {
  if (!file.startsWith(`${SRC}/`)) return undefined
  const found = TREES.exec(file.slice(SRC.length + 1))
  return found === null ? undefined : `${SRC}/${found[1]}/${found[2]}`
}

export function isHelper(file: string): boolean {
  return /\/test-[^/]+\.tsx?$/.test(file)
}

export function filesOf(files: readonly string[]): string[] {
  return files.filter(
    (file) => file.startsWith(`${SRC}/`) || /^(packages|scripts|tests)\//.test(file),
  )
}

export function graphOf(files: readonly string[], dissolving: (door: string) => boolean): Graph {
  const graph: Graph = { texts: new Map(), refs: new Map(), doors: new Map(), reexports: new Map() }
  for (const file of files.filter(isCode)) {
    const text = readFileSync(file, 'utf8')
    const refs = refsOf(file, parse(file, text))
    graph.texts.set(file, text)
    graph.refs.set(file, refs)
    if (!isDoor(file) || subjectOf(file) === undefined) continue
    graph.reexports.set(file, reexportsOf(refs))
    if (dissolving(file)) graph.doors.set(file, namesOfDoor(file, text))
  }
  return graph
}

function reexportsOf(refs: readonly Ref[]): Map<string, Named> {
  const names = new Map<string, Named>()
  for (const ref of refs.filter((one) => one.kind === 'export'))
    for (const one of ref.names)
      names.set(one.local, { name: one.local, file: ref.target, typeOnly: one.typeOnly })
  return names
}

export function planOf(area: Area, files: readonly string[]): Plan {
  const moves: Move[] = []
  const homeless: string[] = []
  const later: string[] = []
  for (const file of files.filter(isOld)) {
    const destination = destinationOf(file)
    if (destination === undefined) homeless.push(file)
    else if (destination.area === area) moves.push({ from: file, to: destination.to })
    else later.push(file)
  }
  if (homeless.length > 0)
    throw new Error(`no row of the table owns these files:\n${homeless.join('\n')}`)
  const to = new Map(moves.map((move) => [move.from, move.to]))
  const doors = doorsOf(files.filter(isOld), to, later)
  const removed = [...doors.kinds].filter(([, kind]) => kind === 'dissolved').map(([door]) => door)
  return {
    ...doors,
    removed,
    moves: moves
      .filter((move) => !removed.includes(move.from))
      .sort((a, b) => a.from.localeCompare(b.from)),
    newOf: (file) => to.get(file) ?? file,
  }
}

type Flow = {
  /** The old subjects each new subject takes files from. */
  sources: Map<string, Set<string>>
  /** The new subjects each old subject sends files to. */
  targets: Map<string, Set<string>>
  /** The old subjects that keep a file in place. */
  staying: Set<string>
}

function flowOf(old: readonly string[], to: ReadonlyMap<string, string>, stays: readonly string[]) {
  const stayed = new Set(stays)
  const flow: Flow = { sources: new Map(), targets: new Map(), staying: new Set() }
  for (const file of old.filter((one) => !isDoor(one) || subjectOf(one) === undefined)) {
    const from = subjectOf(file)
    const into = to.get(file)
    if (from === undefined) continue
    if (stayed.has(file) || into === undefined) {
      flow.staying.add(from)
      continue
    }
    const dest = subjectOf(into)
    if (dest === undefined) continue
    flow.sources.set(dest, (flow.sources.get(dest) ?? new Set()).add(from))
    flow.targets.set(from, (flow.targets.get(from) ?? new Set()).add(dest))
  }
  return flow
}

function kindOf(from: string, flow: Flow): DoorKind {
  const dests = flow.targets.get(from)
  if (dests === undefined) return 'kept'
  const [only] = dests
  const alone = dests.size === 1 && only !== undefined && flow.sources.get(only)?.size === 1
  if (alone && !flow.staying.has(from)) return 'carried'
  return flow.staying.has(from) ? 'trimmed' : 'dissolved'
}

function doorsOf(
  old: readonly string[],
  to: ReadonlyMap<string, string>,
  stays: readonly string[],
): Pick<Plan, 'kinds' | 'synthesized'> {
  const flow = flowOf(old, to, stays)
  const doors = old.filter((one) => isDoor(one) && subjectOf(one) !== undefined)
  const kinds = new Map<string, DoorKind>()
  const synthesized = new Set<string>()
  for (const door of doors) {
    const from = subjectOf(door)
    if (from === undefined) continue
    const kind = kindOf(from, flow)
    kinds.set(door, kind)
    if (kind === 'trimmed' || kind === 'dissolved')
      for (const dest of flow.targets.get(from) ?? []) synthesized.add(dest)
  }
  joined(flow, doors, kinds, synthesized)
  return { kinds, synthesized }
}

/** A new subject that takes files from several old ones is made, and the doors that were carried to it dissolve. */
function joined(
  flow: Flow,
  doors: readonly string[],
  kinds: Map<string, DoorKind>,
  synthesized: Set<string>,
): void {
  for (const [dest, from] of flow.sources) {
    if (from.size < 2) continue
    synthesized.add(dest)
    for (const door of doors.filter((one) => from.has(subjectOf(one) ?? '')))
      if (kinds.get(door) === 'carried') kinds.set(door, 'dissolved')
  }
}

/** The file each name of a ref reaches: through the old door when it is dissolved or trimmed, else the ref's own target. */
export function reached(graph: Graph, ref: Ref): string[] {
  const door = graph.doors.get(ref.target)
  if (door === undefined) return ref.names.map(() => ref.target)
  return ref.names.map((name) => {
    const named = door.get(name.imported)
    if (named === undefined) throw new Error(`${ref.target} does not export ${name.imported}`)
    return named.file
  })
}

/** The file each name of a ref comes from, through every door, one that holds code of its own as well. */
function seen(graph: Graph, ref: Ref): string[] {
  const door = graph.reexports.get(ref.target)
  return ref.names.map((name) => door?.get(name.imported)?.file ?? ref.target)
}

/** The agent a file of the final tree belongs to, `harness` for the common, none for the rest. */
function ownerOf(file: string): string | undefined {
  const found = /^apps\/server\/src\/(harness|agents)\/([^/]+)\//.exec(file)
  if (found === null) return undefined
  return found[1] === 'harness' ? 'harness' : found[2]
}

function finalOf(file: string): string {
  const destination = isOld(file) ? destinationOf(file) : undefined
  return destination?.to ?? file
}

function exempt(file: string): boolean {
  return isTest(file) || isHelper(file)
}

function goesAgainst(from: string, to: string | undefined): boolean {
  if (to === undefined || to === from || READS.get(from) === to) return false
  return from === 'harness' || to !== 'harness'
}

/**
 * The imports of the final tree that go against the direction of the card (U7): the harness never reads an
 * agent, and an agent reads another only by the one declared direction. A test or a test helper reads what it
 * drives, so it is not held to it. Only a ref that touches a file this area moves is judged.
 */
export function againstDirection(graph: Graph, plan: Plan): string[] {
  const found: string[] = []
  const moving = new Set(plan.moves.map((move) => move.from))
  for (const [file, refs] of graph.refs) {
    const at = finalOf(file)
    const from = ownerOf(at)
    if (from === undefined || exempt(at)) continue
    for (const ref of refs)
      seen(graph, ref).forEach((target, index) => {
        const into = finalOf(target)
        const touched = moving.has(file) || moving.has(target)
        if (touched && goesAgainst(from, ownerOf(into)))
          found.push(`${at} reads ${ref.names[index]?.imported ?? '*'} of ${into}`)
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
