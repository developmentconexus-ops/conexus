import { posix } from 'node:path'
import type { Binding, Named, Ref } from './codemod-imports.ts'
import { isTest, otherSpecifiers, parse, resolved } from './codemod-imports.ts'
import type { Graph } from './codemod-web-plan.ts'
import { reached, SRC } from './codemod-web-plan.ts'

export type Surface = Map<string, Map<string, Named>>

type Edit = { start: number; end: number; text: string }

function relativeTo(from: string, to: string): string {
  const path = posix.relative(posix.dirname(from), to)
  return path.startsWith('.') ? path : `./${path}`
}

function isTree(file: string): boolean {
  return file.startsWith(`${SRC}/agents/`) || file.startsWith(`${SRC}/harness/`)
}

function subjectOf(file: string): string {
  return file.split('/').slice(0, 5).join('/')
}

function sharesHelpers(file: string): boolean {
  return file.startsWith(`${SRC}/agents/`) && (isTest(file) || /\/test-[^/]+$/.test(file))
}

function lineOf(ref: Ref, names: readonly Binding[], specifier: string): string {
  if (names.length === 0) return `import '${specifier}'`
  const allTypes = names.every((name) => name.typeOnly)
  const list = names
    .map((name) => {
      const own = name.imported === name.local ? name.local : `${name.imported} as ${name.local}`
      return allTypes || !name.typeOnly ? own : `type ${own}`
    })
    .join(', ')
  return `${ref.kind} ${allTypes ? 'type ' : ''}{ ${list} } from '${specifier}'`
}

type Context = {
  graph: Graph
  newOf: (file: string) => string
  surface: Surface
}

function register(surface: Surface, into: string, name: Binding): void {
  const subject = surface.get(subjectOf(into)) ?? new Map<string, Named>()
  const before = subject.get(name.imported)
  subject.set(name.imported, {
    name: name.imported,
    file: into,
    typeOnly: (before?.typeOnly ?? true) && name.typeOnly,
  })
  surface.set(subjectOf(into), subject)
}

function sourceOf(context: Context, at: string, ref: Ref, name: Binding, target: string): string {
  const into = context.newOf(target)
  const throughDoor = context.graph.doors.has(ref.target)
  const crossing = isTree(into) && !(isTree(at) && subjectOf(into) === subjectOf(at))
  const direct = !crossing || (!throughDoor && (sharesHelpers(at) || !at.startsWith(`${SRC}/`)))
  if (direct) return into
  register(context.surface, into, name)
  return `${subjectOf(into)}/public.ts`
}

function refEdit(context: Context, file: string, ref: Ref): Edit | undefined {
  const at = context.newOf(file)
  const throughDoor = context.graph.doors.has(ref.target)
  if (at === file && !throughDoor && context.newOf(ref.target) === ref.target) return undefined
  const targets = reached(context.graph, ref)
  const pieces = new Map<string, Binding[]>()
  if (ref.names.length === 0) pieces.set(context.newOf(ref.target), [])
  ref.names.forEach((name, index) => {
    const source = sourceOf(context, at, ref, name, targets[index] ?? ref.target)
    pieces.set(source, [...(pieces.get(source) ?? []), name])
  })
  const lines = [...pieces].map(([source, names]) => lineOf(ref, names, relativeTo(at, source)))
  return { start: ref.node.getStart(), end: ref.node.end, text: lines.join('\n') }
}

export function rewritten(context: Context, file: string): string {
  const text = context.graph.texts.get(file) ?? ''
  const at = context.newOf(file)
  const edits = (context.graph.refs.get(file) ?? []).flatMap(
    (ref) => refEdit(context, file, ref) ?? [],
  )
  for (const literal of otherSpecifiers(parse(file, text))) {
    const target = resolved(file, literal.text)
    if (target === undefined || (at === file && context.newOf(target) === target)) continue
    edits.push({
      start: literal.getStart() + 1,
      end: literal.end - 1,
      text: relativeTo(at, context.newOf(target)),
    })
  }
  return edits
    .sort((a, b) => b.start - a.start)
    .reduce(
      (result, edit) => result.slice(0, edit.start) + edit.text + result.slice(edit.end),
      text,
    )
}

export function doorText(names: ReadonlyMap<string, Named>, door: string): string {
  const byFile = new Map<string, Named[]>()
  for (const named of [...names.values()].sort((a, b) => a.name.localeCompare(b.name)))
    byFile.set(named.file, [...(byFile.get(named.file) ?? []), named])
  const lines = [...byFile]
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([file, group]) => {
      const from = relativeTo(door, file)
      const types = group.filter((named) => named.typeOnly).map((named) => named.name)
      const values = group.filter((named) => !named.typeOnly).map((named) => named.name)
      return [
        ...(types.length > 0 ? [`export type { ${types.join(', ')} } from '${from}'`] : []),
        ...(values.length > 0 ? [`export { ${values.join(', ')} } from '${from}'`] : []),
      ]
    })
  return `${lines.join('\n')}\n`
}
