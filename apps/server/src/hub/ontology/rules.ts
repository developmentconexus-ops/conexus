import type {
  CompanyId,
  ConceptProposed,
  ItemRefusal,
  PersonId,
  ProposedItem,
} from '@conexus/hub-api'
import { and, eq, inArray } from 'drizzle-orm'
import type { Database } from '../../platform/database.ts'
import type { ConceptDoor } from '../connectors/public.ts'
import { shownRunOf } from './inventory-search.ts'
import { targetOf } from './items.ts'
import type { Proved } from './proof.ts'
import { provedNow } from './proof.ts'
import { inventoryEntry } from './tables.ts'
import type { World } from './world.ts'
import { fieldKey, isActive, roleOf } from './world.ts'

type Refused = ConceptProposed['refused'][number]
export type Kept = Readonly<{ item: ProposedItem; target: string; proof?: Proved }>
/** An item kept, or refused; a refusal after the system answered keeps the proof that ran, which is written too. */
export type Outcome = Readonly<{ kept: Kept } | { refused: Refused; proof?: Proved }>

export function refusal(target: string, reason: ItemRefusal, detail?: string | number): Outcome {
  return { refused: detail === undefined ? { target, reason } : { target, reason, detail } }
}

/** A source proved through the door: the count and the shape, and the subset of a role's base. */
async function provedSource(
  door: ConceptDoor,
  world: World,
  item: Extract<ProposedItem, { kind: 'SET_SOURCE' }>,
): Promise<Outcome> {
  const target = targetOf(item)
  const role = roleOf(world, item.concept)
  if (typeof role === 'string') return refusal(target, role)
  const answer = await door.prove(item.sql, role)
  switch (answer.kind) {
    case 'NOT_IN_ROLE':
      return refusal(target, 'NOT_IN_ROLE')
    case 'CALLS_SPENT':
      return refusal(target, 'PROOF_FAILED', 'CALLS_SPENT')
    case 'KEY_NOT_IN_SHAPE':
      return refusal(target, 'FIELD_NOT_IN_PROOF', answer.column)
    case 'FAILED': {
      const proof = provedNow(item.sql, answer)
      return { ...refusal(target, 'PROOF_FAILED', answer.reason), proof }
    }
    case 'OK': {
      const proof = provedNow(item.sql, answer)
      const outside = answer.outsideBase ?? 0
      if (outside > 0) return { ...refusal(target, 'ROLE_NOT_SUBSET', outside), proof }
      world.sources.set(item.concept, { sql: item.sql, shape: [...answer.shape] })
      return { kept: { item, target, proof } }
    }
    default:
      return answer satisfies never
  }
}

/** A code's value seen in its concept's source: a count above zero, by the dialect's own literal. */
async function seenCode(
  door: ConceptDoor,
  world: World,
  item: Extract<ProposedItem, { kind: 'SET_CODE' }>,
): Promise<ItemRefusal | readonly [ItemRefusal, string] | undefined> {
  const field = world.fields.get(fieldKey(item.concept, item.field))
  const source = world.sources.get(item.concept)
  if (field === undefined || field.type !== 'CODE' || source === undefined)
    return 'CONCEPT_INCOMPLETE'
  const counted = await door.query({
    sql: source.sql,
    columns: [{ column: field.column, type: 'CODE' }],
    select: [],
    filters: [{ column: field.column, op: 'equals', value: item.value }],
    measure: { count: true, sum: [], groupBy: [] },
    limit: 1,
    order: [],
  })
  switch (counted.kind) {
    case 'OK':
      return Number(counted.rows[0]?.count ?? 0) > 0 ? undefined : 'CODE_UNSEEN'
    case 'CALL_REFUSED':
      return 'CODE_UNSEEN'
    case 'NOT_IN_ROLE':
      return 'NOT_IN_ROLE'
    case 'CALLS_SPENT':
      return ['PROOF_FAILED', 'CALLS_SPENT']
    case 'FAILED':
      return ['PROOF_FAILED', counted.reason]
    default:
      return counted satisfies never
  }
}

function relationRefusal(world: World, item: Extract<ProposedItem, { kind: 'ADD_RELATION' }>) {
  const { from, to, through, throughPairs, pairs, cardinality } = item.relation
  function has(concept: string, field: string) {
    return world.fields.has(fieldKey(concept, field))
  }
  const join = through ?? to
  const valid =
    world.concepts.has(from) &&
    world.concepts.has(to) &&
    (through === undefined) === (throughPairs === undefined) &&
    (through === undefined || world.concepts.has(through)) &&
    (cardinality === 'MANY_TO_MANY') === (through !== undefined) &&
    pairs.every(([own, theirs]) => has(from, own) && has(join, theirs)) &&
    (throughPairs ?? []).every(([own, theirs]) => has(join, own) && has(to, theirs))
  return valid ? undefined : 'RELATION_INVALID'
}

