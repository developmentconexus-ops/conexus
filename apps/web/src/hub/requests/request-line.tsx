import type { CompanyId, PublishRequest } from '@conexus/hub-api'
import { Decision, FAILURES } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { agoOf } from '../../platform/dates.ts'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { Button } from '../../ui/button.tsx'
import { Dialog, DialogContent } from '../../ui/dialog.tsx'
import { Form, FormAlert, SubmitButton, setServerError, useSchemaForm } from '../../ui/form.tsx'
import { Notice } from '../../ui/notice.tsx'
import { MessageField } from './publish-request.tsx'
import { sendCancellation, sendDecision } from './queries.ts'
import { ALREADY_DECIDED, askedText, ONLY_DECIDERS } from './text.ts'

type Props = {
  companyId: CompanyId
  request: PublishRequest
  /** The sentence the screen keeps above for the last action: said when an action ends in one, cleared when the next begins. The Projeto is read again by the cache. */
  onChanged: (message?: string) => void
}

const DECLINE = Decision.options[1].pick({ reason: true })

function DeclineForm(props: Props & { onClose: () => void }) {
  const { companyId, request } = props
  const send = useMutation(sendDecision)
  const form = useSchemaForm(DECLINE, { reason: '' })

  async function submit({ reason }: { reason?: string }) {
    const said = reason?.trim()
    try {
      await send.mutateAsync({
        params: { companyId, requestId: request.id },
        body: said ? { decision: 'DECLINE', reason: said } : { decision: 'DECLINE' },
      })
      props.onClose()
    } catch (error) {
      if (error instanceof HubFailure && error.code === 'PUBLISH_REQUEST_CLOSED') {
        props.onClose()
        props.onChanged(ALREADY_DECIDED)
      } else setServerError(form, error)
    }
  }

  const failed = form.formState.errors.root?.server !== undefined
  return (
    <Form form={form} onSubmit={submit}>
      <MessageField name="reason" label="Motivo (opcional)" />
      <FormAlert />
      <div className="flex flex-wrap justify-end gap-sm">
        <Button type="button" disabled={form.formState.isSubmitting} onClick={props.onClose}>
          Voltar
        </Button>
        <SubmitButton idle={failed ? 'Tentar de novo' : 'Recusar'} pending="Recusando…" />
      </div>
    </Form>
  )
}

/** What the line says of a decision or a cancellation that failed, and whether it offers another try. */
type Failed = { text: string; canRetry: boolean; work: () => Promise<unknown> }

/**
 * The Projeto's open request, in a box under the line of its version: who asked, when, the message,
 * and what the reader may do. The Hub says what that is (`mayCancel`, `mayDecide`): the asker
 * withdraws it, an owner or an administrator publishes the version or declines with a reason, and
 * anyone else reads who decides. A request that was closed meanwhile reads the Projeto again and
 * says so; any other failure stays in the line, with **Tentar de novo** where a try can work. A request the
 * Hub no longer finds reads the Projeto again, as **Publicar** does.
 */
export function RequestLine(props: Props) {
  const { companyId, request } = props
  const params = { companyId, requestId: request.id }
  const router = useRouter()
  const approve = useMutation(sendDecision)
  const cancel = useMutation(sendCancellation)
  const [declining, setDeclining] = useState(false)
  const [failed, setFailed] = useState<Failed>()
  const pending = approve.isPending || cancel.isPending

  async function run(work: () => Promise<unknown>) {
    props.onChanged()
    setFailed(undefined)
    try {
      await work()
    } catch (error) {
      if (error instanceof HubFailure && error.code === 'PUBLISH_REQUEST_CLOSED') {
        props.onChanged(ALREADY_DECIDED)
        return
      }
      if (error instanceof HubFailure && error.code === 'NOT_FOUND') {
        await router.invalidate()
        return
      }
      // A try can work when the Hub may not have answered whole, or its own row says to try again.
      const canRetry =
        !(error instanceof HubFailure) ||
        error.outcomeUnknown ||
        FAILURES[error.code].actionKind === 'RETRY'
      setFailed({ text: sentenceOf(error), canRetry, work })
    }
  }

  return (
    <section
      aria-label="Pedido de publicação"
      className="flex flex-col gap-sm rounded-object border border-line bg-surface p-md"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-md gap-y-xs">
        <Notice>{askedText(request)}</Notice>
        <time dateTime={request.createdAt} className="text-label text-text-2">
          {agoOf(request.createdAt, new Date())}
        </time>
      </div>
      {request.message !== '' && <p className="break-words text-text-2">“{request.message}”</p>}
      {!request.mayDecide && !request.mayCancel && (
        <p className="text-label text-text-2">{ONLY_DECIDERS}</p>
      )}
      {failed !== undefined && <Alert tone="danger">{failed.text}</Alert>}
      <div className="flex flex-wrap justify-end gap-sm">
        {failed?.canRetry === true && (
          <Button disabled={pending} onClick={() => void run(failed.work)}>
            Tentar de novo
          </Button>
        )}
        {request.mayCancel && (
          <Button disabled={pending} onClick={() => void run(() => cancel.mutateAsync({ params }))}>
            Cancelar pedido
          </Button>
        )}
        {request.mayDecide && (
          <>
            <Button
              disabled={pending}
              onClick={() => {
                props.onChanged()
                setDeclining(true)
              }}
            >
              Recusar
            </Button>
            <Button
              variant="primary"
              disabled={pending}
              onClick={() =>
                void run(() => approve.mutateAsync({ params, body: { decision: 'APPROVE' } }))
              }
            >
              {approve.isPending ? 'Publicando…' : `Publicar a versão ${request.number}`}
            </Button>
          </>
        )}
      </div>
      <Dialog open={declining} onOpenChange={setDeclining}>
        <DialogContent title={`Recusar a versão ${request.number}`}>
          <DeclineForm {...props} onClose={() => setDeclining(false)} />
        </DialogContent>
      </Dialog>
    </section>
  )
}
