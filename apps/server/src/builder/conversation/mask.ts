const MASK = '***'

// What a command or its output may hold that must not reach the stream or the journal (security
// S2, S41): tokens by their shapes, the value after a flag that takes a password, and the value after
// a name that says it is a secret. The shapes go first, so `Authorization: Bearer x` loses the token.
// No shape masks a run of characters for its length alone: a commit, a tree, an `integrity` and a
// path are as long as a key and are what a person reads in the output. No reference does it either
// (Conexus OS `check/problems.ts:5-8`, Mastra `pii-detector.ts:245-246`). The machine holds no value
// the server knows (it is started with no environment), so there is none to replace by its exact value.
const SHAPES = [
  /\bBearer\s+[\w.~+/=-]{8,}/gi,
  /\b(?:sk|pk|rk|ghp|gho|ghu|ghs|ghr|github_pat|glpat|npm|xox[abpr]|e2b)[_-][\w-]{8,}/g,
  /\bAIza[\w-]{30,}/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\beyJ[\w-]{8,}\.[\w-]{8,}\.[\w-]*/g,
  /(?<=:\/\/[^\s:/@]+:)[^\s@/]+(?=@)/g,
]
const VALUE = `(?:"[^"]*"|'[^']*'|[^\\s;&|'"]+)`
// A flag that carries a password as its next word (`--password x`, `mysql -pS3nha`, `curl -u user:pass`)
// has no name before an equals sign, so it is matched by the command that takes it.
const FLAGS = [
  new RegExp(`(--(?:password|passwd|token|secret|api-key)\\s+)${VALUE}`, 'gi'),
  /(\bmysql(?:dump|admin)?\b[^|;&\n]*?\s-p)[^\s;&|'"]+/g,
  /(\bcurl\b[^|;&\n]*?\s(?:-u|--user)\s+[^\s:'"]+:)[^\s;&|'"]+/g,
]
const NAMED = new RegExp(
  `\\b([\\w.-]*(?:password|passwd|secret|token|api[_-]?key|authorization)[\\w.-]*\\s*[=:]\\s*|[\\w.-]*_pass\\s*[=:]\\s*)${VALUE}`,
  'gi',
)

/** The text with its secrets replaced by `***`. */
export function masked(text: string): string {
  let safe = text
  for (const shape of SHAPES) safe = safe.replace(shape, MASK)
  for (const flag of FLAGS) safe = safe.replace(flag, `$1${MASK}`)
  return safe.replace(NAMED, `$1${MASK}`)
}
