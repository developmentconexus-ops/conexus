import type { Connection, CopySummary } from '@conexus/hub-api'
import { describedAs } from './copy-list.tsx'
import { folded } from './search.ts'
import { originOf } from './source.ts'

export type System = { connector: string; accounts: Set<string>; copies: CopySummary[] }

/** The company's systems: each connector a copy reads or an active connection links, with its connections' names and its copies. */
export function systemsOf(
  copies: readonly CopySummary[],
  connections: readonly Connection[],
): System[] {
  const found = new Map<string, System>()
  function system(connector: string): System {
    const known = found.get(connector)
    if (known !== undefined) return known
    const made = { connector, accounts: new Set<string>(), copies: [] }
    found.set(connector, made)
    return made
  }
  for (const copy of copies) {
    const one = system(originOf(copy).connector)
    one.copies.push(copy)
    for (const name of originOf(copy).accounts) one.accounts.add(name)
  }
  for (const connection of connections) {
    if (connection.state === 'ACTIVE') system(connection.connector).accounts.add(connection.name)
  }
  return [...found.values()]
}

/** Whether a copy answers the search: its name, its description or the name of one of its columns. */
function answers(copy: CopySummary, query: string): boolean {
  const needle = folded(query.trim())
  const fields = [copy.name, describedAs(copy), ...copy.shown.columns.map((column) => column.name)]
  return fields.some((field) => folded(field).includes(needle))
}

/** The systems as the search leaves them: only the copies that answer it, and a system with none is gone. No search leaves them all. */
export function narrowed(systems: readonly System[], q: string | undefined): System[] {
  const query = q?.trim() ?? ''
  if (query === '') return [...systems]
  return systems
    .map((system) => ({ ...system, copies: system.copies.filter((copy) => answers(copy, query)) }))
    .filter((system) => system.copies.length > 0)
}
