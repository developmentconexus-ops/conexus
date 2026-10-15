import { createSession, FAILURES } from '@conexus/hub-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { z } from 'zod'
import { sentenceOf } from '../../platform/hub.ts'
import { Form, FormAlert, SubmitButton, TextField, useSchemaForm } from '../../ui/form.tsx'
import { sessionQuery, signIn } from './queries.ts'

const ANY_ORIGIN = 'https://conexus.invalid'

/** A return address is a path on this origin, never another site (security S24, web W16). */
export const SameOriginPath = z
  .string()
  .refine(
    (path) =>
      path.startsWith('/') &&
      !path.startsWith('//') &&
      !path.includes('\\') &&
      new URL(path, ANY_ORIGIN).origin === ANY_ORIGIN,
  )

type SignInReason = 'signed-out' | 'session-ended' | 'password-set'

const NOTICES: Record<SignInReason, string> = {
  'signed-out': 'Você saiu do Conexus.',
  'session-ended': `${FAILURES.SESSION_REQUIRED.phrase} ${FAILURES.SESSION_REQUIRED.action}`,
  'password-set': 'Senha criada. Entre com ela.',
}

/**
 * The form unmounts when the person signs in, which drops focus to the page body; the new page's
 * title takes it (#32-4). The title renders a frame after the navigation resolves.
 */
async function focusPageTitle(): Promise<void> {
  for (let frame = 0; frame < 30; frame++) {
    const title = document.querySelector<HTMLElement>('main h1')
    if (title) {
      title.tabIndex = -1
      title.focus()
      return
    }
    await new Promise((resume) => requestAnimationFrame(resume))
  }
}

export function SignInForm(props: {
  reason: SignInReason | undefined
  redirect: string | undefined
}) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const send = useMutation(signIn)
  const form = useSchemaForm(createSession.input.body, { email: '', password: '' })

  async function submit(values: z.output<typeof createSession.input.body>) {
    try {
      await send.mutateAsync({ body: values })
    } catch (error) {
      form.setError('root.server', { type: 'server', message: sentenceOf(error) })
      return
    }
    // The guard reads the session with ensureQueryData, which would return the cached "nobody"
    // (web W28).
    queryClient.removeQueries({ queryKey: sessionQuery.queryKey })
    await router.invalidate()
    await router.navigate({ href: props.redirect ?? '/' })
    await focusPageTitle()
  }

  return (
    <section className="flex w-full flex-col gap-lg">
      {props.reason && (
        <p role="status" className="text-text">
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
