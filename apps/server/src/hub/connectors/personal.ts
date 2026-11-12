import type { PersonalField, PersonalKind } from '@conexus/connectors'
import { PERSONAL_KINDS, personalRowsOf } from '@conexus/connectors'

type Path = readonly string[]

function isBelow(path: Path, parent: Path) {
  return path.length > parent.length && parent.every((key, at) => path[at] === key)
}

/** Whether the value holds the path; an array on the way holds it when one of its items does. */
function holds(value: unknown, [key, ...rest]: Path): boolean {
  if (key === undefined) return true
  if (Array.isArray(value)) return value.some((item) => holds(item, [key, ...rest]))
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.hasOwn(value, key) &&
    holds(Reflect.get(value, key), rest)
  )
}

/** The value cut down to the paths given, relative to it, or `undefined` when it holds none of them. */
function onlyKept(value: unknown, keep: readonly Path[]): unknown {
  if (Array.isArray(value)) return value.map((item) => onlyKept(item, keep) ?? {})
  if (typeof value !== 'object' || value === null) return undefined
  const entries = Object.entries(value).flatMap(([name, item]) => {
    const below = keep.filter(([first]) => first === name).map(([, ...rest]) => rest)
    if (below.length === 0) return []
    const kept = below.some((rest) => rest.length === 0) ? item : onlyKept(item, below)
    return kept === undefined ? [] : [[name, kept]]
  })
  return entries.length === 0 ? undefined : Object.fromEntries(entries)
}

/**
 * The value without the path, never changed in place, but for the paths below it that `keep` names
 * (relative to the value); an array on the way loses it in each item.
 */
function without(value: unknown, [key, ...rest]: Path, keep: readonly Path[]): unknown {
  if (key === undefined) return value
  if (Array.isArray(value)) return value.map((item) => without(item, [key, ...rest], keep))
  if (typeof value !== 'object' || value === null || !Object.hasOwn(value, key)) return value
  const kept = Object.entries(value).flatMap(([name, item]): [string, unknown][] => {
    if (name !== key) return [[name, item]]
    if (rest.length > 0) return [[name, without(item, rest, keep)]]
    const inside = onlyKept(item, keep)
    return inside === undefined ? [] : [[name, inside]]
  })
  return Object.fromEntries(kept)
}

/**
 * The answer with each declared path whose kind is not allowed taken out (the twenty takes, never
 * masks). The most specific path wins in both directions: `buyer` allowed and `buyer.billing_info`
 * not gives `buyer` without `billing_info`; `buyer` not allowed and `buyer.receiver_name` allowed
 * gives `buyer` with `receiver_name` alone.
 */
export function shapePersonal(
  value: unknown,
  personal: readonly PersonalField[],
  allowed: ReadonlySet<PersonalKind>,
): Readonly<{ value: unknown; given: PersonalKind[]; withheld: PersonalKind[] }> {
  const fields = personal.map((field) => ({ kind: field.kind, path: field.path.split('.') }))
  const deepestFirst = fields.toSorted((a, b) => b.path.length - a.path.length)
  const { rows: read, rebuilt } = personalRowsOf(value)
  let rows = read
  const withheld = new Set<PersonalKind>()
  for (const { kind, path } of deepestFirst) {
    if (allowed.has(kind)) continue
    if (rows.some((row) => holds(row, path))) withheld.add(kind)
    const keep = fields
      .filter((field) => allowed.has(field.kind) && isBelow(field.path, path))
      .map((field) => field.path.slice(path.length))
    rows = rows.map((row) => without(row, path, keep))
  }
  const given = new Set(
    fields
      .filter(({ kind, path }) => allowed.has(kind) && rows.some((row) => holds(row, path)))
      .map(({ kind }) => kind),
  )
  return {
    value: rebuilt(rows),
    given: PERSONAL_KINDS.filter((kind) => given.has(kind)),
    withheld: PERSONAL_KINDS.filter((kind) => withheld.has(kind)),
  }
}
