import { posix } from 'node:path'
import type { Binding, Named, Ref } from './codemod-imports.ts'
import { isTest, otherSpecifiers, parse, resolved } from './codemod-imports.ts'
import type { Graph, Plan } from './codemod-server-plan.ts'
import { isHelper, reached, subjectOf } from './codemod-server-plan.ts'

export type Surface = Map<string, Map<string, Named>>

type Edit = { start: number; end: number; text: string }

type Context = { graph: Graph; plan: Plan; surface: Surface }

/** A subject's door: its public.ts, or the public-<name>.ts that holds its tables. */
function isAnyDoor(file: string): boolean {
  return /(^|\/)public(-[a-z]+)?\.tsx?$/.test(file)
}

export function relativeTo(from: string, to: string): string {
  const path = posix.relative(posix.dirname(from), to)
  return path.startsWith('.') ? path : `./${path}`
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

function register(surface: Surface, into: string, name: Binding): void {
  const subject = subjectOf(into) ?? into
  const names = surface.get(subject) ?? new Map<string, Named>()
  const before = names.get(name.imported)
  if (before !== undefined && before.file !== into)
    throw new Error(
      `${name.imported} is exported by ${before.file} and by ${into}, both of ${subject}`,
    )
  names.set(name.imported, {
    name: name.imported,
    file: into,
    typeOnly: (before?.typeOnly ?? true) && name.typeOnly,
  })
  surface.set(subject, names)
}

/** Where one name of a ref is read from once the area is done. */
function sourceOf(context: Context, at: string, ref: Ref, name: Binding, target: string): string {
  const { plan, graph } = context
  const into = plan.newOf(target)
  const dissolving = graph.doors.has(ref.target)
  if (isAnyDoor(ref.target) && !dissolving) return plan.newOf(ref.target)
  if (plan.kinds.get(ref.target) === 'trimmed' && into === target) return ref.target
  const subject = subjectOf(into)
  const sameSubject = subject !== undefined && subject === subjectOf(at) && !isTest(at)
  if (subject === undefined || sameSubject) return into
  if (!dissolving && (isHelper(at) || isHelper(target) || subjectOf(at) === undefined)) return into
  if (plan.synthesized.has(subject)) {
    register(context.surface, into, name)
    return `${subject}/public.ts`
  }
  throw new Error(`${at} reads ${name.imported} of ${into}, which is not through a door`)
}

function refEdit(context: Context, file: string, ref: Ref): Edit | undefined {
  const at = context.plan.newOf(file)
  const kind = context.plan.kinds.get(ref.target)
  const dissolving = kind === 'dissolved' || kind === 'trimmed'
  const into = context.plan.newOf(ref.target)
  if (at === file && !dissolving && into === ref.target) return undefined
  const targets = reached(context.graph, ref)
  const pieces = new Map<string, Binding[]>()
  if (ref.names.length === 0) pieces.set(into, [])
  ref.names.forEach((name, index) => {
    const source = sourceOf(context, at, ref, name, targets[index] ?? ref.target)
    pieces.set(source, [...(pieces.get(source) ?? []), name])
  })
  const lines = [...pieces].map(([source, names]) => lineOf(ref, names, relativeTo(at, source)))
  return { start: ref.node.getStart(), end: ref.node.end, text: lines.join('\n') }
}

export function rewritten(context: Context, file: string): string {
  const text = context.graph.texts.get(file) ?? ''
  const at = context.plan.newOf(file)
  const edits = (context.graph.refs.get(file) ?? []).flatMap(
    (ref) => refEdit(context, file, ref) ?? [],
  )
  for (const literal of otherSpecifiers(parse(file, text))) {
    const target = resolved(file, literal.text)
    if (target === undefined) continue
    const kind = context.plan.kinds.get(target)
    if (kind === 'dissolved' || kind === 'trimmed')
      throw new Error(
        `${file} imports ${literal.text} by default or as a namespace, past the door the area removes`,
      )
    if (at === file && context.plan.newOf(target) === target) continue
    edits.push({
      start: literal.getStart() + 1,
      end: literal.end - 1,
      text: relativeTo(at, context.plan.newOf(target)),
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
