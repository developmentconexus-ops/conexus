// Defect: a Python dependency of apps/extraction (decision 0074) has no row in the stack map, or the
// check cannot read the pyproject.toml it sits in. check-docs.ts asks this file for the names.
// Reads only what PEP 621 and PEP 735 put in arrays of strings: [project] dependencies,
// [project.optional-dependencies] and [dependency-groups]. Any other shape of those entries is
// refused as `stack-python-unread`, never skipped. Refusals are proved in check-docs-stack.test.ts.
// Revalidate by 2027-04-13, or when apps/extraction moves its dependencies out of these tables.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export const PYTHON_PROJECT = 'apps/extraction/pyproject.toml'

const DEPENDENCY_TABLES = /^(project\.optional-dependencies|dependency-groups)$/
const REQUIREMENT_NAME = /^([A-Za-z0-9][A-Za-z0-9._-]*)/
const QUOTED = /"(?:[^"\\]|\\.)*"|'[^']*'/

/** PEP 503: the name a package index and a row of the stack map agree on. */
function normalized(name: string): string {
  return name.toLowerCase().replace(/[-_.]+/g, '-')
}

function withoutComment(line: string): string {
  return line.replace(
    new RegExp(`(${QUOTED.source})|#.*$`, 'g'),
    (_, quoted?: string) => quoted ?? '',
  )
}

/** The text under each table heading, comments gone. */
function tables(text: string): Map<string, string> {
  const found = new Map<string, string>()
  let name = ''
  for (const raw of text.split('\n')) {
    const line = withoutComment(raw)
    const heading = line.trim().match(/^\[([^[\]]+)\]$/)
    if (heading === null) found.set(name, `${found.get(name) ?? ''}${line}\n`)
    else name = (heading[1] ?? '').trim()
  }
  return found
}

/** The index just past the `]` that closes the array opening at `start`, quotes read as strings. */
function arrayEnd(text: string, start: number): number {
  let depth = 0
  let at = start
  while (at < text.length) {
    const quoted = text.slice(at).match(new RegExp(`^${QUOTED.source}`))?.[0]
    if (quoted !== undefined) at += quoted.length
    else {
      depth += text[at] === '[' ? 1 : text[at] === ']' ? -1 : 0
      at += 1
      if (depth === 0) return at
    }
  }
  return text.length
}

/** Each `key = value` of a table body; an array value runs to its closing bracket. */
function entries(body: string): [string, string][] {
  const found: [string, string][] = []
  for (const match of body.matchAll(/^([A-Za-z0-9_-]+)\s*=\s*/gm)) {
    const start = match.index + match[0].length
    const end = body[start] === '[' ? arrayEnd(body, start) : body.indexOf('\n', start)
    found.push([match[1] ?? '', body.slice(start, end === -1 ? body.length : end).trim()])
  }
  return found
}

/** The strings of a TOML array of strings, or undefined when the value is anything else. */
function stringsOf(value: string): string[] | undefined {
  if (!value.startsWith('[') || !value.endsWith(']')) return undefined
  const items = value.slice(1, -1).trim()
  const found = [...items.matchAll(new RegExp(`\\s*(${QUOTED.source})\\s*(?:,|$)`, 'g'))]
  const consumed = found.reduce((total, match) => total + match[0].length, 0)
  if (consumed !== items.length) return undefined
  return found.map((match) => (match[1] ?? '').slice(1, -1))
}

/** The requirement names of one table of the file, and the entries it cannot read. */
function tableNames(table: string, body: string): { names: string[]; unread: string[] } {
  const names: string[] = []
  const unread: string[] = []
  for (const [key, value] of entries(body)) {
    if (table === 'project' && key !== 'dependencies') continue
    const read = stringsOf(value)?.map((item) => item.match(REQUIREMENT_NAME)?.[1])
    if (read === undefined || read.includes(undefined)) unread.push(`${table}.${key}`)
    else names.push(...read.map((name) => normalized(name ?? '')))
  }
  return { names, unread }
}

/** The names a pyproject.toml declares, normalized, and the entries the check cannot read. */
export function pythonDependencies(root: string): { names: string[]; unread: string[] } {
  const path = join(root, PYTHON_PROJECT)
  if (!existsSync(path)) return { names: [], unread: [] }
  const read = [...tables(readFileSync(path, 'utf8'))]
    .filter(([table]) => table === 'project' || DEPENDENCY_TABLES.test(table))
    .map(([table, body]) => tableNames(table, body))
  return { names: read.flatMap((each) => each.names), unread: read.flatMap((each) => each.unread) }
}
