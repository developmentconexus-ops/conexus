import { z } from 'zod'
import { ConnectionId } from './connectors.ts'

// The company's Ontology (A Ontologia da empresa): the contracts the Hub's `ontology` tables read
// and write. Every `jsonb` column has its schema here, parsed at the database's boundary (code C27).

const Key = z.string().regex(/^[a-z][a-z0-9_]{0,39}$/) // no brand: each key brands it once
export const ConceptKey = Key.brand<'ConceptKey'>()
export const FieldKey = Key.brand<'FieldKey'>()
export const RelationKey = Key.brand<'RelationKey'>()
export const FieldType = z.enum([
  'ID',
  'TEXT',
  'INTEGER',
  'DECIMAL',
  'MONEY',
  'DATE',
  'TIMESTAMP',
  'BOOLEAN',
  'CODE',
])
export const Cardinality = z.enum(['MANY_TO_ONE', 'ONE_TO_ONE', 'MANY_TO_MANY'])
/** The address of an active element: `pedido`, `pedido.tipo_operacao`, `pedido.tipo_operacao=101`, `@pedido_vendedor`. */
export const Target = z
  .string()
  .max(130)
  .regex(/^(@[a-z][a-z0-9_]{0,39}|[a-z][a-z0-9_]{0,39}(\.[a-z][a-z0-9_]{0,39}(=[^\s]{1,40})?)?)$/)
  .brand<'OntologyTarget'>()
const Name = z.string().min(1).max(80)

export const OntologyProposalId = z.uuid().brand<'OntologyProposalId'>()
export const ProofRunId = z.uuid().brand<'ProofRunId'>()
export const InventoryRunId = z.uuid().brand<'InventoryRunId'>()

/** One to four pairs of fields, as the key of a copy has one to four columns. */
export const RelationPairs = z
  .array(z.tuple([FieldKey, FieldKey]))
  .min(1)
  .max(4)

/** What a proof saw: each column with the system's own type, never a row. */
export const ProofShape = z
  .array(z.strictObject({ column: z.string(), type: z.string().nullable() }))
  .max(200)

/** Where a concept's rows are read from: a statement the connector's door runs. */
export const SourceRead = z.strictObject({
  kind: z.literal('DOOR'),
  sql: z.string().min(1).max(4000),
})

/** The proposal's items, one union on `kind` (code C21). `NOTE` is written only by the migration. */
export const ProposedItem = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('ADD_CONCEPT'),
    concept: z.object({
      key: ConceptKey,
      name: Name,
      plural: Name,
      description: z.string().max(500),
      synonyms: z.array(Name).max(10),
      titleField: FieldKey,
      keyFields: z.array(FieldKey).min(1).max(4),
      base: ConceptKey.optional(), // this concept is a role of that one
      state: z.enum(['EXPERIMENTAL', 'ACTIVE']),
    }),
  }),
  z.object({
    kind: z.literal('ADD_FIELD'),
    concept: ConceptKey,
    field: z.object({
      key: FieldKey,
      name: Name,
      description: z.string().max(200),
      type: FieldType,
      currency: z
        .string()
        .regex(/^[A-Z]{3}$/)
        .optional(),
      unit: z.string().max(12).optional(),
      column: z.string().max(128),
    }),
  }),
  z.object({
    kind: z.literal('SET_CODE'),
    concept: ConceptKey,
    field: FieldKey,
    value: z.string().min(1).max(40),
    label: z.string().max(80),
    description: z.string().max(200).optional(),
    dictionary: z.string().max(200).optional(), // the inventory entry the agent cites; origin is the server's
  }),
  z.object({
    kind: z.literal('ADD_RELATION'),
    relation: z.object({
      key: RelationKey,
      from: ConceptKey,
      to: ConceptKey,
      cardinality: Cardinality,
      pairs: RelationPairs,
      fromName: Name,
      toName: Name,
      through: ConceptKey.optional(),
      throughPairs: RelationPairs.optional(), // with through: pairs reach the join, throughPairs leave it
    }),
  }),
  z.object({
    kind: z.literal('SET_SOURCE'),
    concept: ConceptKey,
    sql: z.string().min(1).max(4000),
  }),
  z.object({
    kind: z.literal('RENAME_LABEL'),
    target: Target,
    name: z.string().max(80),
    description: z.string().max(500).optional(),
  }),
  z.object({
    kind: z.literal('DEPRECATE'),
    target: Target,
    reason: z.string().max(500),
    replacedBy: Target.optional(),
  }),
])
export type ProposedItem = z.infer<typeof ProposedItem>

/** A note of the old notebook, kept as a pending item (what `connection.notes` held, never a value). */
export const NoteContent = z.strictObject({
  connectionId: ConnectionId,
  concept: z.string().min(1).max(120),
  mapping: z.string().min(1).max(500),
  provingQuery: z.string().min(1).max(4000),
  provedAt: z.iso.datetime(),
  provedRows: z.int().nonnegative(),
})

/** An item's content as `proposal_item.content` holds it: its `ProposedItem` without `kind`, or a note. */
export const ItemContent = z.union([
  ProposedItem.options[0].omit({ kind: true }).strict(),
  ProposedItem.options[1].omit({ kind: true }).strict(),
  ProposedItem.options[2].omit({ kind: true }).strict(),
  ProposedItem.options[3].omit({ kind: true }).strict(),
  ProposedItem.options[4].omit({ kind: true }).strict(),
  ProposedItem.options[5].omit({ kind: true }).strict(),
  ProposedItem.options[6].omit({ kind: true }).strict(),
  NoteContent,
])
export type ItemContent = z.infer<typeof ItemContent>
