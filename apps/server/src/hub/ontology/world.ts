import type { ConversationId, ItemRefusal, ProposedItem } from '@conexus/hub-api'
import { ProofRunId } from '@conexus/hub-api'
import { and, eq } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import type { RoleOf } from '../connectors/public.ts'
import type { ActiveSet } from './active.ts'
import { activeIn } from './active.ts'
import { storedItem } from './items.ts'
import type { Shape } from './proof.ts'
import { newestShapeOf, shapesOf } from './proof.ts'
import { proposal, proposalItem } from './tables.ts'

/** An item of the conversation's open proposal still waiting for a decision. */
export type Pending = Readonly<{
  item: ProposedItem
  target: string
  proofRunId: ProofRunId | null
}>

type ConceptOf = Readonly<{
  keyFields: readonly string[]
  titleField: string
  base?: string | undefined
}>
type FieldOf = Readonly<{ column: string; type: string }>

/**
 * Every element the items may lean on: the active ones, the pending items of the open proposal and
 * the items of this call. Whether those are approved is the decision's (U4); here they only exist.
 */
export type World = Readonly<{
  concepts: Map<string, ConceptOf>
  fields: Map<string, FieldOf>
  /** The proved query of each concept and the shape its newest proof saw. */
  sources: Map<string, { sql: string; shape: Shape | undefined }>
  active: ActiveSet
}>

export function fieldKey(concept: string, field: string): string {
  return `${concept}.${field}`
}

/** What the active set and the open proposal already hold, read in one short transaction. */
export async function contextOf(tx: ReadTx, conversationId: ConversationId | null) {
  const active = await activeIn(tx)
  const open =
    conversationId === null
      ? []
      : await tx
          .select({
            kind: proposalItem.kind,
            content: proposalItem.content,
            target: proposalItem.target,
            proofRunId: proposalItem.proofRunId,
          })
          .from(proposalItem)
          .innerJoin(proposal, eq(proposal.id, proposalItem.proposalId))
          .where(
            and(
              eq(proposal.conversationId, conversationId),
              eq(proposal.state, 'OPEN'),
              eq(proposalItem.decision, 'PENDING'),
            ),
          )
  const pending: Pending[] = open.map((row) => ({
    item: storedItem(row),
    target: row.target,
    proofRunId: row.proofRunId === null ? null : ProofRunId.parse(row.proofRunId),
  }))
  const shapes = await shapesOf(
    tx,
    pending.flatMap((each) => (each.proofRunId === null ? [] : [each.proofRunId])),
  )
  const activeShapes = new Map<string, Shape | undefined>()
  for (const source of active.sources)
    activeShapes.set(
      source.concept,
      await newestShapeOf(tx, { connectionId: source.connectionId, sql: source.read.sql }),
    )
  return { active, pending, shapes, activeShapes }
}

export type Context = Awaited<ReturnType<typeof contextOf>>

function activeWorld({ active, activeShapes }: Context): World {
  const world: World = { concepts: new Map(), fields: new Map(), sources: new Map(), active }
  for (const concept of active.concepts.filter((each) => live(each.state)))
    world.concepts.set(concept.key, {
      keyFields: concept.keyFields,
      titleField: concept.titleField,
      base: concept.base ?? undefined,
    })
  for (const field of active.fields.filter((each) => live(each.state)))
    world.fields.set(fieldKey(field.concept, field.key), {
      column: field.columnName,
      type: field.type,
    })
  for (const source of active.sources)
    world.sources.set(source.concept, {
      sql: source.read.sql,
      shape: activeShapes.get(source.concept),
    })
  return world
}

/** The world the items are checked against; the call's own sources enter as they are proved. */
export function worldOf(context: Context, items: readonly ProposedItem[]): World {
  const world = activeWorld(context)
  const declared = [
    ...context.pending.map((each) => ({ item: each.item, proofRunId: each.proofRunId })),
    ...items.map((item) => ({ item, proofRunId: null })),
  ]
  for (const { item, proofRunId } of declared) {
    if (item.kind === 'ADD_CONCEPT') world.concepts.set(item.concept.key, item.concept)
    if (item.kind === 'ADD_FIELD')
      world.fields.set(fieldKey(item.concept, item.field.key), item.field)
    if (item.kind === 'SET_SOURCE' && proofRunId !== null)
      world.sources.set(item.concept, { sql: item.sql, shape: context.shapes.get(proofRunId) })
  }
  return world
}

/** The role's proof: the base's proved query and its key columns paired with the role's, by position. */
export function roleOf(world: World, concept: string): RoleOf | ItemRefusal | undefined {
  const role = world.concepts.get(concept)
  if (role?.base === undefined) return undefined
  const base = world.concepts.get(role.base)
  const baseSource = world.sources.get(role.base)
  if (base === undefined || baseSource === undefined) return 'CONCEPT_INCOMPLETE'
  if (base.keyFields.length !== role.keyFields.length) return 'ROLE_KEY_MISMATCH'
  const keys: (readonly [string, string])[] = []
  for (const [at, key] of role.keyFields.entries()) {
    const own = world.fields.get(fieldKey(concept, key))?.column
    const theirs = world.fields.get(fieldKey(role.base, base.keyFields[at] ?? ''))?.column
    if (own === undefined || theirs === undefined) return 'CONCEPT_INCOMPLETE'
    if (!baseSource.shape?.some((each) => each.column === theirs)) return 'FIELD_NOT_IN_PROOF'
    keys.push([own, theirs])
  }
  return { base: baseSource.sql, keys }
}

function live(state: string): boolean {
  return state !== 'DEPRECATED'
}

/** An element the active set holds and has not deprecated. */
export function isActive(active: ActiveSet, target: string): boolean {
  if (target.startsWith('@'))
    return active.relations.some((each) => each.key === target.slice(1) && live(each.state))
  const [concept = '', rest] = target.split(/\.(.*)/s)
  if (rest === undefined)
    return active.concepts.some((each) => each.key === concept && live(each.state))
  const [field = '', value] = rest.split(/=(.*)/s)
  if (value === undefined)
    return active.fields.some(
      (each) => each.concept === concept && each.key === field && live(each.state),
    )
  return active.codes.some(
    (each) =>
      each.concept === concept && each.field === field && each.value === value && live(each.state),
  )
}
