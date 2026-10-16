import { FAILURES, PASSWORD_LENGTH, setPassword } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
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

const PASSWORD = setPassword.input.body.pick({ password: true })
const CHOOSE = `Escolha uma senha de ${PASSWORD_LENGTH.min} caracteres ou mais.`
const TOO_SHORT = `A senha precisa de ${PASSWORD_LENGTH.min} caracteres ou mais.`
const LINK_INVALID = `${FAILURES.PASSWORD_LINK_INVALID.phrase} ${FAILURES.PASSWORD_LINK_INVALID.action}`

function Heading() {
  return (
    <header className="flex flex-col gap-xs">
      <PageTitle>Criar sua senha</PageTitle>
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
  redirect: string | undefined
}) {
  if (props.token !== undefined) {
    return <ChoosePassword token={props.token} redirect={props.redirect} />
  }
  return (
    <section className="flex w-full flex-col gap-lg">
      <p role="alert" className="text-danger">
        {LINK_INVALID}
      </p>
    </section>
  )
}

function ChoosePassword({ token, redirect }: { token: string; redirect: string | undefined }) {
  const router = useRouter()
  const send = useMutation(choosePassword)
  const form = useSchemaForm(PASSWORD, { password: '' })

  async function submit({ password }: { password: string }) {
    try {
      await send.mutateAsync({ body: { token, password } })
    } catch (error) {
      setServerError(form, error)
      return
    }
    await router.navigate({ to: '/login', search: { reason: 'password-set', redirect } })
  }

  return (
    <section className="flex w-full flex-col gap-lg">
      <Heading />
      <Form form={form} onSubmit={submit}>
        <TextField
          name="password"
          label="Senha"
          type="password"
          autoComplete="new-password"
          invalid={TOO_SHORT}
        />
        <FormAlert />
        <SubmitButton idle="Criar a senha" pending="Criando…" />
      </Form>
    </section>
  )
}
