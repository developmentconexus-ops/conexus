import { sql } from 'drizzle-orm'
import { pgSchema } from 'drizzle-orm/pg-core'
import { scoped } from '../../platform/database.ts'

// The Builder's own schema in the Hub's database (decision 0011, data D1), shared by every table
// the Builder keeps there.
export const builder = pgSchema('builder')

// A person's conversation is its starter's alone (founder, study D1 A; step 24.1, criterion 8). A
// company scope with no person is the Hub's own work on the company, such as releasing the
// conversations of a Projeto, a person or the company.
export const OWN = sql`company_id = ${scoped.companyId}
  and (person_id = ${scoped.personId} or ${scoped.personId} is null)`

// A row every person of the company with the action reaches, as a Projeto's (step 24.3: agents and
// the tool library are the company's, not a person's).
export const OWN_COMPANY = sql`company_id = ${scoped.companyId}`
