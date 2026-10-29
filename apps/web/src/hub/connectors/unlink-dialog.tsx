import type { CompanyId, Connection } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { writeFailureText } from '../../platform/hub.ts'
import { AlertDialog, AlertDialogContent, AlertDialogTrigger } from '../../ui/alert-dialog.tsx'
import { Button } from '../../ui/button.tsx'
import { FieldError } from '../../ui/field.tsx'
import { sendUnlink } from './queries.ts'

const UNCONFIRMED = 'Não confirmamos o desligamento. Veja a lista.'

/**
 * "Desligar": the Hub forgets the keys it sealed. The row is gone once it is unlinked, so the page
 * is told (`onUnlinked`) to put focus on its list and not on the button the row leaves.
 */
export function UnlinkDialog(props: {
  companyId: CompanyId
  connection: Connection
  name: string
  onUnlinked: () => void
}) {
  const [open, setOpen] = useState(false)
  const send = useMutation(sendUnlink)

  function changeOpen(next: boolean) {
    send.reset()
    setOpen(next)
  }

  function unlink() {
    send.mutate(
      { params: { companyId: props.companyId, connectionId: props.connection.id } },
      {
        onSuccess: () => {
          setOpen(false)
          props.onUnlinked()
        },
      },
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={changeOpen}>
      <AlertDialogTrigger render={<Button variant="danger" />}>Desligar</AlertDialogTrigger>
      <AlertDialogContent
        title={`Desligar o ${props.name}?`}
        description="O Conexus apaga as chaves que guardou."
      >
        <FieldError>
          {send.isError ? writeFailureText(send.error, UNCONFIRMED) : undefined}
        </FieldError>
        <div className="flex flex-wrap gap-md">
          <Button variant="danger-confirm" disabled={send.isPending} onClick={unlink}>
            {send.isPending ? 'Desligando…' : 'Desligar'}
          </Button>
          <Button disabled={send.isPending} onClick={() => changeOpen(false)}>
            Cancelar
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
