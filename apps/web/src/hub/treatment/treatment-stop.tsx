import type { CompanyId } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { sentenceOf } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { AlertDialog, AlertDialogContent } from '../../ui/alert-dialog.tsx'
import { Button } from '../../ui/button.tsx'
import { sendTreatmentStop } from './queries.ts'
import { CANCEL, STOP, STOP_LEAD, STOP_TITLE, STOPPING } from './text.ts'

/**
 * Parar, beside Tratar agora while a run is open: it asks first, and once the Hub keeps the request
 * the button reads "Parando…" and keeps the keyboard focus until the run closes. A refused request
 * says its sentence and the button asks again; a run the Hub still holds as asked is refused for
 * this run only, so the next one starts clean.
 */
export function StopRun(props: {
  companyId: CompanyId
  run: { since: string; stopping: boolean }
}) {
  const { companyId, run } = props
  const stop = useMutation(sendTreatmentStop)
  const [asking, setAsking] = useState(false)
  const [refused, setRefused] = useState<{ since: string; sentence: string } | null>(null)
  const refusal = refused?.since === run.since ? refused.sentence : null
  const stopping = run.stopping && refusal === null

  async function send() {
    setRefused(null)
    try {
      await stop.mutateAsync({ params: { companyId } })
    } catch (error) {
      setRefused({ since: run.since, sentence: sentenceOf(error) })
    }
    setAsking(false)
  }

  return (
    <>
      <Button disabled={stopping} focusableWhenDisabled={stopping} onClick={() => setAsking(true)}>
        {stopping ? STOPPING : STOP}
      </Button>
      {refusal !== null && (
        <Alert tone="danger" className="basis-full">
          {refusal}
        </Alert>
      )}
      <AlertDialog open={asking} onOpenChange={(open) => open || setAsking(false)}>
        <AlertDialogContent title={STOP_TITLE} description={STOP_LEAD}>
          <div className="flex flex-wrap gap-md">
            <Button variant="danger-confirm" disabled={stop.isPending} onClick={() => void send()}>
              {STOP}
            </Button>
            <Button onClick={() => setAsking(false)}>{CANCEL}</Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
