import type { CompanyId, Connection, Revocation } from '@conexus/hub-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { writeFailureText } from '../../platform/hub.ts'
import { AlertDialog, AlertDialogContent } from '../../ui/alert-dialog.tsx'
import { Button } from '../../ui/button.tsx'
import { FieldError } from '../../ui/field.tsx'
import { connectionKeys, sendUnlink } from './queries.ts'

const UNCONFIRMED = 'Não confirmamos o desligamento. Veja a lista.'

// The connection is gone either way; these say that the provider still lists the Conexus as authorized.
const NOT_REVOKED: Partial<Record<Revocation, string>> = {
  REFUSED:
    'Desligamos aqui, mas o fornecedor não aceitou retirar a autorização do Conexus. Retire você mesmo na conta dele.',
  UNREACHABLE:
    'Desligamos aqui, mas não conseguimos avisar o fornecedor. Retire a autorização do Conexus na conta dele.',
  NOT_SENT:
    'Desligamos aqui, mas não conseguimos avisar o fornecedor. Retire a autorização do Conexus na conta dele.',
}

/**
 * "Desligar" asks by the connection's name: the Hub asks the provider to take the authorization back when it can, forgets the
 * keys it sealed, and the person is taken back to the list, where the connection is gone. When the
 * provider kept the authorization, the dialog says so first.
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
  const [kept, setKept] = useState<string | undefined>()

  function changeOpen(next: boolean) {
    send.reset()
    if (!next && kept !== undefined) void leave()
    props.onOpenChange(next)
  }

  async function leave() {
    await navigate({ to: '/companies/$companyId/integrations', params: { companyId } })
    for (const queryKey of connectionKeys(companyId, connection.id)) {
      void queryClient.invalidateQueries({ queryKey })
    }
  }

  function unlink() {
    send.mutate(
      { params: { companyId, connectionId: connection.id } },
      {
        onSuccess: async ({ revocation }) => {
          const text = NOT_REVOKED[revocation]
          if (text === undefined) await leave()
          else setKept(text)
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
        {kept === undefined ? null : <p role="status">{kept}</p>}
        <FieldError>
          {send.isError ? writeFailureText(send.error, UNCONFIRMED) : undefined}
        </FieldError>
        {kept === undefined ? (
          <div className="flex flex-wrap gap-md">
            <Button variant="danger-confirm" disabled={send.isPending} onClick={unlink}>
              {send.isPending ? 'Desligando…' : 'Desligar'}
            </Button>
            <Button disabled={send.isPending} onClick={() => changeOpen(false)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button onClick={() => void leave()}>Fechar</Button>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
