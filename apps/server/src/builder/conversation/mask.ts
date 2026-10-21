const MASK = '***'

// What a command or its output may hold that must not reach the stream or the journal (security
// S2, S41): tokens by their shapes, and the value after a name that says it is a secret.
const SHAPES = [
  /\bBearer\s+[\w.~+/=-]{8,}/gi,
  /\b(?:sk|pk|rk|ghp|gho|github_pat|xox[abp]|e2b)[_-][\w-]{8,}/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\beyJ[\w-]{8,}\.[\w-]{8,}\.[\w-]*/g,
  /(?<=:\/\/[^\s:/@]+:)[^\s@/]+(?=@)/g,
  /\b[A-Za-z0-9+/_-]{40,}={0,2}/g,
]
const NAMED =
  /\b([\w.-]*(?:password|passwd|secret|token|api[_-]?key|authorization)[\w.-]*\s*[=:]\s*)(?:"[^"]*"|'[^']*'|[^\s;&|]+)/gi

/** The text with its secrets replaced by `***`. */
export function masked(text: string): string {
  let safe = text.replace(NAMED, `$1${MASK}`)
  for (const shape of SHAPES) safe = safe.replace(shape, MASK)
  return safe
}
