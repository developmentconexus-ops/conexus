import type { CompanyId, Connection, Revocation } from '@conexus/hub-api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { HubFailure, sentenceOf, unconfirmedText, writeFailureText } from '../../platform/hub.ts'
import { AlertDialog, AlertDialogContent } from '../../ui/alert-dialog.tsx'
import { Button } from '../../ui/button.tsx'
import { FieldError } from '../../ui/field.tsx'
import { connectionCopiesQuery, connectionKeys, sendUnlink } from './queries.ts'
import { COPIES_UNREAD, copyLossText, notBackText, tableLeftText } from './text.ts'

const UNCONFIRMED = unconfirmedText('o desligamento', 'Veja a lista.')

// The connection is gone either way; these say that the provider still lists the Conexus as authorized.
const NOT_REVOKED: Partial<Record<Revocation, string>> = {
  REFUSED:
    'Desligamos aqui, mas o fornecedor não aceitou retirar a autorização do Conexus. Retire você mesmo na conta dele.',
  UNREACHABLE:
    'Desligamos aqui, mas não conseguimos avisar o fornecedor. Retire a autorização do Conexus na conta dele.',
  NOT_SENT:
    'Desligamos aqui, mas não conseguimos avisar o fornecedor. Retire a autorização do Conexus na conta dele.',
}

/** A refusal of Desligar: the company's database silent before anything left the Hub says so, and the connection stays. */
function unlinkFailureText(error: unknown): string {
  if (error instanceof HubFailure && error.code === 'COPY_DATABASE_UNAVAILABLE')
    return sentenceOf(error)
  return writeFailureText(error, UNCONFIRMED)
}

/** What Desligar takes from the copies that read the connection, read when the dialog opens. */
function CopiesLost(props: { read: ReturnType<typeof useCopiesRead>; connectorName: string }) {
  const { read } = props
  if (read.isError) return <p>{COPIES_UNREAD}</p>
  if (read.data === undefined || read.data.copies.length === 0) return null
  const { copies } = read.data
  const changes = copies.some((copy) => copy.mode.kind === 'CHANGES')
  return (
    <ul aria-label="O que some" className="flex min-w-0 flex-col gap-xs">
      {copies.map((copy) => (
        <li key={copy.copyId} className="break-words">
          {copyLossText(copy)}
        </li>
      ))}
      {changes && <li className="break-words">{notBackText(props.connectorName)}</li>}
    </ul>
  )
}

function useCopiesRead(companyId: CompanyId, connection: Connection, open: boolean) {
  return useQuery({ ...connectionCopiesQuery(companyId, connection.id), enabled: open })
}

/**
 * "Desligar" asks by the connection's name and says first what leaves the copies that read it (the
 * account's rows, or the whole copy of which it is the last source): the button waits for that read
 * to arrive or fail. The Hub takes the rows out, asks the provider to take the authorization back when
 * it can, forgets the keys it sealed, and the person is taken back to the list, where the connection
 * is gone. When the provider kept the authorization, or a copy's table was left in the company's
 * database, the dialog says so first.
 */
export function UnlinkDialog(props: {
  companyId: CompanyId
  connection: Connection
  connectorName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { companyId, connection } = props
  const copies = useCopiesRead(companyId, connection, props.open)
  const send = useMutation(sendUnlink)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [kept, setKept] = useState<string[] | undefined>()

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
        onSuccess: async ({ revocation, tablesLeft }) => {
          const texts = [...tablesLeft.map(tableLeftText), NOT_REVOKED[revocation]].filter(
            (text) => text !== undefined,
          )
          if (texts.length === 0) await leave()
          else setKept(texts)
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
        {kept === undefined ? (
          <CopiesLost read={copies} connectorName={props.connectorName} />
        ) : (
          kept.map((text) => (
            <p key={text} role="status" className="break-words">
              {text}
            </p>
          ))
        )}
        <FieldError>{send.isError ? unlinkFailureText(send.error) : undefined}</FieldError>
        {kept === undefined ? (
          <div className="flex flex-wrap gap-md">
            <Button
              variant="danger-confirm"
              disabled={send.isPending || copies.isPending}
              onClick={unlink}
            >
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
