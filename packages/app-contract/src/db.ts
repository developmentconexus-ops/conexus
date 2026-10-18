/** One SQL statement and its bound values; the text never carries a value (data D20). */
export type Statement = Readonly<{ text: string; values?: readonly unknown[] }>

/** A row as PostgreSQL's JSON answer gives it. */
export type Row = Readonly<Record<string, unknown>>

/** What `db` answers: the rows, or the failure's SQLSTATE alone, never the statement or a value. */
export type DbResult = Readonly<{ rows: readonly Row[] }> | Readonly<{ error: { code: string } }>

/**
 * The app's database (decision 0045): `query` only reads, in a read-only transaction, so a write
 * there is refused with 25006; every write of a call goes in one `batch`, one transaction, all or
 * none.
 */
export type Db = Readonly<{
  query(text: string, values?: readonly unknown[]): Promise<DbResult>
  batch(
    statements: readonly Statement[],
  ): Promise<
    | Readonly<{ results: readonly Readonly<{ rows: readonly Row[] }>[] }>
    | Readonly<{ error: { code: string } }>
  >
}>
