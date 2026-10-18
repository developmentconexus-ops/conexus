import type { CompanyId, Project } from '@conexus/hub-api'
import { FAILURES } from '@conexus/hub-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { keepsAttemptKey } from '../../platform/attempt-key.ts'
import { HubFailure } from '../../platform/hub.ts'
import { AlertDialog, AlertDialogContent, AlertDialogTrigger } from '../../ui/alert-dialog.tsx'
import { Button } from '../../ui/button.tsx'
import { Form, FormAlert, setServerError, TextField, useSchemaForm } from '../../ui/form.tsx'
import { allProjectsQueryKey, projectQuery, sendProjectDeletion } from './queries.ts'

const UNCONFIRMED = 'Não confirmamos a exclusão. Veja a lista.'

/** The confirm button: off until the typed name is the Project's, so Enter cannot confirm without it. */
function Confirm({ ready, pending }: { ready: boolean; pending: boolean }) {
  return (
    <Button type="submit" variant="danger-confirm" disabled={!ready || pending}>
      {pending ? 'Apagando…' : 'Apagar Projeto'}
    </Button>
  )
}

function DeleteForm(props: { companyId: CompanyId; project: Project; onCancel: () => void }) {
  const { companyId, project } = props
  const router = useRouter()
  const queryClient = useQueryClient()
  const send = useMutation(sendProjectDeletion)
  const form = useSchemaForm(z.object({ name: z.literal(project.name) }), { name: '' })
  const ready = form.watch('name') === project.name

  // The Project is gone, deleted now or before: its page leaves, the list is read again.
  async function leave(notice?: 'deleted') {
    await queryClient.invalidateQueries({
      queryKey: allProjectsQueryKey(companyId),
      refetchType: 'all',
    })
    await router.navigate({
      to: '/companies/$companyId/projects',
      params: { companyId },
      search: { notice },
    })
    queryClient.removeQueries({ queryKey: projectQuery(companyId, project.id).queryKey })
  }

  async function submit({ name }: { name: string }) {
    try {
      await send.mutateAsync({ params: { companyId, projectId: project.id }, body: { name } })
      await leave('deleted')
    } catch (error) {
      if (!(error instanceof HubFailure)) setServerError(form, error)
      else if (error.code === 'NOT_FOUND') await leave()
      else if (error.code === 'PROJECT_NAME_MISMATCH') setServerError(form, error, 'name')
      else if (keepsAttemptKey(error))
        form.setError('root.server', { type: 'server', message: UNCONFIRMED })
      else setServerError(form, error)
    }
  }

  return (
    <Form form={form} onSubmit={submit}>
      <TextField
        name="name"
        label="Digite o nome do Projeto"
        type="text"
        autoComplete="off"
        invalid={FAILURES.PROJECT_NAME_MISMATCH.phrase}
      />
      <FormAlert />
      <Confirm ready={ready} pending={send.isPending} />
      <Button type="button" disabled={send.isPending} onClick={props.onCancel}>
        Cancelar
      </Button>
    </Form>
  )
}

/**
 * "Apagar Projeto": the person types the Project's name to confirm. Closing while it deletes does
 * not undo it.
 */
export function DeleteProjectDialog(props: { companyId: CompanyId; project: Project }) {
  const [open, setOpen] = useState(false)
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="danger" />}>Apagar Projeto</AlertDialogTrigger>
      <AlertDialogContent title={`Apagar ${props.project.name}?`} description="Isto não se desfaz.">
        <DeleteForm {...props} onCancel={() => setOpen(false)} />
      </AlertDialogContent>
    </AlertDialog>
  )
}
