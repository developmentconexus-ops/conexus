import { Badge } from '../../ui/badge.tsx'
import { Checkbox } from '../../ui/checkbox.tsx'
import type { Picks, Table } from './lake-pick.ts'
import {
  columnsText,
  NAME_FIXED,
  RUNNING,
  sinceOfTableText,
  UP_TO_DATE,
  WITH_ERROR,
} from './lake-text.ts'
import { modeText, runFailureText } from './lake-words.ts'

/** The state of a copied table in one word with its dot: running while the connection's round is open, else how its last one ended. */
function Status(props: { table: Table; running: boolean; system: string }) {
  const { copy } = props.table
  if (props.running) return <Badge>{RUNNING}</Badge>
  const run = copy.kind === 'MARKED' ? copy.lastRun : null
  if (run === null || run.outcome === 'INTERRUPTED') return null
  if (run.outcome === 'ERROR') {
    return (
      <span className="flex flex-col gap-xs">
        <Badge tone="danger">{WITH_ERROR}</Badge>
        <span className="text-text-2">{runFailureText(run.code, props.system)}</span>
      </span>
    )
  }
  return run.outcome === 'COMPLETE' ? <Badge tone="success">{UP_TO_DATE}</Badge> : null
}

export function CopiedRow(props: {
  table: Table
  picks: Picks
  since: string | null
  running: boolean
  system: string
  editable: boolean
  onPicks: (picks: Picks) => void
}) {
  const { table, picks } = props
  const name = table.copy.kind === 'MARKED' ? table.copy.name : ''
  return (
    <li className="flex gap-md border-b border-line py-md last:border-b-0">
      <Checkbox
        aria-label={table.label}
        checked={picks.marked.has(table.source)}
        disabled={!props.editable}
        onCheckedChange={(next) => {
          const marked = new Set(picks.marked)
          if (next) marked.add(table.source)
          else marked.delete(table.source)
          props.onPicks({ ...picks, marked })
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-xs">
        <div className="flex flex-wrap items-center gap-x-md gap-y-xs">
          <span className="font-medium">{table.label}</span>
          <span className="font-mono text-fact text-text-2">
            {table.source}
            {table.columns !== null && ` · ${columnsText(table.columns)}`}
          </span>
          <Status table={table} running={props.running} system={props.system} />
        </div>
        <p className="flex flex-col text-text-2 sm:flex-row sm:gap-x-md">
          <span>{modeText(table.mode)}</span>
          {table.limited && props.since !== null && (
            <span className="tabular-nums">{sinceOfTableText(props.since)}</span>
          )}
        </p>
        <p className="text-text-2">
          <span className="font-mono text-fact text-text">{name}</span> <span>· {NAME_FIXED}</span>
        </p>
      </div>
    </li>
  )
}
