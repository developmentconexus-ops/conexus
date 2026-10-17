import { sql } from 'drizzle-orm'
import { check, integer, pgSchema, text, timestamp } from 'drizzle-orm/pg-core'
import { SCOPE_ROLES, scoped } from '../../platform/database.ts'
import { ADMINISTRATOR, policy } from '../identity/public.ts'

export const operations = pgSchema('operations')

// Conexus's commercial record of a client company. The company itself belongs to identity, so
// company_id is only its id, with no foreign key between owners (data D17).
export const client = operations.table(
  'client',
  {
    companyId: text('company_id').primaryKey(),
    cnpj: text('cnpj').notNull().unique('client_cnpj_key'),
    legalName: text('legal_name').notNull(),
    revision: integer('revision').notNull().default(0),
    attemptKey: text('attempt_key').notNull().unique('client_attempt_key_key'),
    registeredAt: timestamp('registered_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    check('client_cnpj_format', sql`${table.cnpj} ~ '^[0-9A-Z]{12}[0-9]{2}$'`),
    check('client_legal_name_length', sql`char_length(${table.legalName}) BETWEEN 1 AND 150`),
    check('client_revision_not_negative', sql`${table.revision} >= 0`),
    // Only the operator reaches a client: every one to read and write, one company's to delete.
    policy(SCOPE_ROLES.OPERATOR, 'select', ADMINISTRATOR),
    policy(SCOPE_ROLES.OPERATOR, 'insert', ADMINISTRATOR),
    policy(SCOPE_ROLES.OPERATOR, 'update', ADMINISTRATOR),
    policy(
      SCOPE_ROLES.OPERATOR,
      'delete',
      sql`${ADMINISTRATOR} and company_id = ${scoped.companyId}`,
    ),
  ],
)
