import { FAILURES, PASSWORD_LENGTH, setPassword } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
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
import { choosePassword } from './queries.ts'

const PASSWORD = setPassword.input.body
  .pick({ password: true })
  .extend({ confirmation: z.string() })
  .refine((values) => values.password === values.confirmation, { path: ['confirmation'] })
const DIFFERENT = 'As senhas não são iguais.'
const CHOOSE = `Escolha uma senha de ${PASSWORD_LENGTH.min} caracteres ou mais.`
const TOO_SHORT = `A senha precisa de ${PASSWORD_LENGTH.min} caracteres ou mais.`
const LINK_INVALID = `${FAILURES.PASSWORD_LINK_INVALID.phrase} ${FAILURES.PASSWORD_LINK_INVALID.action}`

/** The first person's link and a recovery's differ only in the words and in where the person goes next. */
export type PasswordLinkKind = 'first' | 'recovery'

function AskAgain({ variant }: { variant: 'primary' | 'default' }) {
  return (
    <Link to="/forgot-password" className={buttonVariants({ variant })}>
      Pedir outro link
    </Link>
  )
}

/** A link that cannot be used again: nothing to fill in, only the way to a new one. */
function DeadLink() {
  return (
    <section className="flex w-full flex-col gap-lg">
      <p role="alert" className="text-danger">
        {LINK_INVALID}
      </p>
      <AskAgain variant="primary" />
    </section>
  )
}

function Heading({ kind }: { kind: PasswordLinkKind }) {
  return (
    <header className="flex flex-col gap-xs">
      <PageTitle>{kind === 'recovery' ? 'Criar senha nova' : 'Criar sua senha'}</PageTitle>
      <p className="text-text-2">{CHOOSE}</p>
    </header>
  )
}

/**
 * `token` is the one from the link's fragment; without one the link cannot be used. `redirect` is
 * where the person goes after signing in with the new password.
 */
export function SetPasswordForm(props: {
  token: string | undefined
  kind: PasswordLinkKind
  redirect: string | undefined
}) {
  if (props.token !== undefined) {
    return <ChoosePassword token={props.token} kind={props.kind} redirect={props.redirect} />
  }
  return <DeadLink />
}

function ChoosePassword(props: {
  token: string
  kind: PasswordLinkKind
  redirect: string | undefined
}) {
  const router = useRouter()
  const send = useMutation(choosePassword)
  const form = useSchemaForm(PASSWORD, { password: '', confirmation: '' })
  const [linkLost, setLinkLost] = useState(false)

  async function submit({ password }: { password: string }) {
    try {
      await send.mutateAsync({ body: { token: props.token, password } })
    } catch (error) {
      setLinkLost(error instanceof HubFailure && error.code === 'PASSWORD_LINK_INVALID')
      setServerError(form, error)
      return
    }
    const reason = props.kind === 'recovery' ? 'password-changed' : 'password-set'
    await router.navigate({ to: '/login', search: { reason, redirect: props.redirect } })
  }

  if (linkLost) return <DeadLink />
  return (
    <section className="flex w-full flex-col gap-lg">
      <Heading kind={props.kind} />
      <Form form={form} onSubmit={submit}>
        <TextField
          name="password"
          label="Senha"
          type="password"
          autoComplete="new-password"
          invalid={TOO_SHORT}
        />
        <TextField
          name="confirmation"
          label="Repita a senha"
          type="password"
          autoComplete="new-password"
          invalid={DIFFERENT}
        />
        <FormAlert />
        <SubmitButton idle="Criar a senha" pending="Criando…" />
      </Form>
    </section>
  )
}
