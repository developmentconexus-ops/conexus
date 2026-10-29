import type { CompanyId, Connection } from '@conexus/hub-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { writeFailureText } from '../../platform/hub.ts'
import { AlertDialog, AlertDialogContent } from '../../ui/alert-dialog.tsx'
import { Button } from '../../ui/button.tsx'
import { FieldError } from '../../ui/field.tsx'
import { connectionKeys, sendUnlink } from './queries.ts'

const UNCONFIRMED = 'Não confirmamos o desligamento. Veja a lista.'

/**
 * "Desligar" asks by the connection's name: the Hub forgets the keys it sealed, and the person is
 * taken back to the list, where the connection is gone.
 */
export function UnlinkDialog(props: {
  companyId: CompanyId
  connection: Connection
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { companyId, connection } = props
  const send = useMutation(sendUnlink)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  function changeOpen(next: boolean) {
    send.reset()
    props.onOpenChange(next)
  }

  function unlink() {
    send.mutate(
      { params: { companyId, connectionId: connection.id } },
      {
        onSuccess: async () => {
          await navigate({ to: '/companies/$companyId/integrations', params: { companyId } })
          for (const queryKey of connectionKeys(companyId, connection.id)) {
            void queryClient.invalidateQueries({ queryKey })
          }
        },
      },
    )
  }

  return (
    <AlertDialog open={props.open} onOpenChange={changeOpen}>
      <AlertDialogContent
        title={`Desligar ${connection.name}?`}
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
