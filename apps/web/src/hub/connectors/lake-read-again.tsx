import { AlertDialog, AlertDialogContent } from '../../ui/alert-dialog.tsx'
import { Button } from '../../ui/button.tsx'
import type { Table } from './lake-pick.ts'
import {
  CANCEL,
  LEAVE_CONFIRM,
  LEAVE_LEAD,
  leaveTitle,
  READ_AGAIN_CONFIRM,
  READ_AGAIN_LEAD,
  READ_AGAIN_OTHERS,
  readAgainEffectText,
  readAgainTitle,
} from './lake-text.ts'

/** The copied tables a start date limits: the ones "Ler de novo desde a data" replaces in the lake. */
export function readAgainTables(tables: readonly Table[]): Table[] {
  return tables.filter(
    (one) => one.copy.kind === 'MARKED' && one.limited && one.mode.kind !== 'FULL',
  )
}

type Row = { key: string; label: string; detail: string }

/**
 * A confirmation that lists what a write does to the lake, table by table, in one line each, and
 * that the others stay as they are. Cancelling asks the Hub for nothing.
 */
function TablesDialog(props: {
  open: boolean
  title: string
  lead: string
  rows: readonly Row[]
  confirm: string
  pending: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <AlertDialog open={props.open} onOpenChange={(open) => open || props.onCancel()}>
      <AlertDialogContent title={props.title} description={props.lead}>
        <ul className="flex flex-col">
          {props.rows.map((row) => (
            <li
              key={row.key}
              className="flex flex-col gap-xs border-b border-line py-sm first:border-t"
            >
              <span className="font-medium">{row.label}</span>
              <span className="text-text-2">{row.detail}</span>
            </li>
          ))}
        </ul>
        <p>{READ_AGAIN_OTHERS}</p>
        <div className="flex flex-wrap gap-md">
          <Button variant="danger-confirm" disabled={props.pending} onClick={props.onConfirm}>
            {props.confirm}
          </Button>
          <Button onClick={props.onCancel}>{CANCEL}</Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}

type Ask = { pending: boolean; onConfirm: () => void; onCancel: () => void }

/** "Ler de novo desde a data": what the lake trades in each table the date limits. */
export function ReadAgainDialog(
  props: Ask & { open: boolean; since: string; system: string; tables: readonly Table[] },
) {
  return (
    <TablesDialog
      {...props}
      title={readAgainTitle(props.since)}
      lead={READ_AGAIN_LEAD}
      confirm={READ_AGAIN_CONFIRM}
      rows={props.tables.map((table) => ({
        key: table.source,
        label: table.label,
        detail: readAgainEffectText(
          table.mode.kind === 'WINDOW' ? 'WINDOW' : 'CHANGED',
          props.system,
        ),
      }))}
    />
  )
}

/** "Salvar" with a table unmarked: the tables the lake drops, each with its name in the lake. */
export function LeaveDialog(props: Ask & { open: boolean; tables: readonly Table[] }) {
  return (
    <TablesDialog
      {...props}
      title={leaveTitle(props.tables.length)}
      lead={LEAVE_LEAD}
      confirm={LEAVE_CONFIRM}
      rows={props.tables.map((table) => ({
        key: table.source,
        label: table.label,
        detail: table.copy.kind === 'MARKED' ? table.copy.name : '',
      }))}
    />
  )
}
