import { createSession, FAILURES } from '@conexus/hub-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { sentenceOf } from '../../platform/hub.ts'
import { Form, FormAlert, SubmitButton, TextField, useSchemaForm } from '../../ui/form.tsx'
import { sessionQuery, signIn } from './queries.ts'

type SignInReason = 'signed-out' | 'session-ended'

const NOTICES: Record<SignInReason, string> = {
  'signed-out': 'Você saiu do Conexus.',
  'session-ended': `${FAILURES.SESSION_REQUIRED.phrase} ${FAILURES.SESSION_REQUIRED.action}`,
}

export function SignInForm(props: {
  reason: SignInReason | undefined
  redirect: string | undefined
}) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const send = useMutation(signIn)
  const form = useSchemaForm(createSession.input.body, { email: '', password: '' })

  async function submit(values: Parameters<typeof send.mutateAsync>[0]) {
    try {
      await send.mutateAsync(values)
    } catch (error) {
      form.setError('root.server', { type: 'server', message: sentenceOf(error) })
      return
    }
    // The guard reads the session with ensureQueryData, which would return the cached "nobody"
    // (web W28).
    queryClient.removeQueries({ queryKey: sessionQuery.queryKey })
    await router.invalidate()
    await router.navigate({ href: props.redirect ?? '/' })
  }

  return (
    <section className="flex w-full flex-col gap-lg">
      {props.reason && (
        <p role="status" className="text-text-2">
          {NOTICES[props.reason]}
        </p>
      )}
      <header className="flex flex-col gap-xs">
        <h1 className="font-display text-title">Entrar no Conexus</h1>
        <p className="text-text-2">Use o seu e-mail de trabalho.</p>
      </header>
      <Form form={form} onSubmit={submit}>
        <TextField
          name="email"
          label="E-mail"
          type="email"
          autoComplete="username"
          invalid="Escreva um e-mail."
        />
        <TextField
          name="password"
          label="Senha"
          type="password"
          autoComplete="current-password"
          invalid="Escreva a senha."
        />
        <FormAlert />
        <SubmitButton idle="Entrar" pending="Entrando…" />
      </Form>
    </section>
  )
}
