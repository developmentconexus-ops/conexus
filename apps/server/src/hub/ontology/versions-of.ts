import type { CompanyId, ConnectionId, ProofRunId, ProposedItem } from '@conexus/hub-api'
import { Failure } from '../../platform/failure.ts'
import type { ActiveSet } from './active.ts'
import { ADDRESS } from './active.ts'

/** An approved item, with the proof its source was proved by. */
export type Approved = Readonly<{
  n: number
  item: ProposedItem
  proof: Readonly<{ id: ProofRunId; connectionId: ConnectionId }> | null
}>

type At = Readonly<{ companyId: CompanyId; revision: number }>
type Change =
  | Extract<ProposedItem, { kind: 'RENAME_LABEL' }>
  | Extract<ProposedItem, { kind: 'DEPRECATE' }>

/** The active set by address, and the addresses this decision wrote, each list apart. */
class Working {
  readonly concepts = new Map<string, ActiveSet['concepts'][number]>()
  readonly fields = new Map<string, ActiveSet['fields'][number]>()
  readonly codes = new Map<string, ActiveSet['codes'][number]>()
  readonly relations = new Map<string, ActiveSet['relations'][number]>()
  readonly sources = new Map<string, ActiveSet['sources'][number]>()
  readonly #changed = new Map<Map<string, unknown>, Set<string>>()

  constructor(set: ActiveSet) {
    for (const row of set.concepts) this.concepts.set(ADDRESS.concepts(row), row)
    for (const row of set.fields) this.fields.set(ADDRESS.fields(row), row)
    for (const row of set.codes) this.codes.set(ADDRESS.codes(row), row)
    for (const row of set.relations) this.relations.set(ADDRESS.relations(row), row)
    for (const row of set.sources) this.sources.set(ADDRESS.sources(row), row)
  }

  keep<T>(map: Map<string, T>, address: string, row: T): void {
    map.set(address, row)
    const written = this.#changed.get(map) ?? new Set<string>()
    this.#changed.set(map, written.add(address))
  }

  /** The rows of one list this decision wrote. */
  written<T>(map: Map<string, T>): T[] {
    const written = this.#changed.get(map) ?? new Set<string>()
    return [...map.entries()].filter(([at]) => written.has(at)).map(([, row]) => row)
  }
}

/** A rename or a deprecation, on the element as the working set holds it; one that left is TARGET_UNKNOWN. */
function changed(work: Working, item: Change, revision: number): void {
  const address = item.target
  const rename = item.kind === 'RENAME_LABEL'
  const state = 'DEPRECATED' as const
  const concept = work.concepts.get(address)
  if (concept !== undefined) {
    work.keep(work.concepts, address, {
      ...{ ...concept, revision },
      ...(rename
        ? { name: item.name, description: item.description ?? concept.description }
        : { state, replacedBy: item.replacedBy ?? null }),
    })
    return
  }
  const field = work.fields.get(address)
  if (field !== undefined) {
    work.keep(work.fields, address, {
      ...{ ...field, revision },
      ...(rename
        ? { name: item.name, description: item.description ?? field.description }
        : { state }),
    })
    return
  }
  const code = work.codes.get(address)
  if (code !== undefined) {
    work.keep(work.codes, address, {
      ...{ ...code, revision },
      ...(rename
        ? { label: item.name, description: item.description ?? code.description }
        : { state }),
    })
    return
  }
  const relation = work.relations.get(address)
  if (relation !== undefined) {
    // A relation has no name of its own: its label is what the origin side is called.
    work.keep(work.relations, address, {
      ...{ ...relation, revision },
      ...(rename ? { fromName: item.name } : { state }),
    })
    return
  }
  throw new Failure('TARGET_UNKNOWN', { details: { target: address } })
}

function addedConcept(work: Working, at: At, item: Extract<ProposedItem, { kind: 'ADD_CONCEPT' }>) {
  const { base, ...concept } = item.concept
  work.keep(work.concepts, concept.key, {
    ...{ ...at, ...concept },
    ...{ base: base ?? null, replacedBy: null },
  })
}

function addedField(work: Working, at: At, item: Extract<ProposedItem, { kind: 'ADD_FIELD' }>) {
  const { column, currency, unit, ...field } = item.field
  work.keep(work.fields, `${item.concept}.${field.key}`, {
    ...{ ...at, concept: item.concept, ...field, columnName: column },
    ...{ currency: currency ?? null, unit: unit ?? null, state: 'ACTIVE' },
  })
}

function addedRelation(
  work: Working,
  at: At,
  item: Extract<ProposedItem, { kind: 'ADD_RELATION' }>,
) {
  const { from, to, through, throughPairs, ...relation } = item.relation
  work.keep(work.relations, `@${relation.key}`, {
    ...{ ...at, ...relation, fromConcept: from, toConcept: to },
    ...{ through: through ?? null, throughPairs: throughPairs ?? null, state: 'ACTIVE' },
  })
}

function applyItem(work: Working, at: At, { item, proof }: Approved): void {
  switch (item.kind) {
    case 'ADD_CONCEPT':
      addedConcept(work, at, item)
      return
    case 'ADD_FIELD':
      addedField(work, at, item)
      return
    case 'SET_CODE':
      work.keep(work.codes, `${item.concept}.${item.field}=${item.value}`, {
        ...{ ...at, concept: item.concept, field: item.field, value: item.value },
        ...{ label: item.label, description: item.description ?? null, state: 'ACTIVE' },
        // The server kept `dictionary` only when the inventory holds it (U3).
        origin: item.dictionary === undefined ? 'PERSON' : 'DICTIONARY',
      })
      return
    case 'ADD_RELATION':
      addedRelation(work, at, item)
      return
    case 'SET_SOURCE':
      // A kept source always ran its proof (U3): one without is the program's.
      if (proof === null) throw new Failure('INTERNAL_UNEXPECTED')
      work.keep(work.sources, item.concept, {
        ...{ ...at, concept: item.concept, connectionId: proof.connectionId },
        ...{ read: { kind: 'DOOR', sql: item.sql }, proofRunId: proof.id },
      })
      return
    case 'RENAME_LABEL':
    case 'DEPRECATE':
      changed(work, item, at.revision)
      return
    default:
      item satisfies never
  }
}

/**
 * The versions the approved items write at the next revision (A Ontologia da empresa, U4), in the
 * proposal's order on a working copy of the active set, so two items on one element write one
 * version. A rename or a deprecation starts from the element as it is now.
 */
export function versionsOf(active: ActiveSet, approved: readonly Approved[], at: At): ActiveSet {
  const work = new Working(active)
  for (const each of approved) applyItem(work, at, each)
  return {
    concepts: work.written(work.concepts),
    fields: work.written(work.fields),
    codes: work.written(work.codes),
    relations: work.written(work.relations),
    sources: work.written(work.sources),
  }
}
