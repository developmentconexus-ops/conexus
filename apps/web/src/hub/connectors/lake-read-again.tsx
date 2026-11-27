import { AlertDialog, AlertDialogContent } from '../../ui/alert-dialog.tsx'
import { Button } from '../../ui/button.tsx'
import type { MarkedTable } from './lake-pick.ts'
import {
  CANCEL,
  LEAVE_CONFIRM,
  LEAVE_LEAD,
  leaveTitle,
  OTHERS_STAY,
  READ_AGAIN_CONFIRM,
  READ_AGAIN_TITLE,
  readAgainLead,
  STOP_COPY,
  STOP_LEAD,
  STOP_OTHERS,
  STOP_TITLE,
  stopFirstLoadLead,
} from './lake-text.ts'

type Row = { key: string; label: string; detail: string; fact: boolean }

function namedRow(table: MarkedTable): Row {
  return { key: table.source, label: table.label, detail: table.copy.name, fact: true }
}

/**
 * A confirmation that lists what a write does to the lake, table by table, in one line each, and
 * what happens to the others. Cancelling asks the Hub for nothing.
 */
function TablesDialog(props: {
  open: boolean
  title: string
  lead: string
  rows: readonly Row[]
  others: string | null
  confirm: string
  pending: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <AlertDialog open={props.open} onOpenChange={(open) => open || props.onCancel()}>
      <AlertDialogContent title={props.title} description={props.lead}>
        {props.rows.length > 0 && (
          <ul className="flex flex-col">
            {props.rows.map((row) => (
              <li
                key={row.key}
                className="flex flex-col gap-xs border-b border-line py-sm first:border-t"
              >
                <span className="font-medium">{row.label}</span>
                <span className={row.fact ? 'font-mono text-fact text-text-2' : 'text-text-2'}>
                  {row.detail}
                </span>
              </li>
            ))}
          </ul>
        )}
        {props.others !== null && <p>{props.others}</p>}
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

export function ReadAgainDialog(
  props: Ask & { open: boolean; system: string; tables: readonly MarkedTable[] },
) {
  return (
    <TablesDialog
      {...props}
      title={READ_AGAIN_TITLE}
      lead={readAgainLead(props.system)}
      confirm={READ_AGAIN_CONFIRM}
      others={null}
      rows={props.tables.map(namedRow)}
    />
  )
}

/** "Salvar" with a table unmarked: the tables the lake drops, each with its name in the lake. */
export function LeaveDialog(props: Ask & { open: boolean; tables: readonly MarkedTable[] }) {
  return (
    <TablesDialog
      {...props}
      title={leaveTitle(props.tables.length)}
      lead={LEAVE_LEAD}
      confirm={LEAVE_CONFIRM}
      others={OTHERS_STAY}
      rows={props.tables.map(namedRow)}
    />
  )
}

/** "Parar cópia": the tables still on their first load are named, since the next copy reads them from zero. */
export function StopDialog(props: Ask & { open: boolean; tables: readonly MarkedTable[] }) {
  const first = props.tables.filter((table) => table.copy.firstLoad)
  return (
    <TablesDialog
      {...props}
      title={STOP_TITLE}
      lead={first.length === 0 ? STOP_LEAD : stopFirstLoadLead(first.length)}
      confirm={STOP_COPY}
      others={first.length > 0 && first.length < props.tables.length ? STOP_OTHERS : null}
      rows={first.map(namedRow)}
    />
  )
}
