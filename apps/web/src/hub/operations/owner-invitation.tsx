import type { CompanyId, OwnerInvitation } from '@conexus/hub-api'
import { Email } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { z } from 'zod'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import { dayAndHour } from '../../platform/dates.ts'
import { sentenceOf } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import {
  Form,
  FormAlert,
  SubmitButton,
  setServerError,
  TextField,
  useSchemaForm,
} from '../../ui/form.tsx'
import { SectionTitle } from '../../ui/list.tsx'
import { CancelInvitationForm } from '../identity/public.ts'
import { fieldOf } from './client-fields.tsx'
import { inviteOwner, renewOwnerInvitation } from './queries.ts'

const STATE = {
  PENDING: 'Aguardando o administrador',
  EXPIRED: 'Convite vencido',
  DECLINED: 'Convite recusado',
  CANCELED: 'Convite cancelado',
} as const

/** "Convidar outro e-mail": a new first owner, once no invitation of an owner is live. */
function OtherEmailForm({ companyId, onDone }: { companyId: CompanyId; onDone: () => void }) {
  const send = useMutation({ ...inviteOwner, onSuccess: onDone })
  const attempt = useAttemptKey()
  const form = useSchemaForm(z.object({ email: Email }), { email: '' })

  async function submit({ email }: { email: Email }) {
    try {
      const body = { email, role: 'owner' } as const
      await attempt((attemptKey) => send.mutateAsync({ params: { companyId }, body, attemptKey }))
    } catch (error) {
      setServerError(form, error, fieldOf(error) === undefined ? undefined : 'email')
    }
  }

  return (
    <Form form={form} onSubmit={submit}>
      <TextField
        name="email"
        label="E-mail do administrador"
        type="email"
        autoComplete="off"
        invalid="Escreva um e-mail."
      />
      <FormAlert />
      <SubmitButton idle="Convidar" pending="Convidando…" />
      <Button type="button" disabled={send.isPending} onClick={onDone}>
        Voltar
      </Button>
    </Form>
  )
}

type Open = 'NONE' | 'CANCEL' | 'OTHER'

/** The first owner's invitation of a client still awaiting its administrator, and what to do. */
export function OwnerInvitationSection({
  companyId,
  invitation,
}: {
  companyId: CompanyId
  invitation: OwnerInvitation
}) {
  const renew = useMutation(renewOwnerInvitation)
  const reissue = useMutation(inviteOwner)
  const attempt = useAttemptKey()
  const [open, setOpen] = useState<Open>('NONE')
  const busy = renew.isPending || reissue.isPending
  const { state } = invitation
  const pendingOrExpired = state === 'PENDING' || state === 'EXPIRED'

  function sendAgain() {
    if (state === 'PENDING') {
      renew.mutate({
        params: { companyId, invitationId: invitation.id },
        body: { revision: invitation.revision },
      })
      return
    }
    const body = {
      email: invitation.email,
      role: 'owner',
      replaces: { id: invitation.id, revision: invitation.revision },
    } as const
    // The mutation owns the visible refusal.
    attempt((attemptKey) => reissue.mutateAsync({ params: { companyId }, body, attemptKey })).catch(
      () => undefined,
    )
  }

  return (
    <section className="flex flex-col gap-md">
      <SectionTitle>Convite do administrador</SectionTitle>
      <p className="break-all">{invitation.email}</p>
      <p className="text-label text-text-2">
        {STATE[state]}
        {pendingOrExpired &&
          `, ${state === 'PENDING' ? 'vence' : 'venceu'} em ${dayAndHour(invitation.expiresAt)}`}
      </p>
      <div className="flex flex-wrap gap-md">
        {pendingOrExpired && (
          <Button disabled={busy || open !== 'NONE'} onClick={sendAgain}>
            {busy ? 'Enviando…' : state === 'PENDING' ? 'Reenviar' : 'Convidar de novo'}
          </Button>
        )}
        {pendingOrExpired && (
          <Button disabled={busy || open !== 'NONE'} onClick={() => setOpen('CANCEL')}>
            Cancelar convite
          </Button>
        )}
        {state !== 'PENDING' && (
          <Button disabled={busy || open !== 'NONE'} onClick={() => setOpen('OTHER')}>
            Convidar outro e-mail
          </Button>
        )}
      </div>
      {open === 'CANCEL' && (
        <CancelInvitationForm
          companyId={companyId}
          invitation={invitation}
          onClose={() => setOpen('NONE')}
        />
      )}
      {open === 'OTHER' && <OtherEmailForm companyId={companyId} onDone={() => setOpen('NONE')} />}
      {(renew.isError || reissue.isError) && (
        <p role="alert" className="text-label text-danger">
          {sentenceOf(renew.error ?? reissue.error)}
        </p>
      )}
    </section>
  )
}
