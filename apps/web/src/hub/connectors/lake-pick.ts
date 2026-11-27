import type {
  ConnectorEntry,
  LakeFullPass,
  LakeInterval,
  LakeTablesOfConnection,
  SetLakeCopy,
} from '@conexus/hub-api'

export type Table = LakeTablesOfConnection['tables'][number]
/** A table the lake already copies: its name in the lake is fixed. */
export type MarkedTable = Table & { copy: Extract<Table['copy'], { kind: 'MARKED' }> }

export function isMarked(table: Table): table is MarkedTable {
  return table.copy.kind === 'MARKED'
}

/** What the person marked in the picker, and the part of each name after the prefix that they typed. */
export type Picks = {
  marked: ReadonlySet<string>
  parts: Readonly<Record<string, string>>
}

export const NO_PICKS: Picks = { marked: new Set(), parts: {} }

/** The connector's prefix of every lake name: its id with `-` as `_` (`mercado-livre` gives `mercado_livre_`). */
export function prefixOf(connector: string): string {
  return `${connector.replaceAll('-', '_')}_`
}

/** The part a name has after the prefix; a name that does not start with it is edited whole. */
function partOf(prefix: string, name: string): string {
  return name.startsWith(prefix) ? name.slice(prefix.length) : name
}

/** The prefix a name shows beside its field: none when the Hub's suggestion does not start with it. */
export function shownPrefix(prefix: string, table: Table): string {
  return table.copy.kind === 'UNMARKED' && !table.copy.suggested.startsWith(prefix) ? '' : prefix
}

/** The lake name of a table as the picks leave it: the fixed one of a copied table, else prefix and part. */
export function nameOf(prefix: string, table: Table, picks: Picks): string {
  if (table.copy.kind === 'MARKED') return table.copy.name
  const shown = shownPrefix(prefix, table)
  return `${shown}${picks.parts[table.source] ?? partOf(shown, table.copy.suggested)}`
}

export function toggled(picks: Picks, sources: readonly string[], on: boolean): Picks {
  const marked = new Set(picks.marked)
  for (const source of sources) {
    if (on) marked.add(source)
    else marked.delete(source)
  }
  return { ...picks, marked }
}

export function typed(picks: Picks, source: string, part: string): Picks {
  return { ...picks, parts: { ...picks.parts, [source]: part } }
}

/** The picks a connection that is already copied starts from: its copied tables, marked. */
export function picksOfCopied(tables: readonly Table[]): Picks {
  return {
    marked: new Set(tables.filter((one) => one.copy.kind === 'MARKED').map((one) => one.source)),
    parts: {},
  }
}

/** The tables under their subject, in the kit's order; the subject is named by the connector's own list. */
export function groupsOf(
  tables: readonly Table[],
  subjects: ConnectorEntry['subjects'],
): { id: string; label: string; tables: Table[] }[] {
  const groups = new Map<string, Table[]>()
  for (const table of tables) groups.set(table.group, [...(groups.get(table.group) ?? []), table])
  return [...groups].map(([id, own]) => ({
    id,
    label: subjects.find((one) => one.id === id)?.label ?? id,
    tables: own,
  }))
}

/** How many marked tables the date limits; with no date, none. */
export function limitedCount(tables: readonly Table[], picks: Picks, since: string): number {
  if (since === '') return 0
  return tables.filter((one) => picks.marked.has(one.source) && one.limited).length
}

/** Today in the person's own zone, as the `YYYY-MM-DD` the date field reads. */
function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

/** A date after today, which the Hub refuses; the field is empty or a whole day. */
export function isFuture(since: string): boolean {
  return since !== '' && since > todayIso()
}

export function copyBody(args: {
  prefix: string
  tables: readonly Table[]
  picks: Picks
  interval: LakeInterval
  since: string
  fullPass: LakeFullPass
}): SetLakeCopy {
  return {
    tables: args.tables
      .filter((one) => args.picks.marked.has(one.source))
      .map((one) => ({ source: one.source, name: nameOf(args.prefix, one, args.picks) })),
    interval: args.interval,
    startDate: args.since === '' ? null : args.since,
    fullPass: args.fullPass,
  }
}
