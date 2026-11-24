import type { ComponentProps, ReactNode } from 'react'
import { AlertDialog, AlertDialogContent } from '../../ui/alert-dialog.tsx'
import { Button } from '../../ui/button.tsx'
import { FieldError } from '../../ui/field.tsx'
import { refusalText } from './text.ts'

type Write = { isPending: boolean; isError: boolean; error: unknown; reset: () => void }

/**
 * A confirmation on one account, opened from its menu: what it asks, the write's refusal, and the
 * two buttons that answer it. A removal is the menu's danger text, and full danger only here (design V55).
 */
export function AccountDialog(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  danger: boolean
  /** Where focus lands on closing: the menu's "…", which the menu item that opened this has left. */
  finalFocus: ComponentProps<typeof AlertDialogContent>['finalFocus']
  title: string
  description: string
  confirm: { label: string; pending: string }
  write: Write
  onConfirm: () => void
  children?: ReactNode
}) {
  const { write } = props
  function changeOpen(open: boolean) {
    write.reset()
    props.onOpenChange(open)
  }
  return (
    <AlertDialog open={props.open} onOpenChange={changeOpen}>
      <AlertDialogContent
        title={props.title}
        description={props.description}
        finalFocus={props.finalFocus}
      >
        {props.children}
        <FieldError>{write.isError ? refusalText(write.error) : undefined}</FieldError>
        <div className="flex flex-wrap gap-md">
          <Button
            variant={props.danger ? 'danger-confirm' : 'primary'}
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