/** The concept is complete enough to propose: its source, its title and key fields, and a role's base. */
function conceptRefusal(
  world: World,
  item: Extract<ProposedItem, { kind: 'ADD_CONCEPT' }>,
): ItemRefusal | undefined {
  const { key, base, keyFields, titleField } = item.concept
  if (base !== undefined) {
    const of = world.concepts.get(base)
    if (of === undefined || base === key) return 'CONCEPT_INCOMPLETE'
    if (of.keyFields.length !== keyFields.length) return 'ROLE_KEY_MISMATCH'
  }
  const fields = [...keyFields, titleField]
  if (!world.sources.has(key) || !fields.every((field) => world.fields.has(fieldKey(key, field))))
    return 'CONCEPT_INCOMPLETE'
  return undefined
}

/** The inventory's own word for a code: the entry the agent cites, if the newest reading holds it with the value. */
export async function inDictionary(
  database: Database,
  on: Readonly<{ companyId: CompanyId; personId: PersonId; door: ConceptDoor }>,
  cited: readonly Extract<ProposedItem, { kind: 'SET_CODE' }>[],
): Promise<Set<string>> {
  const names = cited.flatMap((item) =>
    item.dictionary?.endsWith(`=${item.value}`) ? [item.dictionary] : [],
  )
  if (names.length === 0) return new Set()
  const scope = { kind: 'COMPANY', companyId: on.companyId, personId: on.personId } as const
  return database.read(scope, async (tx) => {
    const run = await shownRunOf(tx, {
      companyId: on.companyId,
      connectionId: on.door.connectionId,
    })
    if (run === undefined) return new Set<string>()
    const found = await tx
      .select({ name: inventoryEntry.name })
      .from(inventoryEntry)
      .where(
        and(
          eq(inventoryEntry.runId, run.id),
          eq(inventoryEntry.kind, 'CODE'),
          inArray(inventoryEntry.name, names),
        ),
      )
    return new Set(found.map((row) => row.name))
  })
}

async function codeChecked(
  door: ConceptDoor,
  world: World,
  item: Extract<ProposedItem, { kind: 'SET_CODE' }>,
  dictionary: ReadonlySet<string>,
): Promise<Outcome> {
  const target = targetOf(item)
  const known = isActive(world.active, target)
  const unseen = known ? undefined : await seenCode(door, world, item)
  if (typeof unseen === 'string') return refusal(target, unseen)
  if (unseen !== undefined) return refusal(target, unseen[0], unseen[1])
  // The origin is the server's: the cited entry stays only when the inventory holds it.
  const { dictionary: cited, ...rest } = item
  const kept = cited !== undefined && dictionary.has(cited) ? item : rest
  return { kept: { item: kept, target } }
}

function keptUnless(item: ProposedItem, refused: ItemRefusal | undefined): Outcome {
  const target = targetOf(item)
  return refused === undefined ? { kept: { item, target } } : refusal(target, refused)
}

/** Checks one item against the world, through the door when its rule asks the system. */
export async function checked(
  door: ConceptDoor,
  world: World,
  item: ProposedItem,
  dictionary: ReadonlySet<string>,
): Promise<Outcome> {
  switch (item.kind) {
    case 'SET_SOURCE':
      return provedSource(door, world, item)
    case 'ADD_CONCEPT':
      return keptUnless(item, conceptRefusal(world, item))
    case 'ADD_FIELD': {
      if (!world.concepts.has(item.concept)) return keptUnless(item, 'CONCEPT_INCOMPLETE')
      const shape = world.sources.get(item.concept)?.shape
      const seen = shape?.some((each) => each.column === item.field.column) === true
      return keptUnless(item, seen ? undefined : 'FIELD_NOT_IN_PROOF')
    }
    case 'SET_CODE':
      return codeChecked(door, world, item, dictionary)
    case 'ADD_RELATION':
      return keptUnless(item, relationRefusal(world, item))
    case 'RENAME_LABEL':
    case 'DEPRECATE':
      return keptUnless(item, isActive(world.active, targetOf(item)) ? undefined : 'TARGET_UNKNOWN')
    default:
      return item satisfies never
  }
}
