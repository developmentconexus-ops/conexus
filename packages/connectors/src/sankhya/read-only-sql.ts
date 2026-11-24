/*
 * The first of three layers, and only best effort: it refuses before any request is built what is
 * plainly not one read. Sankhya's DbExplorer refuses a consult that writes, and the company's read
 * only integration user is behind both. Sankhya runs on Oracle or SQL Server: SQL Server runs a second
 * statement with no `;` before it, so a statement word is refused anywhere outside quotes; the two
 * disagree on where a comment ends (SQL Server nests `/*`, and their line ends differ), so no comment
 * is read at all, quoted or not.
 */

const STATEMENT_WORDS = [
  'ADD',
  'ALTER',
  'BACKUP',
  'BEGIN',
  'CALL',
  'CHECKPOINT',
  'COMMIT',
  'CREATE',
  'DBCC',
  'DECLARE',
  'DELETE',
  'DENY',
  'DISABLE',
  'DROP',
  'ENABLE',
  'END\\s+CONVERSATION',
  'EXEC',
  'EXECUTE',
  'GRANT',
  'INSERT',
  'INTO',
  'KILL',
  'MERGE',
  'MOVE',
  'OPENDATASOURCE',
  'OPENQUERY',
  'OPENROWSET',
  'RECEIVE',
  'RECONFIGURE',
  'RENAME',
  'RESTORE',
  'REVOKE',
  'ROLLBACK',
  'SEND',
  'SET',
  'SETUSER',
  'SHUTDOWN',
  'TRUNCATE',
  'UPDATE',
  'UPDATETEXT',
  'USE',
  'WAITFOR',
  'WRITETEXT',
]
const STATEMENT_WORD = new RegExp(`\\b(?:${STATEMENT_WORDS.join('|')})\\b`, 'i')
const COMMENT_MARK = /--|\/\*|\*\//
const CLOSER: Readonly<Record<string, string>> = { "'": "'", '"': '"', '[': ']' }
const NUMBER = /(?<![\w@#])(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d*)?/gi

/** The text with every quoted part made one space; null when a quote never closes or Oracle's `q'` quoting opens one. */
function unquoted(text: string): string | null {
  let code = ''
  let at = 0
  while (at < text.length) {
    const opener = text[at] ?? ''
    const closer = CLOSER[opener]
    if (closer === undefined) {
      code += opener
      at += 1
      continue
    }
    if (opener === "'" && /q/i.test(text[at - 1] ?? '')) return null
    let end = text.indexOf(closer, at + 1)
    while (end !== -1 && text[end + 1] === closer) end = text.indexOf(closer, end + 2)
    if (end === -1) return null
    code += ' '
    at = end + 1
  }
  return code
}

/** SQL Server ends a number at its first other character, so `1DELETE` is `1` and then `DELETE`, where `\b` sees one word. */
function gluesANumber(code: string): boolean {
  return [...code.matchAll(NUMBER)].some((found) =>
    /[a-z_]/i.test(code[found.index + found[0].length] ?? ''),
  )
}

/** The code outside quotes when nothing in it can end the read and start another; else null. */
function inertCode(text: string): string | null {
  if (COMMENT_MARK.test(text)) return null
  const code = unquoted(text)
  if (code === null || STATEMENT_WORD.test(code) || gluesANumber(code)) return null
  return code
}

/** One SELECT or WITH, at most one `;` and only at its end. */
export function isOneReadStatement(sql: string): boolean {
  const code = inertCode(sql)?.trim().replace(/;$/, '')
  return code !== undefined && /^(?:SELECT|WITH)\b/i.test(code) && !code.includes(';')
}

/** A `loadRecords` condition: the same refusals, and no `;` at all. */
export function isReadCondition(text: string): boolean {
  const code = inertCode(text)
  return code !== null && !code.includes(';')
}
