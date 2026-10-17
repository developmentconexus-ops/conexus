import type { Client } from '@conexus/hub-api'
import { FAILURES } from '@conexus/hub-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { HubFailure } from '../../platform/hub.ts'
import { AlertDialog, AlertDialogContent, AlertDialogTrigger } from '../../ui/alert-dialog.tsx'
import { Button } from '../../ui/button.tsx'
import { Form, FormAlert, setServerError, TextField, useSchemaForm } from '../../ui/form.tsx'
import { undecided } from './client-fields.tsx'
import { allClientsQueryKey, clientQuery, sendDeletion } from './queries.ts'

const UNCONFIRMED = 'Não confirmamos a exclusão. Veja a lista antes de tentar de novo.'
const LOST =
  'Saem a empresa, os membros, os convites e o cadastro. As pessoas continuam com as contas delas.'

/** The confirm button: off until the typed name is the client's, so Enter cannot confirm without it. */
function Confirm({ ready, pending }: { ready: boolean; pending: boolean }) {
  return (
    <Button type="submit" variant="danger-confirm" disabled={!ready || pending}>
      {pending ? 'Apagando…' : 'Apagar cliente'}
    </Button>
  )
}

function DeleteForm({ client, onCancel }: { client: Client; onCancel: () => void }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const send = useMutation(sendDeletion)
  const form = useSchemaForm(z.object({ name: z.literal(client.name) }), { name: '' })
  const ready = form.watch('name') === client.name

  // The client is gone, deleted now or before: its page leaves, the list is read again (step 5).
  async function leave(notice: 'deleted' | 'gone') {
    await queryClient.invalidateQueries({ queryKey: allClientsQueryKey, refetchType: 'all' })
    await router.navigate({ to: '/operations/clients', search: { notice } })
    queryClient.removeQueries({ queryKey: clientQuery(client.companyId).queryKey })
  }

  async function submit({ name }: { name: string }) {
    const body = { name, revision: client.revision }
    try {
      await send.mutateAsync({ params: { companyId: client.companyId }, body })
      await leave('deleted')
    } catch (error) {
      if (undecided(error)) form.setError('root.server', { type: 'server', message: UNCONFIRMED })
      else if (!(error instanceof HubFailure)) setServerError(form, error)
      else if (error.code === 'NOT_FOUND') await leave('gone')
      else if (error.code === 'CLIENT_NAME_MISMATCH') setServerError(form, error, 'name')
      else if (error.code === 'CLIENT_STALE') {
        form.setError('root.server', { type: 'server', message: FAILURES.CLIENT_STALE.phrase })
        await queryClient.invalidateQueries({ queryKey: clientQuery(client.companyId).queryKey })
      } else setServerError(form, error)
    }
  }

  return (
    <Form form={form} onSubmit={submit}>
      <TextField
        name="name"
        label="Digite o nome do cliente"
        type="text"
        autoComplete="off"
        invalid="O nome não confere."
      />
      <FormAlert />
      <Confirm ready={ready} pending={send.isPending} />
      <Button type="button" disabled={send.isPending} onClick={onCancel}>
        Cancelar
      </Button>
    </Form>
  )
}

/**
 * "Apagar cliente": the operator types the client's name to confirm, and the Hub deletes it at the
 * revision this page read (code C38). Closing while it deletes does not undo it.
 */
export function DeleteClientDialog({ client }: { client: Client }) {
  const [open, setOpen] = useState(false)
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="danger" />}>Apagar cliente</AlertDialogTrigger>
      <AlertDialogContent title={`Apagar ${client.name}?`} description={LOST}>
        <DeleteForm client={client} onCancel={() => setOpen(false)} />
      </AlertDialogContent>
    </AlertDialog>
  )
}
