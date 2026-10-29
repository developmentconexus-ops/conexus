/*
 * The wire, not the guard. What keeps a consult read only is Sankhya's integration user, which holds
 * no insert, update or delete permission. This refuses, before any request is built, a consult that
 * is plainly not one read. Quoting follows Oracle and SQL Server, the databases Sankhya runs on; SQL
 * Server runs a second statement with no `;` before it, so statement words are refused anywhere.
 */
const REFUSED_WORDS = new RegExp(
  `\\b(?:${[
    'INSERT',
    'UPDATE',
    'DELETE',
    'MERGE',
    'DROP',
    'ALTER',
    'CREATE',
    'TRUNCATE',
    'GRANT',
    'REVOKE',
    'EXEC',
    'EXECUTE',
    'CALL',
    'INTO',
    'BEGIN',
    'COMMIT',
    'DENY',
    'WRITETEXT',
    'UPDATETEXT',
    'BACKUP',
    'RESTORE',
    'DBCC',
    'SHUTDOWN',
    'KILL',
    'RECONFIGURE',
    'OPENROWSET',
    'OPENDATASOURCE',
    'OPENQUERY',
  ].join('|')})\\b`,
  'i',
)

const LINE_END = /[\n\r\v\f\u0085\u2028\u2029]/
const CLOSING_QUOTE: Readonly<Record<string, string>> = { "'": "'", '"': '"', '[': ']' }

/** The index just past the quoted text opened at `start`, where a doubled closing quote is an escape; -1 if it never closes. */
function pastQuote(sql: string, start: number, close: string): number {
  for (let at = start + 1; ; at += 2) {
    at = sql.indexOf(close, at)
    if (at === -1) return -1
    if (sql[at + 1] !== close) return at + 1
  }
}

/** The index past the comment or quoted text that starts at `at`, -1 when it never closes or a comment nests, or null when `at` starts plain code. */
function skipAt(sql: string, at: number): number | null {
  const pair = sql.slice(at, at + 2)
  if (pair === '--') {
    const end = sql.slice(at).search(LINE_END)
    return end === -1 ? sql.length : at + end
  }
  if (pair === '/*') {
    const end = sql.indexOf('*/', at + 2)
    // SQL Server nests block comments and Oracle does not; a comment that opens another reads two ways.
    return end === -1 || sql.slice(at + 2, end).includes('/*') ? -1 : end + 2
  }
  const close = CLOSING_QUOTE[sql[at] ?? '']
  return close === undefined ? null : pastQuote(sql, at, close)
}

/** The SQL with each comment and quoted text replaced by a space; null when one never closes, a comment nests, or Oracle's `q'` quoting appears. */
function codeOf(sql: string): string | null {
  let code = ''
  let at = 0
  while (at < sql.length) {
    if (sql[at] === "'" && /q/i.test(sql[at - 1] ?? '')) return null
    const next = skipAt(sql, at)
    if (next === null) {
      code += sql[at]
      at += 1
      continue
    }
    if (next === -1) return null
    code += ' '
    at = next
  }
  return code
}

/** No `;` and no refused word in the code, the part of the wire that a statement and a condition share. */
function isInert(code: string): boolean {
  return !code.includes(';') && !REFUSED_WORDS.test(code)
}

/** One SELECT or WITH statement, with no refused word outside comments and quoted text. */
export function isOneReadStatement(sql: string): boolean {
  const code = codeOf(sql)?.trim().replace(/;$/, '')
  return code !== undefined && /^(?:SELECT|WITH)\b/i.test(code) && isInert(code)
}

/** A condition (`loadRecords` criteria) that carries no second statement: the same wire, with no `;` at all. */
export function isReadCondition(text: string): boolean {
  const code = codeOf(text)
  return code !== null && isInert(code)
}
