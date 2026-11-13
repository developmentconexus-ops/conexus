import { desc, sql } from 'drizzle-orm'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import { check, foreignKey, integer, jsonb, primaryKey, text, uuid } from 'drizzle-orm/pg-core'
import { SCOPE_ROLES } from '../../../platform/database.ts'
import { policy } from '../../identity/public.ts'
import { COMPANY_ROW, keyCheck, ontology, proofRun, revision, STATES } from '../tables.ts'

// The versions: one immutable row per element and revision, and the views that read the newest of
// each key (A Ontologia da empresa, U1).

function revisionFk(name: string, companyId: AnyPgColumn, number: AnyPgColumn) {
  return foreignKey({
    name,
    columns: [companyId, number],
    foreignColumns: [revision.companyId, revision.number],
  }).onDelete('cascade')
}

/** A concept as one revision left it; the newest of each key is the view `concept`. */
export const conceptVersion = ontology.table(
  'concept_version',
  {
    companyId: text('company_id').notNull(),
    key: text('key').notNull(),
    revision: integer('revision').notNull(),
    name: text('name').notNull(),
    plural: text('plural').notNull(),
    description: text('description').notNull(),
    synonyms: text('synonyms').array().notNull(),
    titleField: text('title_field').notNull(),
    keyFields: text('key_fields').array().notNull(),
    // The concept this one is a role of, or null.
    base: text('base'),
    state: text('state', { enum: STATES }).notNull(),
    replacedBy: text('replaced_by'),
  },
  (table) => [
    primaryKey({ columns: [table.companyId, table.key, table.revision] }),
    revisionFk('concept_version_revision_fkey', table.companyId, table.revision),
    keyCheck('concept_version_key', table.key),
    check('concept_version_name', sql`char_length(${table.name}) BETWEEN 1 AND 80`),
    check('concept_version_plural', sql`char_length(${table.plural}) BETWEEN 1 AND 80`),
    check('concept_version_description', sql`char_length(${table.description}) <= 500`),
    check('concept_version_key_fields', sql`cardinality(${table.keyFields}) BETWEEN 1 AND 4`),
    check('concept_version_base', sql`${table.base} IS NULL OR ${table.base} <> ${table.key}`),
    check('concept_version_state', sql`${table.state} IN ('EXPERIMENTAL', 'ACTIVE', 'DEPRECATED')`),
    policy(SCOPE_ROLES.COMPANY, 'all', COMPANY_ROW),
  ],
)

const FIELD_TYPES = [
  'ID',
  'TEXT',
  'INTEGER',
  'DECIMAL',
  'MONEY',
  'DATE',
  'TIMESTAMP',
  'BOOLEAN',
  'CODE',
] as const

/** A field of a concept as one revision left it. */
export const fieldVersion = ontology.table(
  'field_version',
  {
    companyId: text('company_id').notNull(),
    concept: text('concept').notNull(),
    key: text('key').notNull(),
    revision: integer('revision').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    type: text('type', { enum: FIELD_TYPES }).notNull(),
    currency: text('currency'),
    unit: text('unit'),
    // The column of the concept's source this field reads.
    columnName: text('column_name').notNull(),
    state: text('state', { enum: STATES }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.companyId, table.concept, table.key, table.revision] }),
    revisionFk('field_version_revision_fkey', table.companyId, table.revision),
    keyCheck('field_version_concept', table.concept),
    keyCheck('field_version_key', table.key),
    check('field_version_name', sql`char_length(${table.name}) BETWEEN 1 AND 80`),
    check('field_version_description', sql`char_length(${table.description}) <= 200`),
    check(
      'field_version_type',
      sql`${table.type} IN (${sql.raw(FIELD_TYPES.map((type) => `'${type}'`).join(', '))})`,
    ),
    check('field_version_currency', sql`${table.currency} ~ '^[A-Z]{3}$'`),
    check('field_version_money', sql`(${table.type} = 'MONEY') = (${table.currency} IS NOT NULL)`),
    check('field_version_unit', sql`char_length(${table.unit}) <= 12`),
    check('field_version_column', sql`char_length(${table.columnName}) BETWEEN 1 AND 128`),
    check('field_version_state', sql`${table.state} IN ('EXPERIMENTAL', 'ACTIVE', 'DEPRECATED')`),
    policy(SCOPE_ROLES.COMPANY, 'all', COMPANY_ROW),
  ],
)

/** What one value of a `CODE` field means, as one revision left it. */
export const codeVersion = ontology.table(
  'code_version',
  {
    companyId: text('company_id').notNull(),
    concept: text('concept').notNull(),
    field: text('field').notNull(),
    value: text('value').notNull(),
    revision: integer('revision').notNull(),
    label: text('label').notNull(),
    description: text('description'),
    // The system's dictionary said it, or a person did.
    origin: text('origin', { enum: ['DICTIONARY', 'PERSON'] }).notNull(),
    state: text('state', { enum: ['ACTIVE', 'DEPRECATED'] }).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.companyId, table.concept, table.field, table.value, table.revision],
    }),
    revisionFk('code_version_revision_fkey', table.companyId, table.revision),
    keyCheck('code_version_concept', table.concept),
    keyCheck('code_version_field', table.field),
    check('code_version_value', sql`char_length(${table.value}) BETWEEN 1 AND 40`),
    check('code_version_label', sql`char_length(${table.label}) BETWEEN 1 AND 80`),
    check('code_version_description', sql`char_length(${table.description}) <= 200`),
    check('code_version_origin', sql`${table.origin} IN ('DICTIONARY', 'PERSON')`),
    check('code_version_state', sql`${table.state} IN ('ACTIVE', 'DEPRECATED')`),
    policy(SCOPE_ROLES.COMPANY, 'all', COMPANY_ROW),
  ],
)

