import { FAILURES, setPassword } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { Form, FormAlert, SubmitButton, TextField, useSchemaForm } from '../../ui/form.tsx'
import { choosePassword } from './queries.ts'

const PASSWORD = setPassword.input.body.pick({ password: true })
const LINK_INVALID = `${FAILURES.PASSWORD_LINK_INVALID.phrase} ${FAILURES.PASSWORD_LINK_INVALID.action}`

function Heading() {
  return (
    <header className="flex flex-col gap-xs">
      <h1 className="font-display text-title">Criar sua senha</h1>
      <p className="text-text-2">Escolha uma senha de 8 caracteres ou mais.</p>
    </header>
  )
}

/** `token` is the one from the link's fragment; without one the link cannot be used. */
export function SetPasswordForm({ token }: { token: string | undefined }) {
  if (token !== undefined) return <ChoosePassword token={token} />
  return (
    <section className="flex w-full flex-col gap-lg">
      <Heading />
      <p role="alert" className="text-danger">
        {LINK_INVALID}
      </p>
    </section>
  )
}

function ChoosePassword({ token }: { token: string }) {
  const router = useRouter()
  const send = useMutation(choosePassword)
  const form = useSchemaForm(PASSWORD, { password: '' })

  async function submit({ password }: { password: string }) {
    try {
      await send.mutateAsync({ token, password })
    } catch (error) {
      const onField = error instanceof HubFailure && error.code === 'PASSWORD_TOO_SHORT'
      if (onField) form.setError('password', { type: 'server', message: sentenceOf(error) })
      else form.setError('root.server', { type: 'server', message: sentenceOf(error) })
      return
    }
    await router.navigate({ to: '/login' })
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
          invalid="Escreva a senha."
        />
        <FormAlert />
        <SubmitButton idle="Criar a senha" pending="Criando…" />
      </Form>
    </section>
  )
}
