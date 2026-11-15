/** The order the three agents follow to read copied data: one function, one text. */
export function dataOrder(): string {
  return [
    '## Company data',
    "To answer with the company's copied data, go in this order:",
    '1. data_describe with no table: the tables this person may read, with what each holds.',
    '2. data_describe with the table: its columns and five rows. Read the rows before you write a query.',
    '3. data_query with one read-only PostgreSQL SELECT. Name each table with its schema (sync.sankhya_vendas). Aggregate in SQL and add LIMIT.',
    "State the number and where it came from: the system, the table and when it was last copied, as the answer's `origin` gives them.",
    'When the last run was partial or failed, say that the number may be incomplete.',
    'When no table holds what was asked, say so and name what exists that is close. That is an answer, not an error.',
    'A table read is never replaced by a live read of the system.',
  ].join('\n')
}