/**
 * A link between two concepts as one revision left it, direct by `pairs` or through a join concept
 * (`through`: `pairs` reach the join, `through_pairs` leave it); a concept may link to itself.
 */
export const relationVersion = ontology.table(
  'relation_version',
  {
    companyId: text('company_id').notNull(),
    key: text('key').notNull(),
    revision: integer('revision').notNull(),
    fromConcept: text('from_concept').notNull(),
    toConcept: text('to_concept').notNull(),
    cardinality: text('cardinality', {
      enum: ['MANY_TO_ONE', 'ONE_TO_ONE', 'MANY_TO_MANY'],
    }).notNull(),
    // `RelationPairs` of `@conexus/hub-api`, parsed again at each read (code C27).
    pairs: jsonb('pairs').notNull(),
    // What each side is called from the other: "atendido por", "veio de".
    fromName: text('from_name').notNull(),
    toName: text('to_name').notNull(),
    through: text('through'),
    throughPairs: jsonb('through_pairs'),
    state: text('state', { enum: STATES }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.companyId, table.key, table.revision] }),
    revisionFk('relation_version_revision_fkey', table.companyId, table.revision),
    keyCheck('relation_version_key', table.key),
    keyCheck('relation_version_from', table.fromConcept),
    keyCheck('relation_version_to', table.toConcept),
    check(
      'relation_version_cardinality',
      sql`${table.cardinality} IN ('MANY_TO_ONE', 'ONE_TO_ONE', 'MANY_TO_MANY')`,
    ),
    check('relation_version_pairs', sql`jsonb_typeof(${table.pairs}) = 'array'`),
    check(
      'relation_version_through_pairs',
      sql`${table.throughPairs} IS NULL OR jsonb_typeof(${table.throughPairs}) = 'array'`,
    ),
    check(
      'relation_version_names',
      sql`char_length(${table.fromName}) BETWEEN 1 AND 80 AND char_length(${table.toName}) BETWEEN 1 AND 80`,
    ),
    check(
      'relation_version_through',
      sql`(${table.cardinality} = 'MANY_TO_MANY') = (${table.through} IS NOT NULL)`,
    ),
    check(
      'relation_version_through_both',
      sql`(${table.through} IS NULL) = (${table.throughPairs} IS NULL)`,
    ),
    check(
      'relation_version_state',
      sql`${table.state} IN ('EXPERIMENTAL', 'ACTIVE', 'DEPRECATED')`,
    ),
    policy(SCOPE_ROLES.COMPANY, 'all', COMPANY_ROW),
  ],
)

/**
 * Where a concept's rows are read from, with the proof that the read works. No foreign key to the
 * connection: turning it off leaves the source, the proofs and the inventory (the card's debt).
 */
export const sourceVersion = ontology.table(
  'source_version',
  {
    companyId: text('company_id').notNull(),
    concept: text('concept').notNull(),
    revision: integer('revision').notNull(),
    connectionId: uuid('connection_id').notNull(),
    // `SourceRead` of `@conexus/hub-api`, parsed again at each read (code C27).
    read: jsonb('read').notNull(),
    proofRunId: uuid('proof_run_id').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.companyId, table.concept, table.revision] }),
    revisionFk('source_version_revision_fkey', table.companyId, table.revision),
    foreignKey({
      name: 'source_version_proof_fkey',
      columns: [table.companyId, table.proofRunId],
      foreignColumns: [proofRun.companyId, proofRun.id],
    }).onDelete('cascade'),
    keyCheck('source_version_concept', table.concept),
    check('source_version_read', sql`jsonb_typeof(${table.read}) = 'object'`),
    policy(SCOPE_ROLES.COMPANY, 'all', COMPANY_ROW),
  ],
)

// The current of each element: the newest version of each key. `security_invoker`, so a view reads
// the tables with the caller's row policy, never the owner's.
export const currentConcept = ontology
  .view('concept')
  .with({ securityInvoker: true })
  .as((qb) =>
    qb
      .selectDistinctOn([conceptVersion.companyId, conceptVersion.key])
      .from(conceptVersion)
      .orderBy(conceptVersion.companyId, conceptVersion.key, desc(conceptVersion.revision)),
  )

export const currentField = ontology
  .view('field')
  .with({ securityInvoker: true })
  .as((qb) =>
    qb
      .selectDistinctOn([fieldVersion.companyId, fieldVersion.concept, fieldVersion.key])
      .from(fieldVersion)
      .orderBy(
        fieldVersion.companyId,
        fieldVersion.concept,
        fieldVersion.key,
        desc(fieldVersion.revision),
      ),
  )

export const currentCode = ontology
  .view('code')
  .with({ securityInvoker: true })
  .as((qb) =>
    qb
      .selectDistinctOn([
        codeVersion.companyId,
        codeVersion.concept,
        codeVersion.field,
        codeVersion.value,
      ])
      .from(codeVersion)
      .orderBy(
        codeVersion.companyId,
        codeVersion.concept,
        codeVersion.field,
        codeVersion.value,
        desc(codeVersion.revision),
      ),
  )

export const currentRelation = ontology
  .view('relation')
  .with({ securityInvoker: true })
  .as((qb) =>
    qb
      .selectDistinctOn([relationVersion.companyId, relationVersion.key])
      .from(relationVersion)
      .orderBy(relationVersion.companyId, relationVersion.key, desc(relationVersion.revision)),
  )

export const currentSource = ontology
  .view('source')
  .with({ securityInvoker: true })
  .as((qb) =>
    qb
      .selectDistinctOn([sourceVersion.companyId, sourceVersion.concept])
      .from(sourceVersion)
      .orderBy(sourceVersion.companyId, sourceVersion.concept, desc(sourceVersion.revision)),
  )
