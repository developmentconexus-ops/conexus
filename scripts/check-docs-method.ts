// Defect: the method states one rule's sentence in two guides, or a step card's reference table is
// missing, folds hand-written code into an "o resto" row, gives a row no verdict, or lets a remendo
// row name no library version (code C75). Founder, 2026-10-21: "1. Sim"; 2026-10-25: "1. A".
// Refusals are proved by planting each one in check-docs.test.ts.
// Revalidate by 2027-04-21, or when the card template's reference table changes.

export const RULE_DEFINITION = /^- \*\*([CDLSTVW]\d{1,3})\.\*\*/

export function words(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

export function withoutFences(text: string): string {
  return text.replace(/^(```|~~~)[\s\S]*?^\1/gm, '')
}

type Fail = (name: string, file: string, detail: string) => void

/** A rule's sentences: the definition line and its indented continuation, split at each full stop. */
function ruleSentences(text: string): string[] {
  const rules: string[] = []
  let rule: string | undefined
  for (const line of [...text.split('\n'), '']) {
    const continues = rule !== undefined && /^ {2}\S/.test(line)
    if (continues) rule += ` ${line.trim()}`
    else if (rule !== undefined) rules.push(rule)
    if (!continues)
      rule = RULE_DEFINITION.test(line) ? line.replace(RULE_DEFINITION, '') : undefined
  }
  return rules
    .flatMap((each) => each.split(/(?<=[.!?])\s+/))
    .map((sentence) => sentence.replace(/\s+/g, ' ').trim())
    .filter((sentence) => words(sentence) >= SENTENCE_WORDS)
}

/** A sentence shorter than this, such as a founder's dated quote, may repeat. */
const SENTENCE_WORDS = 6

function ruleSentencesTwice(texts: ReadonlyMap<string, string>, fail: Fail) {
  const homes = new Map<string, string>()
  for (const [file, text] of texts) {
    if (!/^docs\/guides\//.test(file)) continue
    for (const sentence of new Set(ruleSentences(text))) {
      const first = homes.get(sentence)
      if (first === undefined) homes.set(sentence, file)
      else if (first !== file)
        fail('rule-sentence-twice', file, `"${sentence}" is also in ${first}`)
    }
  }
}

const VERDICTS = /^(nativo|embrulhado|remendo)\b/i
const VERSION = /\d+\.\d+\.\d+/

function cells(line: string): string[] {
  return line
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim())
}

/** The rows of the card's "A tabela de referência" under its header line, or undefined. */
function referenceTable(text: string) {
  const lines = withoutFences(text).split('\n')
  const start = lines.findIndex((line) => /^## A tabela de referência\s*$/.test(line))
  if (start < 0) return undefined
  const end = lines.findIndex((line, index) => index > start && /^## /.test(line))
  const table = lines.slice(start + 1, end < 0 ? undefined : end).filter((l) => l.startsWith('|'))
  const header = cells(table[0] ?? '')
  const verdict = header.findIndex((cell) => /^Veredito$/i.test(cell))
  const proof = header.findIndex((cell) => /^Prova\b/i.test(cell))
  if (verdict < 0 || proof < 0) return undefined
  const rows = table.slice(2).map(cells)
  return { verdict, proof, rows }
}

function referenceRows(file: string, text: string, fail: Fail) {
  if (!/^docs\/steps\/[^/]+\.md$/.test(file)) return
  const table = referenceTable(text)
  if (table === undefined || table.rows.length === 0) {
    fail('card-without-references', file, 'no reference table with its Veredito and Prova columns')
    return
  }
  for (const row of table.rows) {
    const piece = row[0] ?? ''
    if (/^o resto$/i.test(piece)) fail('card-rest-row', file, row.join(' | '))
    const verdict = VERDICTS.exec(row[table.verdict] ?? '')?.[1]?.toLowerCase()
    if (verdict === undefined)
      fail('card-row-verdict', file, `${piece}: nativo, embrulhado or remendo`)
    else if (verdict === 'remendo' && !VERSION.test(row[table.proof] ?? ''))
      fail('card-remendo-version', file, `${piece}: the proof names no library version`)
  }
}

/** The problems of the method's own documents, one `name: file: detail` line each. */
export function methodProblems(texts: ReadonlyMap<string, string>): string[] {
  const problems: string[] = []
  const fail: Fail = (name, file, detail) => problems.push(`${name}: ${file}: ${detail}`)
  for (const [file, text] of texts) referenceRows(file, text, fail)
  ruleSentencesTwice(texts, fail)
  return problems
}
