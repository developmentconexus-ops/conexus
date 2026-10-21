// Defect: the method states one rule's sentence in two guides, or a step card's table of parts
// loses the column that says how the references do each mechanism, or folds hand-written code into
// an "o resto" row that no reference answers (delivery L24). Founder, 2026-10-21: "1. Sim".
// Refusals are proved by planting each one in check-docs.test.ts.
// Revalidate by 2027-04-21, or when the card template's table of parts changes.

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

const MECHANISMS_HEADER =
  /^\| Mecanismo \|.*\| Como Mastra, vibesdk e Conexus OS fazem, `file:line` \|$/m

function mechanisms(file: string, text: string, fail: Fail) {
  if (!/^docs\/steps\/[^/]+\.md$/.test(file)) return
  if (!MECHANISMS_HEADER.test(text)) {
    fail('card-without-references', file, 'no table of mechanisms with its reference column')
  }
  for (const line of withoutFences(text).split('\n')) {
    const cell = line.startsWith('|') ? (line.split('|')[1] ?? '').trim() : ''
    if (/^o resto$/i.test(cell)) fail('card-rest-row', file, line)
  }
}

/** The problems of the method's own documents, one `name: file: detail` line each. */
export function methodProblems(texts: ReadonlyMap<string, string>): string[] {
  const problems: string[] = []
  const fail: Fail = (name, file, detail) => problems.push(`${name}: ${file}: ${detail}`)
  for (const [file, text] of texts) mechanisms(file, text, fail)
  ruleSentencesTwice(texts, fail)
  return problems
}
