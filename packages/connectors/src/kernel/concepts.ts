// A concept's read in the connector's dialect (A Ontologia da empresa, U3): the kit never sees a
// concept, only a proved query and the typed columns of its fields.

export type ConceptColumn = Readonly<{
  column: string
  type: 'ID' | 'TEXT' | 'INTEGER' | 'DECIMAL' | 'MONEY' | 'DATE' | 'TIMESTAMP' | 'BOOLEAN' | 'CODE'
}>
export type ConceptFilter =
  | Readonly<{ column: string; op: 'equals'; value: string | number | boolean }>
  | Readonly<{ column: string; op: 'in'; values: readonly (string | number)[] }>
  | Readonly<{ column: string; op: 'from' | 'to'; value: string | number }>
  | Readonly<{ column: string; op: 'contains'; text: string }>
export type ConceptMeasure = Readonly<{
  count: boolean
  sum: readonly string[]
  groupBy: readonly string[]
}>
export type ConceptCall = Readonly<{
  sql: string // the proved query, as stored
  columns: readonly ConceptColumn[] // the concept's fields, by their column
  select: readonly string[]
  filters: readonly ConceptFilter[]
  measure?: ConceptMeasure
  limit: number // 1 to 100; one row more says there are more
  order: readonly string[] // the concept's key columns
}>

/** The connector's dialect for a concept's read; the kit never sees a concept, only a proved query and typed columns. */
export type ConceptRead = Readonly<{
  door: string // the door operation that runs the statements (Sankhya: 'consultar')
  count(sql: string): string
  shape(sql: string): string
  /** The rows of a role's read with no pair in its base's read, counted; zero proves the role is a subset. Keys pair by position. */
  subset(role: string, base: string, keys: readonly (readonly [string, string])[]): string
  compile(call: ConceptCall): string
}>

/** A call the dialect will not write: a value, a column or a key that is not what its type says; nothing becomes SQL. */
export class ConceptRefused extends Error {
  override readonly name = 'ConceptRefused'
}
