import type { ReactNode } from 'react'
import { AlertDialog, AlertDialogContent, AlertDialogTrigger } from '../../ui/alert-dialog.tsx'
import { Button } from '../../ui/button.tsx'
import { refusalText } from './text.ts'

type Write = { isPending: boolean; isError: boolean; error: unknown; reset: () => void }

/**
 * A confirmation on one account: what it asks, the write's refusal, and the two buttons that answer
 * it. A removal is the page's neutral danger button, and full danger only here (design V55).
 */
export function AccountDialog(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: { label: string; name: string; danger: boolean }
  title: string
  description: string
  confirm: { label: string; pending: string }
  write: Write
  onConfirm: () => void
  children?: ReactNode
}) {
  const { write, trigger } = props
  function changeOpen(open: boolean) {
    write.reset()
    props.onOpenChange(open)
  }
  return (
    <AlertDialog open={props.open} onOpenChange={changeOpen}>
      <AlertDialogTrigger
        render={
          <Button variant={trigger.danger ? 'danger' : 'default'} aria-label={trigger.name} />
        }
      >
        {trigger.label}
      </AlertDialogTrigger>
      <AlertDialogContent title={props.title} description={props.description}>
        {props.children}
        {write.isError && (
          <p role="alert" className="text-danger">
            {refusalText(write.error)}
          </p>
        )}
        <div className="flex flex-wrap gap-md">
          <Button
            variant={trigger.danger ? 'danger-confirm' : 'primary'}
            disabled={write.isPending}
            onClick={props.onConfirm}
          >
            {write.isPending ? props.confirm.pending : props.confirm.label}
          </Button>
          <Button disabled={write.isPending} onClick={() => changeOpen(false)}>
            Cancelar
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
