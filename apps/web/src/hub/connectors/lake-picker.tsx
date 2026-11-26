import type { ConnectorEntry } from '@conexus/hub-api'
import { useId, useState } from 'react'
import { Checkbox } from '../../ui/checkbox.tsx'
import { FieldError } from '../../ui/field.tsx'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../ui/input-group.tsx'
import { SearchField } from '../../ui/search-field.tsx'
import type { Picks, Table } from './lake-pick.ts'
import { groupsOf, nameOf, prefixOf, shownPrefix, toggled, typed } from './lake-pick.ts'
import {
  columnsText,
  DICTIONARY_OUT,
  groupBoxText,
  LAKE_NAME,
  NO_TABLE_FOUND,
  SEARCH_TABLE,
} from './lake-text.ts'
import { modeText } from './lake-words.ts'

function NameField(props: {
  table: Table
  prefix: string
  picks: Picks
  refusal: string | null
  onPicks: (picks: Picks) => void
}) {
  const { table, picks } = props
  const id = useId()
  const shown = shownPrefix(props.prefix, table)
  const edited = picks.parts[table.source] !== undefined
  const refused = edited ? props.refusal : null
  return (
    <div className="flex min-w-0 flex-col gap-xs sm:max-w-column">
      <label htmlFor={id} className="text-eyebrow text-text-2">
        {LAKE_NAME}
      </label>
      <InputGroup aria-invalid={refused !== null}>
        {shown !== '' && (
          <InputGroupAddon className="font-mono text-base md:text-fact">{shown}</InputGroupAddon>
        )}
        <InputGroupInput
          id={id}
          className="font-mono text-base md:text-fact"
          autoComplete="off"
          aria-label={`${LAKE_NAME}: ${table.label}`}
          aria-invalid={refused !== null}
          value={nameOf(props.prefix, table, picks).slice(shown.length)}
          onChange={(event) => props.onPicks(typed(picks, table.source, event.target.value))}
        />
      </InputGroup>
      <FieldError>{refused ?? ''}</FieldError>
    </div>
  )
}

function Row(props: {
  table: Table
  prefix: string
  picks: Picks
  refusal: string | null
  onPicks: (picks: Picks) => void
}) {
  const { table, picks } = props
  const id = useId()
  const on = picks.marked.has(table.source)
  return (
    <li className="flex gap-md border-b border-line py-md last:border-b-0">
      <Checkbox
        id={id}
        aria-label={table.label}
        checked={on}
        onCheckedChange={(next) => props.onPicks(toggled(picks, [table.source], next))}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-xs">
        <div className="flex flex-wrap items-center gap-x-md gap-y-xs">
          <label htmlFor={id} className="font-medium">
            {table.label}
          </label>
          <span className="font-mono text-fact text-text-2">
            {table.source}
            {table.columns !== null && ` · ${columnsText(table.columns)}`}
          </span>
        </div>
        {table.description !== null && (
          <p className="max-w-message text-text-2">{table.description}</p>
        )}
        <p className="text-text-2">{modeText(table.mode)}</p>
        {on && <NameField {...props} />}
      </div>
    </li>
  )
}

/** A subject of the tables: its name over its rows, and, given `marks`, a box that marks them all and how many are marked. */
export function Group(props: {
  label: string
  marks?: { tables: Table[]; picks: Picks; onPicks: (picks: Picks) => void }
  children: React.ReactNode
}) {
  const { marks } = props
  const on = marks?.tables.filter((one) => marks.picks.marked.has(one.source)).length ?? 0
  const total = marks?.tables.length ?? 0
  return (
    <section aria-label={props.label} className="flex flex-col">
      <div className="flex h-row items-center gap-md border-b border-line">
        {marks && (
          <Checkbox
            aria-label={groupBoxText(props.label)}
            checked={on === total}
            indeterminate={on > 0 && on < total}
            onCheckedChange={(next) =>
              marks.onPicks(
                toggled(
                  marks.picks,
                  marks.tables.map((one) => one.source),
                  next,
                ),
              )
            }
          />
        )}
        <h3 className="font-display text-label">{props.label}</h3>
        {marks && (
          <span className="text-eyebrow tabular-nums text-text-2">
            {on} de {total}
          </span>
        )}
      </div>
      <ul className="flex flex-col">{props.children}</ul>
    </section>
  )
}

/**
 * The tables a connector offers to copy, by subject with the description in view and a box for each
 * and for the subject; a marked one shows the name it will have, which the person edits after the
 * prefix. The window and the section of the connection both choose through it.
 */
export function LakePicker(props: {
  entry: ConnectorEntry
  tables: readonly Table[]
  picks: Picks
  refusal: string | null
  search: boolean
  onPicks: (picks: Picks) => void
}) {
  const [query, setQuery] = useState('')
  const prefix = prefixOf(props.entry.id)
  const text = query.trim().toLowerCase()
  const found = props.tables.filter((one) =>
    `${one.label} ${one.source}`.toLowerCase().includes(text),
  )
  return (
    <div className="flex min-w-0 flex-col gap-md">
      {props.tables.length > 0 && props.tables.every((one) => one.columns === null) && (
        <p role="status" className="text-text-2">
          {DICTIONARY_OUT}
        </p>
      )}
      {props.search && <SearchField label={SEARCH_TABLE} value={query} onChange={setQuery} />}
      {found.length === 0 && <p className="text-text-2">{NO_TABLE_FOUND}</p>}
      {groupsOf(found, props.entry.subjects).map((group) => (
        <Group
          key={group.id}
          label={group.label}
          marks={{ tables: group.tables, picks: props.picks, onPicks: props.onPicks }}
        >
          {group.tables.map((table) => (
            <Row
              key={table.source}
              table={table}
              prefix={prefix}
              picks={props.picks}
              refusal={props.refusal}
              onPicks={props.onPicks}
            />
          ))}
        </Group>
      ))}
    </div>
  )
}
