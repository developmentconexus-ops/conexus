import { createHash } from 'node:crypto'
import type { DecisionGap } from '@conexus/hub-api'
import { ConnectionId, RelationPairs, SourceRead } from '@conexus/hub-api'
import type { ReadTx } from '../../platform/database.ts'
import {
  currentCode,
  currentConcept,
  currentField,
  currentRelation,
  currentSource,
} from './versions/tables.ts'

/**
 * The Ontology as its newest revision left it: every element's newest version, deprecated ones
 * included, each `jsonb` parsed at the database's edge (C27). The row policy keeps it the company's.
 */
export async function activeIn(tx: ReadTx) {
  const [concepts, fields, codes, relations, sources] = await Promise.all([
    tx.select().from(currentConcept),
    tx.select().from(currentField),
    tx.select().from(currentCode),
    tx.select().from(currentRelation),
    tx.select().from(currentSource),
  ])
  return {
    concepts,
    fields,
    codes,
    relations: relations.map((each) => ({
      ...each,
      pairs: RelationPairs.parse(each.pairs),
      throughPairs: each.throughPairs === null ? null : RelationPairs.parse(each.throughPairs),
    })),
    sources: sources.map((each) => ({
      ...each,
      connectionId: ConnectionId.parse(each.connectionId),
      read: SourceRead.parse(each.read),
    })),
  }
}
export type ActiveSet = Awaited<ReturnType<typeof activeIn>>
export type ConceptRow = ActiveSet['concepts'][number]
export type FieldRow = ActiveSet['fields'][number]
export type CodeRow = ActiveSet['codes'][number]
export type RelationRow = ActiveSet['relations'][number]
export type SourceRow = ActiveSet['sources'][number]

/** Each element's address, the one an item's target names: `pedido`, `pedido.tipo`, `pedido.tipo=101`, `@pedido_vendedor`. */
export const ADDRESS = {
  concepts: (row: Pick<ConceptRow, 'key'>) => row.key,
  fields: (row: Pick<FieldRow, 'concept' | 'key'>) => `${row.concept}.${row.key}`,
  codes: (row: Pick<CodeRow, 'concept' | 'field' | 'value'>) =>
    `${row.concept}.${row.field}=${row.value}`,
  relations: (row: Pick<RelationRow, 'key'>) => `@${row.key}`,
  sources: (row: Pick<SourceRow, 'concept'>) => row.concept,
} as const

/** One list replaced by key: the newer row of a key wins, in order of address. */
function merged<T>(older: readonly T[], newer: readonly T[], address: (row: T) => string): T[] {
  const byAddress = new Map(older.map((row) => [address(row), row]))
  for (const row of newer) byAddress.set(address(row), row)
  return [...byAddress.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([, row]) => row)
}

/** The set as it would be once the versions are written: each version replaces its key's row. */
export function applied(active: ActiveSet, versions: ActiveSet): ActiveSet {
  return {
    concepts: merged(active.concepts, versions.concepts, ADDRESS.concepts),
    fields: merged(active.fields, versions.fields, ADDRESS.fields),
    codes: merged(active.codes, versions.codes, ADDRESS.codes),
    relations: merged(active.relations, versions.relations, ADDRESS.relations),
    sources: merged(active.sources, versions.sources, ADDRESS.sources),
  }
}

function live(row: { state: string }): boolean {
  return row.state !== 'DEPRECATED'
}

/** The live element at an address, of any kind. */
function liveAt(set: ActiveSet, address: string): boolean {
  return (
    set.concepts.some((row) => live(row) && ADDRESS.concepts(row) === address) ||
    set.fields.some((row) => live(row) && ADDRESS.fields(row) === address) ||
    set.codes.some((row) => live(row) && ADDRESS.codes(row) === address) ||
    set.relations.some((row) => live(row) && ADDRESS.relations(row) === address)
  )
}

type Gap = Omit<DecisionGap, 'n'>

