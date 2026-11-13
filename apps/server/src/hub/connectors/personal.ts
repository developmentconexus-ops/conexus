import type { PersonalField, PersonalKind } from '@conexus/connectors'
import { PERSONAL_KINDS, personalRowsOf } from '@conexus/connectors'

type Path = readonly string[]

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

/** The value without the path, never changed in place; an array on the way loses it in each item. */
function without(value: unknown, [key, ...rest]: Path): unknown {
  if (key === undefined) return value
  if (Array.isArray(value)) return value.map((item) => without(item, [key, ...rest]))
  if (typeof value !== 'object' || value === null || !Object.hasOwn(value, key)) return value
  const kept = Object.entries(value).filter(([name]) => rest.length > 0 || name !== key)
  return Object.fromEntries(
    kept.map(([name, item]) => [name, name === key ? without(item, rest) : item]),
  )
}

/**
 * The answer with each declared path whose kind is not allowed taken out (the twenty takes, never
 * masks). The most specific path wins: `buyer` allowed and `buyer.billing_info` not gives `buyer`
 * without `billing_info`, so the paths go from the deepest to the shallowest.
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
    rows = rows.map((row) => without(row, path))
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
