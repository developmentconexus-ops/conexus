/*
 * A best-effort first layer, not a guarantee. It refuses, before any request is built, what is plainly
 * not one read: a comment, a second statement, a write word, a number glued to a word. Sankhya's
 * DbExplorer, which refuses a consult that writes, is the second layer, and the read only integration
 * user the company created is behind both. Quoting follows Oracle and SQL Server, the databases Sankhya
 * runs on; SQL Server runs a second statement with no `;` before it, so statement words are refused
 * anywhere. Comments are refused outright, quoted or not: SQL Server nests block comments and Oracle
 * does not, and a line comment ends at different characters on each, so no reading of where one ends is
 * safe on both, and a read never needs one.
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
    'DISABLE',
    'ENABLE',
    'DECLARE',
    'WAITFOR',
    'RENAME',
    'ROLLBACK',
    'RECEIVE',
    'SEND',
    'MOVE',
    'CHECKPOINT',
    'SETUSER',
    'ADD',
    'USE',
    'SET',
    'END\\s+CONVERSATION',
  ].join('|')})\\b`,
  'i',
)

const COMMENT = /\/\*|\*\/|--/
// SQL Server ends a number at its first non-digit, so `1DELETE` is `1` and then `DELETE`, where `\b` sees one word.
const GLUED_NUMBER = /(?<![\w@#])(?=((?:\d+\.?\d*|\.\d+)(?:e[+-]?\d*)?))\1[a-z_]/i
const CLOSING_QUOTE: Readonly<Record<string, string>> = { "'": "'", '"': '"', '[': ']' }

/** The index just past the quoted text opened at `start`, where a doubled closing quote is an escape; -1 if it never closes. */
function pastQuote(sql: string, start: number, close: string): number {
  for (let at = start + 1; ; at += 2) {
    at = sql.indexOf(close, at)
    if (at === -1) return -1
    if (sql[at + 1] !== close) return at + 1
  }
}

/** The index past the quoted text that starts at `at`, -1 when it never closes, or null when `at` starts plain code. */
function skipAt(sql: string, at: number): number | null {
  const close = CLOSING_QUOTE[sql[at] ?? '']
  return close === undefined ? null : pastQuote(sql, at, close)
}

/** The SQL with each quoted text replaced by a space; null when one never closes, a comment appears anywhere, or Oracle's `q'` quoting appears. */
function codeOf(sql: string): string | null {
  if (COMMENT.test(sql)) return null
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

/** No `;`, no refused word and no number glued to a letter in the code, the part of the wire that a statement and a condition share. */
function isInert(code: string): boolean {
  return !code.includes(';') && !REFUSED_WORDS.test(code) && !GLUED_NUMBER.test(code)
}

/** One SELECT or WITH statement, with no refused word outside quoted text. */
export function isOneReadStatement(sql: string): boolean {
  const code = codeOf(sql)?.trim().replace(/;$/, '')
  return code !== undefined && /^(?:SELECT|WITH)\b/i.test(code) && isInert(code)
}

/** A condition (`loadRecords` criteria) that carries no second statement: the same wire, with no `;` at all. */
export function isReadCondition(text: string): boolean {
  const code = codeOf(text)
  return code !== null && isInert(code)
}