function conceptGaps(set: ActiveSet, known: ReadonlySet<string>, liveFields: ReadonlySet<string>) {
  const gaps: Gap[] = []
  const sourced = new Set(set.sources.map(ADDRESS.sources))
  const liveConcepts = new Set(set.concepts.filter(live).map(ADDRESS.concepts))
  for (const row of set.concepts) {
    const target = row.key
    if (!live(row)) {
      for (const role of set.concepts)
        if (live(role) && role.base === target)
          gaps.push({ target, needs: 'ACTIVE_ROLE', address: role.key })
      continue
    }
    if (!sourced.has(target)) gaps.push({ target, needs: 'SOURCE', address: target })
    for (const field of new Set([row.titleField, ...row.keyFields]))
      if (!liveFields.has(`${target}.${field}`))
        gaps.push({ target, needs: 'FIELD', address: `${target}.${field}` })
    if (row.base !== null && !liveConcepts.has(row.base))
      gaps.push({ target, needs: 'BASE', address: row.base })
  }
  for (const row of set.fields)
    if (!known.has(row.concept))
      gaps.push({ target: ADDRESS.fields(row), needs: 'CONCEPT', address: row.concept })
  return gaps
}

function relationGaps(set: ActiveSet, known: ReadonlySet<string>, fields: ReadonlySet<string>) {
  const gaps: Gap[] = []
  for (const row of set.relations) {
    if (!live(row)) continue
    const target = ADDRESS.relations(row)
    const join = row.through ?? row.toConcept
    for (const concept of new Set([row.fromConcept, row.toConcept, ...(row.through ? [join] : [])]))
      if (!known.has(concept)) gaps.push({ target, needs: 'CONCEPT', address: concept })
    const ends = [
      ...row.pairs.flatMap(([own, theirs]) => [`${row.fromConcept}.${own}`, `${join}.${theirs}`]),
      ...(row.throughPairs ?? []).flatMap(([own, theirs]) => [
        `${join}.${own}`,
        `${row.toConcept}.${theirs}`,
      ]),
    ]
    for (const address of new Set(ends))
      if (!fields.has(address)) gaps.push({ target, needs: 'FIELD', address })
  }
  return gaps
}

/**
 * What the set would leave missing (A Ontologia da empresa, U4): a live concept with no source or
 * no live title or key field, or whose base is not live; a deprecated base a live role still leans
 * on; a field whose concept, or a code whose field, does not exist; a live relation whose concepts
 * or pair fields do not exist; a deprecation whose replacement is not live.
 */
export function incomplete(
  set: ActiveSet,
  replacements: readonly Readonly<{ target: string; replacedBy: string }>[] = [],
): Gap[] {
  const known = new Set(set.concepts.map(ADDRESS.concepts))
  const fields = new Set(set.fields.map(ADDRESS.fields))
  const liveFields = new Set(set.fields.filter(live).map(ADDRESS.fields))
  const gaps = [
    ...conceptGaps(set, known, liveFields),
    ...set.codes.flatMap((row) => {
      const field = `${row.concept}.${row.field}`
      return fields.has(field)
        ? []
        : [{ target: ADDRESS.codes(row), needs: 'FIELD', address: field } as const]
    }),
    ...relationGaps(set, known, fields),
  ]
  for (const { target, replacedBy } of replacements)
    if (!liveAt(set, replacedBy)) gaps.push({ target, needs: 'REPLACEMENT', address: replacedBy })
  return gaps
}

/** Plain JSON with every object's keys in one fixed order, so one set always writes the same text. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value instanceof Date) return value.toISOString()
  if (typeof value !== 'object' || value === null) return value
  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([key, each]) => [key, canonical(each)]),
  )
}

function withoutRevision<T extends { companyId: unknown; revision: number }>(rows: readonly T[]) {
  return rows.map(({ companyId: _, revision: __, ...rest }) => rest)
}

/**
 * The set's sha-256: its JSON without `company_id` and `revision`, each list in order of address
 * and each object's keys in a fixed order, so two companies with the same Ontology have one hash.
 */
export function hashOf(set: ActiveSet): string {
  const ordered = applied({ concepts: [], fields: [], codes: [], relations: [], sources: [] }, set)
  const plain = {
    concepts: withoutRevision(ordered.concepts),
    fields: withoutRevision(ordered.fields),
    codes: withoutRevision(ordered.codes),
    relations: withoutRevision(ordered.relations),
    sources: withoutRevision(ordered.sources),
  }
  return createHash('sha256')
    .update(JSON.stringify(canonical(plain)))
    .digest('hex')
}
