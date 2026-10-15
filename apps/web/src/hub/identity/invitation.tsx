import type { ReceivedInvitation } from '@conexus/hub-api'
import { FAILURES, putPasswordLink } from '@conexus/hub-api'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link, useRouter } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { sentenceOf } from '../../platform/hub.ts'
import { Button, buttonVariants } from '../../ui/button.tsx'
import { Form, FormAlert, SubmitButton, TextField, useSchemaForm } from '../../ui/form.tsx'
import { ROLE_LABELS } from './companies.tsx'
import {
  acceptReceivedInvitation,
  receivedInvitationQuery,
  requestPasswordLink,
} from './queries.ts'

const entryRoute = getRouteApi('/_public/invitations/$invitationId')
const acceptanceRoute = getRouteApi('/_app/invitations/$invitationId/acceptance')

function PasswordLinkForm({ onSent }: { onSent: () => void }) {
  const { invitationId } = entryRoute.useParams()
  const send = useMutation(requestPasswordLink)
  const form = useSchemaForm(putPasswordLink.input.body, { name: '' })

  async function submit({ name }: { name: string }) {
    try {
      await send.mutateAsync({ params: { invitationId }, body: { name } })
    } catch (error) {
      form.setError('root.server', { type: 'server', message: sentenceOf(error) })
      return
    }
    onSent()
  }

  return (
    <Form form={form} onSubmit={submit}>
      <TextField
        name="name"
        label="Nome"
        type="text"
        autoComplete="name"
        invalid="Escreva o seu nome."
      />
      <FormAlert />
      <SubmitButton idle="Enviar link" pending="Enviando…" />
    </Form>
  )
}

/** The invitation's address for a person with no session: sign in, or ask for a first password. */
export function InvitationEntry() {
  const { invitationId } = entryRoute.useParams()
  const [asking, setAsking] = useState(false)
  const [sent, setSent] = useState(false)
  return (
    <section className="flex w-full flex-col gap-lg">
      <h1 className="font-display text-title">Você recebeu um convite</h1>
      <div className="flex flex-wrap gap-md">
        <Link
          to="/login"
          search={{ redirect: `/invitations/${invitationId}` }}
          className={buttonVariants({ variant: 'primary' })}
        >
          Entrar
        </Link>
        <Button onClick={() => setAsking(true)}>Ainda não tenho senha</Button>
      </div>
      {asking && !sent && <PasswordLinkForm onSent={() => setSent(true)} />}
      {sent && (
        <p role="status" className="text-text">
          Enviamos o link para criar a senha ao e-mail do convite.
        </p>
      )}
    </section>
  )
}

function Closed(props: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col items-start gap-lg">
      <h1 className="font-display text-title">{props.title}</h1>
      {props.note !== undefined && <p className="text-text-2">{props.note}</p>}
      {props.children}
    </section>
  )
}

function Acceptable({ invitation }: { invitation: ReceivedInvitation }) {
  const router = useRouter()
  const send = useMutation(acceptReceivedInvitation)

  function accept() {
    send.mutate(
      { params: { invitationId: invitation.id } },
      {
        onSuccess: ({ company }) =>
          router.navigate({ to: '/companies/$companyId', params: { companyId: company.id } }),
      },
    )
  }

  return (
    <section className="flex flex-col items-start gap-lg">
      <h1 className="font-display text-title">
        {invitation.inviterName} convidou você para {invitation.company.name} como{' '}
        {ROLE_LABELS[invitation.role]}.
      </h1>
      {send.isError && (
        <p role="alert" className="text-danger">
          {sentenceOf(send.error)}
        </p>
      )}
      <Button variant="primary" disabled={send.isPending} onClick={accept}>
        {send.isPending ? 'Aceitando…' : 'Aceitar convite'}
      </Button>
    </section>
  )
}

/** What a signed-in person sees at the invitation: accept it, or why there is nothing to accept. */
export function InvitationAcceptance() {
  const { invitationId } = acceptanceRoute.useParams()
  const { data } = useSuspenseQuery(receivedInvitationQuery(invitationId))
  const { invitation } = data
  switch (invitation.state) {
    case 'PENDING':
      return <Acceptable invitation={invitation} />
    case 'ACCEPTED':
      return (
        <Closed title={`Você já faz parte de ${invitation.company.name}.`}>
          <Link
            to="/companies/$companyId"
            params={{ companyId: invitation.company.id }}
            className={buttonVariants()}
          >
            Abrir empresa
          </Link>
        </Closed>
      )
    case 'EXPIRED':
    case 'CANCELED':
      return (
        <Closed title={FAILURES.INVITATION_CLOSED.phrase} note={FAILURES.INVITATION_CLOSED.action}>
          <Link to="/" className={buttonVariants()}>
            Voltar ao início
          </Link>
        </Closed>
      )
    default: {
      const unreachable: never = invitation.state
      return unreachable
    }
  }
}
