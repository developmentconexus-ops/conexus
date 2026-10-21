import type { InvitationView } from '@conexus/hub-api'
import { createInvitationPassword, ROLE_LABELS } from '@conexus/hub-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getRouteApi, Link, useRouter } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { sentenceOf } from '../../platform/hub.ts'
import { Button, buttonVariants } from '../../ui/button.tsx'
import {
  Form,
  FormAlert,
  SubmitButton,
  setServerError,
  TextField,
  useSchemaForm,
} from '../../ui/form.tsx'
import { PageTitle } from '../../ui/list.tsx'
import { Notice } from '../../ui/notice.tsx'
import { NotFound } from '../../ui/states.tsx'
import {
  acceptReceivedInvitation,
  createReceivedPassword,
  declineReceivedInvitation,
  sessionQuery,
  signOut,
} from './queries.ts'

const entryRoute = getRouteApi('/_public/invitations/$invitationId')
const PasswordForm = createInvitationPassword.input.body
  .omit({ revision: true })
  .extend({ confirm: z.string() })
  .refine((value) => value.password === value.confirm, {
    path: ['confirm'],
    message: 'As senhas não são iguais.',
  })
type OpenInvitation = Extract<InvitationView, { kind: 'NEW' | 'HAS_PASSWORD' | 'INVITED' }>

function InvitationPassword(props: {
  invitation: Extract<InvitationView, { kind: 'NEW' }>
  onCreated: () => void
}) {
  const { invitationId } = entryRoute.useParams()
  const queryClient = useQueryClient()
  const router = useRouter()
  const send = useMutation(createReceivedPassword)
  const [visible, setVisible] = useState(false)
  const form = useSchemaForm(PasswordForm, { name: '', password: '', confirm: '' }, 'onBlur')
  async function submit(values: z.output<typeof PasswordForm>) {
    try {
      await send.mutateAsync({
        params: { invitationId },
        body: { name: values.name, password: values.password, revision: props.invitation.revision },
      })
    } catch (error) {
      setServerError(form, error)
      return
    }
    props.onCreated()
    queryClient.removeQueries({ queryKey: sessionQuery.queryKey })
    await queryClient.invalidateQueries()
    await router.invalidate({ sync: true })
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
      <TextField
        name="password"
        label="Senha"
        type={visible ? 'text' : 'password'}
        autoComplete="new-password"
        invalid="Use de 8 a 128 caracteres."
      />
      <p className="text-text-2">8 caracteres ou mais</p>
      <Button type="button" aria-pressed={visible} onClick={() => setVisible((value) => !value)}>
        {visible ? 'Ocultar senha' : 'Mostrar senha'}
      </Button>
      <TextField
        name="confirm"
        label="Confirmar senha"
        type={visible ? 'text' : 'password'}
        autoComplete="new-password"
        invalid="As senhas não são iguais."
      />
      <FormAlert />
      <SubmitButton idle="Criar senha" pending="Criando…" />
    </Form>
  )
}

function InvitationActions({ invitation }: { invitation: OpenInvitation }) {
  const { invitationId } = entryRoute.useParams()
  const router = useRouter()
  const accept = useMutation({
    ...acceptReceivedInvitation,
    onSuccess: ({ company }) =>
      router.navigate({ to: '/companies/$companyId', params: { companyId: company.id } }),
  })
  const decline = useMutation({
    ...declineReceivedInvitation,
    onSuccess: () => router.invalidate({ sync: true }),
  })
  const form = useForm()
  async function submit(kind: 'ACCEPT' | 'DECLINE') {
    try {
      const input = { params: { invitationId }, body: { revision: invitation.revision } }
      if (kind === 'ACCEPT') await accept.mutateAsync(input)
      else await decline.mutateAsync(input)
    } catch (error) {
      setServerError(form, error)
    }
  }
  const pending = accept.isPending || decline.isPending
  return (
    <Form form={form} onSubmit={() => submit('ACCEPT')}>
      <FormAlert />
      <div className="flex flex-wrap gap-md">
        {invitation.kind === 'INVITED' && (
          <Button type="submit" variant="primary" disabled={pending}>
            {accept.isPending ? 'Aceitando…' : 'Aceitar convite'}
          </Button>
        )}
        <Button type="button" disabled={pending} onClick={() => void submit('DECLINE')}>
          {decline.isPending ? 'Recusando…' : 'Recusar convite'}
        </Button>
      </div>
    </Form>
  )
}

