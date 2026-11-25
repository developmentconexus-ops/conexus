import { AlertDialog, AlertDialogContent } from '../../ui/alert-dialog.tsx'
import { Button } from '../../ui/button.tsx'
import type { Table } from './lake-pick.ts'
import {
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

/**
 * The confirmation of "Ler de novo desde a data": what the lake trades, table by table, in one
 * line each, and that the others stay as they are. Cancelling asks the Hub for nothing.
 */
export function ReadAgainDialog(props: {
  open: boolean
  since: string
  system: string
  tables: readonly Table[]
  pending: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <AlertDialog open={props.open} onOpenChange={(open) => open || props.onCancel()}>
      <AlertDialogContent title={readAgainTitle(props.since)} description={READ_AGAIN_LEAD}>
        <ul className="flex flex-col">
          {props.tables.map((table) => (
            <li
              key={table.source}
              className="flex flex-col gap-xs border-b border-line py-sm first:border-t"
            >
              <span className="font-medium">{table.label}</span>
              <span className="text-text-2">
                {readAgainEffectText(
                  table.mode.kind === 'WINDOW' ? 'WINDOW' : 'CHANGED',
                  props.system,
                )}
              </span>
            </li>
          ))}
        </ul>
        <p>{READ_AGAIN_OTHERS}</p>
        <div className="flex flex-wrap gap-md">
          <Button variant="danger-confirm" disabled={props.pending} onClick={props.onConfirm}>
            {READ_AGAIN_CONFIRM}
          </Button>
          <Button onClick={props.onCancel}>Cancelar</Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
