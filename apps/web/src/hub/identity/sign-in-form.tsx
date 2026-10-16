import { createSession, FAILURES } from '@conexus/hub-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { z } from 'zod'
import {
  Form,
  FormAlert,
  SubmitButton,
  setServerError,
  TextField,
  useSchemaForm,
} from '../../ui/form.tsx'
import { PageTitle } from '../../ui/list.tsx'
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
 * title takes it (#32-4). The router emits `onRendered` once the destination is committed to the
 * DOM, however late its loader resolves.
 */
function focusTitleWhenRendered(router: ReturnType<typeof useRouter>): () => void {
  const stop = router.subscribe('onRendered', () => {
    stop()
    const title = document.querySelector<HTMLElement>('main h1')
    if (title) {
      title.tabIndex = -1
      title.focus()
    }
  })
  return stop
}

export function SignInForm(props: {
  reason: SignInReason | undefined
  redirect: string | undefined
  email?: string
}) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const send = useMutation(signIn)
  const form = useSchemaForm(createSession.input.body, { email: props.email ?? '', password: '' })

  async function submit(values: z.output<typeof createSession.input.body>) {
    try {
      await send.mutateAsync({ body: values })
    } catch (error) {
      setServerError(form, error)
      return
    }
    // The guard reads the session with ensureQueryData, which would return the cached "nobody"
    // (web W28).
    queryClient.removeQueries({ queryKey: sessionQuery.queryKey })
    await router.invalidate()
    const stop = focusTitleWhenRendered(router)
    try {
      await router.navigate({ href: props.redirect ?? '/' })
    } catch (error) {
      stop()
      throw error
    }
  }

  return (
    <section className="flex w-full flex-col gap-lg">
      {props.reason && (
        <p role="status" className="text-text">
          {NOTICES[props.reason]}
        </p>
      )}
      <header className="flex flex-col gap-xs">
        <PageTitle>Entrar no Conexus</PageTitle>
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
