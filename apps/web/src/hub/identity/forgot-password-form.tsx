import { requestPasswordRecovery } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { HubFailure } from '../../platform/hub.ts'
import { buttonVariants } from '../../ui/button.tsx'
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
import { requestRecovery } from './queries.ts'

const SENT = 'Se houver uma conta com esse e-mail, enviamos um link. Ele vale por 1 hora.'

function BackToSignIn() {
  return (
    <Link to="/login" className={buttonVariants({ variant: 'ghost' })}>
      Voltar para entrar
    </Link>
  )
}

/**
 * The answer is the same whether or not an account exists, so anything but the limit on requests
 * reads as sent: a cut or a 502 or 503 would otherwise tell the two apart.
 */
export function ForgotPasswordForm() {
  const send = useMutation(requestRecovery)
  const form = useSchemaForm(requestPasswordRecovery.input.body, { email: '' })
  const [sent, setSent] = useState(false)

  async function submit(values: { email: string }) {
    try {
      await send.mutateAsync({ body: values })
    } catch (error) {
      if (error instanceof HubFailure && error.code === 'RECOVERY_ATTEMPTS_EXCEEDED') {
        setServerError(form, error)
        return
      }
    }
    setSent(true)
  }

  if (sent) {
    return (
      <section className="flex w-full flex-col gap-lg">
        <PageTitle>Veja o seu e-mail</PageTitle>
        <Notice>{SENT}</Notice>
        <BackToSignIn />
      </section>
    )
  }
  return (
    <section className="flex w-full flex-col gap-lg">
      <header className="flex flex-col gap-xs">
        <PageTitle>Esqueci minha senha</PageTitle>
        <p className="text-text-2">Escreva o e-mail da sua conta para receber um link.</p>
      </header>
      <Form form={form} onSubmit={submit}>
        <TextField
          name="email"
          label="E-mail"
          type="email"
          autoComplete="username"
          invalid="Escreva um e-mail."
        />
        <FormAlert />
        <SubmitButton idle="Enviar o link" pending="Enviando…" />
      </Form>
      <BackToSignIn />
    </section>
  )
}