function OtherSession({ signedInAs }: { signedInAs: string }) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const send = useMutation({
    ...signOut,
    onSuccess: async () => {
      queryClient.clear()
      await router.invalidate({ sync: true })
    },
  })
  return (
    <>
      <PageTitle>Este convite foi enviado para outro e-mail.</PageTitle>
      <p className="text-text">Você entrou como {signedInAs}.</p>
      {send.isError && (
        <p role="alert" className="text-danger">
          {sentenceOf(send.error)}
        </p>
      )}
      <Button disabled={send.isPending} onClick={() => send.mutate(undefined)}>
        {send.isPending ? 'Saindo…' : 'Sair e abrir o convite'}
      </Button>
    </>
  )
}

const CLOSED = {
  EXPIRED: 'Este convite venceu.',
  ACCEPTED: 'Este convite já foi usado.',
  DECLINED: 'Este convite foi recusado.',
  CANCELED: 'Este convite foi cancelado.',
}

export function InvitationEntry() {
  const { invitationId } = entryRoute.useParams()
  const { invitation } = entryRoute.useLoaderData()
  const [createdFor, setCreatedFor] = useState<string>()
  const created =
    createdFor === invitationId && (invitation.kind === 'NEW' || invitation.kind === 'INVITED')
  let content: ReactNode
  switch (invitation.kind) {
    case 'CLOSED':
      content = <PageTitle>{CLOSED[invitation.state]}</PageTitle>
      break
    case 'OTHER':
      content = <OtherSession signedInAs={invitation.signedInAs} />
      break
    case 'JOINED':
      content = (
        <>
          <PageTitle>Você já faz parte de {invitation.company.name}.</PageTitle>
          <Link
            to="/companies/$companyId"
            params={{ companyId: invitation.company.id }}
            className={buttonVariants()}
          >
            Abrir empresa
          </Link>
        </>
      )
      break
    case 'NEW':
    case 'HAS_PASSWORD':
    case 'INVITED':
      content = (
        <>
          <PageTitle>
            {invitation.firstOwner
              ? `${invitation.inviterName} convidou você para ser o primeiro dono de ${invitation.company.name}.`
              : `${invitation.inviterName} convidou você para ${invitation.company.name} como ${ROLE_LABELS[invitation.role]}.`}
          </PageTitle>
          <p className="text-text-2">
            Válido até{' '}
            {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
              new Date(invitation.expiresAt),
            )}
            .
          </p>
          {invitation.kind === 'NEW' && (
            <InvitationPassword
              invitation={invitation}
              onCreated={() => setCreatedFor(invitationId)}
            />
          )}
          {invitation.kind === 'HAS_PASSWORD' && (
            <Link
              to="/login"
              search={{ redirect: `/invitations/${invitationId}` }}
              className={buttonVariants({ variant: 'primary' })}
            >
              Entrar
            </Link>
          )}
          <InvitationActions invitation={invitation} />
        </>
      )
      break
    default:
      content = invitation satisfies never
  }
  return (
    <section className="flex w-full flex-col items-start gap-lg">
      {created && <Notice>Senha criada. Você já entrou.</Notice>}
      {created && invitation.kind === 'NEW' ? null : content}
    </section>
  )
}

export function InvitationNotFound() {
  return <NotFound hint="Confira o endereço do convite." />
}
