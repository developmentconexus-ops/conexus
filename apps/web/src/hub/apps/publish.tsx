import type { CompanyId, Project, ProjectId } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { UploadIcon } from 'lucide-react'
import { useState } from 'react'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { AlertDialog, AlertDialogContent, AlertDialogTrigger } from '../../ui/alert-dialog.tsx'
import { Button } from '../../ui/button.tsx'
import { RequestPublish } from '../requests/public.ts'
import { publishVersion } from './queries.ts'

/**
 * Publicar: after a confirmation, who opens the app sees this version; the Prévia stays. A refusal
 * the list explains closes the dialog and reads the Projeto again; it leaves through `onChanged`,
 * because the row may be gone when the list is read again. Who does not publish (`mayPublish`) is
 * offered **Pedir para publicar** instead, and nothing while a request is open. Who does publish
 * decides an open request in its line, so the top line leaves **Publicar** out while one is open.
 */
export function Publish(
  props: PublishProps & { project: Pick<Project, 'mayPublish' | 'publishRequest'> },
) {
  const { project, ...rest } = props
  if (project.mayPublish) {
    if (project.publishRequest !== null && rest.label === 'Publicar') return null
    return <PublishNow {...rest} />
  }
  if (project.publishRequest !== null) return null
  return (
    <RequestPublish
      companyId={rest.companyId}
      projectId={rest.projectId}
      number={rest.number}
      label={rest.label === 'Publicar' ? 'Pedir para publicar' : 'Pedir esta'}
      onChanged={rest.onChanged}
    />
  )
}

type PublishProps = {
  companyId: CompanyId
  projectId: ProjectId
  number: number
  label: 'Publicar' | 'Publicar esta'
  onChanged: (message?: string) => void
}

function PublishNow(props: PublishProps) {
  const { companyId, projectId, number, label } = props
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const publish = useMutation(publishVersion)

  async function confirm() {
    try {
      await publish.mutateAsync({ params: { companyId, projectId }, body: { number } })
      setOpen(false)
    } catch (error) {
      if (!(error instanceof HubFailure)) return
      if (error.code === 'NOT_FOUND') await router.invalidate()
      else if (error.code === 'APP_VERSION_NOT_FOUND') {
        setOpen(false)
        props.onChanged(sentenceOf(error))
      }
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          publish.reset()
          props.onChanged()
        }
        setOpen(next)
      }}
    >
      <AlertDialogTrigger
        render={
          label === 'Publicar' ? (
            <Button variant="primary" phoneIcon aria-label="Publicar" />
          ) : (
            <Button />
          )
        }
      >
        {label === 'Publicar' ? (
          <>
            <UploadIcon className="md:hidden" aria-hidden="true" />
            <span className="max-md:hidden">Publicar</span>
          </>
        ) : (
          label
        )}
      </AlertDialogTrigger>
      <AlertDialogContent
        title={`Publicar a versão ${number}?`}
        description="Quem abrir o app passa a ver esta versão."
      >
        {publish.error !== null && <Alert tone="danger">{sentenceOf(publish.error)}</Alert>}
        <div className="flex flex-wrap gap-md">
          <Button variant="primary" disabled={publish.isPending} onClick={() => void confirm()}>
            {publish.isPending ? 'Publicando…' : `Publicar a versão ${number}`}
          </Button>
          <Button disabled={publish.isPending} onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
