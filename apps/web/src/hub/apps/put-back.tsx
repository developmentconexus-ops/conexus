import type { AppVersion, CompanyId, ProjectId } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { AlertDialog, AlertDialogContent, AlertDialogTrigger } from '../../ui/alert-dialog.tsx'
import { Button } from '../../ui/button.tsx'
import { sendLiveVersion } from './queries.ts'

// The refusals that say the list is out of date: the dialog closes and the list is read again.
const STALE = ['APP_VERSION_NOT_FOUND', 'APP_VERSION_SENDING']

/**
 * "Voltar para esta": puts a kept version back on the air, after a confirmation that says the data
 * stay as they are. A refusal that the list explains leaves through `onStale`, because the row may
 * be gone when the list is read again.
 */
export function PutBack(props: {
  companyId: CompanyId
  projectId: ProjectId
  version: AppVersion
  onStale: (message?: string) => void
}) {
  const { companyId, projectId, version } = props
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const send = useMutation(sendLiveVersion)

  async function confirm() {
    try {
      await send.mutateAsync({ params: { companyId, projectId }, body: { versionId: version.id } })
      setOpen(false)
    } catch (error) {
      if (!(error instanceof HubFailure)) return
      if (error.code === 'NOT_FOUND') await router.invalidate()
      else if (STALE.includes(error.code)) {
        setOpen(false)
        props.onStale(sentenceOf(error))
      }
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          send.reset()
          props.onStale()
        }
        setOpen(next)
      }}
    >
      <AlertDialogTrigger render={<Button />}>Voltar para esta</AlertDialogTrigger>
      <AlertDialogContent
        title={`Voltar para a Versão ${version.number}?`}
        description="Os dados ficam como estão."
      >
        {send.error !== null && (
          <p role="alert" className="text-danger">
            {sentenceOf(send.error)}
          </p>
        )}
        <div className="flex flex-wrap gap-md">
          <Button variant="primary" disabled={send.isPending} onClick={() => void confirm()}>
            {send.isPending ? 'Voltando…' : `Voltar para a Versão ${version.number}`}
          </Button>
          <Button disabled={send.isPending} onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
