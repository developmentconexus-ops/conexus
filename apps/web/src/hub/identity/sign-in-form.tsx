import { APP_OPEN_PATH, createSession, FAILURES } from '@conexus/hub-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import { z } from 'zod'
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

/**
 * Where a signed-in person goes on: the Hub answers the app-open handoff itself and sends the
 * browser on to the app, so that one is loaded, not routed.
 */
export function goBack(back: string) {
  return new URL(back, ANY_ORIGIN).pathname === APP_OPEN_PATH
    ? { href: back, reloadDocument: true }
    : { href: back }
}

type SignInReason = 'signed-out' | 'session-ended' | 'password-set' | 'password-changed'

const NOTICES: Record<SignInReason, string> = {
  'signed-out': 'Você saiu do Conexus.',
  'session-ended': `${FAILURES.SESSION_REQUIRED.phrase} ${FAILURES.SESSION_REQUIRED.action}`,
  'password-set': 'Senha criada. Entre com ela.',
  'password-changed': 'Senha trocada. Entre com a nova senha.',
}

// base-ui's select keeps a hidden `aria-hidden` input that hands focus to its trigger.
const TEXT_FIELD =
  'main textarea, main input:not([aria-hidden=true]):is(:not([type]), [type=text], [type=email], [type=search], [type=password], [type=tel], [type=url], [type=number])'

/**
 * The form unmounts when the person signs in, which drops focus to the page body; the new page's
 * first text field takes it, or its title when it has none (#32-4). The router emits `onRendered`
 * once the destination is committed to the DOM, however late its loader resolves.
 */
function focusWhenRendered(router: ReturnType<typeof useRouter>): () => void {
  const stop = router.subscribe('onRendered', () => {
    stop()
    const field = document.querySelector<HTMLElement>(TEXT_FIELD)
    const target = field ?? document.querySelector<HTMLElement>('main h1')
    if (target) {
      if (!field) target.tabIndex = -1
      target.focus()
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
    const back = goBack(props.redirect ?? '/')
    if (back.reloadDocument) {
      await router.navigate(back)
      return
    }
    await router.invalidate()
    const stop = focusWhenRendered(router)
    try {
      await router.navigate(back)
    } catch (error) {
      stop()
      throw error
    }
  }

  return (
    <section className="flex w-full flex-col gap-lg">
      {props.reason && <Notice>{NOTICES[props.reason]}</Notice>}
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
      <Link to="/forgot-password" className={buttonVariants({ variant: 'ghost' })}>
        Esqueci minha senha
      </Link>
    </section>
  )
}
