// Defect: a connector double answers in a shape the real service never sends (testing T24, T29).
// The second step of `scripts/record-connector.ts`: a raw body kept in the operator's private folder
// becomes a recording that may enter the repository, every value replaced by an invented one of the
// same shape, the same real value always by the same invented one (security S40). Nango keeps the
// raw body and cleans nothing; the swap is our rule beyond theirs.
import { LEAK } from '../apps/server/src/platform/test-recordings.ts'

/** A place in the body, as dotted keys (`results.0.buyer.nickname`), the way the kit names a path. */
type Path = readonly string[]

const ANCHOR = Date.parse('2026-09-15T12:00:00.000Z')
const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/

/** Keys whose number is an identity or an amount: replaced. Paging counts and quantities stay. */
const NUMBER_KEY = /(^|_)id$|^id$|seller|buyer|number|price|amount|cost|fee|tax/i
/** Keys whose text is a person's, a seller's or a listing's own words: always replaced, whatever it looks like. */
const TEXT_KEY =
  /name|nick|title|text|email|phone|address|street|city|zip|permalink|thumbnail|picture|sku|seller_custom_field|document|number|comment|description|identification/i
/** Keys whose text names a state of the service, not a person or a thing: kept when it looks like a code. */
const CODE = /^[a-z][a-z0-9_]{0,40}$/
/** Keys whose text is an identity: replaced by one of the same shape. */
const ID_KEY = /(^|_)id$|^id$|scroll|seller|buyer/i

export type Swapped = Readonly<{ body: unknown; replaced: readonly string[]; path: string }>

/** The seller's own value in the route: the account the connection is for, so the path and the body agree. */
type Seed = Readonly<{ account: string; path: string }>

class Invented {
  private readonly known = new Map<string, string | number>()
  private next = 1
  readonly replaced = new Set<string>()

  /** The invented value for a real one: the same real value gives the same invented one. */
  of(value: string | number, key: string, at: Path): string | number {
    this.replaced.add(at.filter((part) => !/^\d+$/.test(part)).join('.'))
    const id = String(value)
    const kept = this.known.get(id)
    if (kept !== undefined) return typeof value === 'number' ? Number(kept) : String(kept)
    const made = this.make(value, key)
    this.known.set(id, made)
    return made
  }

  private make(value: string | number, key: string): string | number {
    const n = this.next++
    if (typeof value === 'number') {
      if (!Number.isInteger(value)) return Math.round((10 + n * 7.35) * 100) / 100
      const digits = String(Math.abs(value)).length
      return 2 * 10 ** (digits - 1) + n
    }
    if (ID_KEY.test(key)) {
      const prefix = value.replace(/[0-9].*$/, '').replace(/[^A-Za-z]/g, '')
      const width = Math.max(value.length - prefix.length, 6)
      return `${prefix.toUpperCase()}${String(n).padStart(width, '0')}`
    }
    return `Texto inventado ${n}`
  }
}

/** Every instant moved by one shift so the latest one is the anchor: the order and the gaps stay. */
function instantsOf(value: unknown, found: number[] = []): number[] {
  if (typeof value === 'string' && INSTANT.test(value)) found.push(Date.parse(value))
  else if (Array.isArray(value)) for (const item of value) instantsOf(item, found)
  else if (typeof value === 'object' && value !== null)
    for (const item of Object.values(value)) instantsOf(item, found)
  return found
}

/** The instant moved by `by`, written as it was: the same offset and the same fraction of a second. */
function shifted(value: string, by: number): string {
  const zone = /(Z|[+-]\d{2}:\d{2})$/.exec(value)?.[0] ?? 'Z'
  const sign = zone.startsWith('-') ? -1 : 1
  const minutes =
    zone === 'Z' ? 0 : sign * (Number(zone.slice(1, 3)) * 60 + Number(zone.slice(4, 6)))
  const wall = new Date(Date.parse(value) + by + minutes * 60_000).toISOString()
  return `${wall.slice(0, /\.\d+/.test(value) ? 23 : 19)}${zone}`
}

function walk(
  value: unknown,
  key: string,
  at: Path,
  a: Readonly<{ invented: Invented; by: number }>,
): unknown {
  if (Array.isArray(value)) return value.map((item, i) => walk(item, key, [...at, String(i)], a))
  if (typeof value === 'object' && value !== null)
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, walk(v, k, [...at, k], a)]))
  if (typeof value === 'number') return NUMBER_KEY.test(key) ? a.invented.of(value, key, at) : value
  if (typeof value !== 'string') return value
  if (INSTANT.test(value)) {
    a.invented.replaced.add(at.filter((part) => !/^\d+$/.test(part)).join('.'))
    return shifted(value, a.by)
  }
  if (!TEXT_KEY.test(key) && !ID_KEY.test(key) && CODE.test(value)) return value
  return a.invented.of(value, key, at)
}

/** What of the real body still stands in the swapped one: text with a digit run or a space that the swap kept. */
function survivors(raw: unknown, swapped: unknown): string[] {
  const real = new Set(stringsOf(raw).filter((text) => /\d{5,}| /.test(text)))
  return stringsOf(swapped).filter((text) => real.has(text))
}

function stringsOf(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (typeof value !== 'object' || value === null) return []
  return Object.values(value).flatMap(stringsOf)
}

/**
 * The raw body with every identity, name, text, amount and date replaced (dates moved together),
 * and the route's path with the account replaced. Throws when a real text survives or an address or
 * a credential's prefix is left (`LEAK`): nothing may be saved then.
 */
export function swapped(raw: Readonly<{ body: unknown } & Seed>): Swapped {
  const invented = new Invented()
  const latest = Math.max(...instantsOf(raw.body), ANCHOR)
  const by = ANCHOR - latest
  const body = walk(raw.body, '', [], { invented, by })
  const account = String(invented.of(Number(raw.account), 'seller', ['seller']))
  const path = raw.path.replaceAll(raw.account, account)
  const left = survivors(raw.body, body)
  if (left.length > 0)
    throw new Error(`The swap left ${left.length} real text(s); nothing is saved.`)
  if (LEAK.test(JSON.stringify(body)) || LEAK.test(path))
    throw new Error('The swapped body still carries a credential or an address; nothing is saved.')
  return { body, path, replaced: [...invented.replaced].sort() }
}
