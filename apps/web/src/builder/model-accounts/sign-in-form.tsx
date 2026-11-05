import type { CompanyId, ModelAccount, Owner, PasteKind, SignInKind } from '@conexus/hub-api'
import {
  ACCOUNT_LABEL_MAX_LENGTH,
  completeModelAccountSignIn,
  isDeviceKind,
  startModelAccountSignIn,
} from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { Loader2Icon } from 'lucide-react'
import { useEffect, useEffectEvent, useId, useState } from 'react'
import { Controller, useWatch } from 'react-hook-form'
import { dayAndHour } from '../../platform/dates.ts'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { Field, FieldError, FieldLabel } from '../../ui/field.tsx'
import {
  Form,
  FormAlert,
  SubmitButton,
  setServerError,
  TextField,
  useSchemaForm,
} from '../../ui/form.tsx'
import { Choice } from './choice.tsx'
import { sendSignInCompletion, sendSignInPoll, sendSignInStart } from './queries.ts'
import { KIND_NAMES } from './text.ts'

type Started =
  | { entry: 'paste'; signInId: string; url: string; expiresAt: string; kind: PasteKind }
  | {
      entry: 'device'
      signInId: string
      url: string
      expiresAt: string
      userCode: string
      retryMs: number
    }

const CODE_FIELDS = {
  claude_subscription: {
    label: 'Código da Anthropic',
    help: 'Depois de entrar, a Anthropic mostra um código. Cole-o aqui.',
    invalid: 'Cole o código.',
  },
  google_cliproxy: {
    label: 'Endereço de retorno do Google',
    help: 'Depois de entrar, o navegador para numa página que não abre (http://localhost:51121/oauth-callback?...). Cole aqui o endereço inteiro dessa página, copiado da barra do navegador.',
    invalid:
      'Cole o endereço inteiro em que o navegador parou, começando em http://localhost:51121/oauth-callback?',
  },
} as const satisfies Record<PasteKind, { label: string; help: string; invalid: string }>

function isSecure(url: string): boolean {
  return URL.canParse(url) && new URL(url).protocol === 'https:'
}

/** The address to open, as a link only when it is a secure web address the vendor's page uses. */
function OpenAddress({ url }: { url: string }) {
  const secure = isSecure(url)
  return (
    <div className="flex flex-col gap-xs">
      {secure ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="underline">
          Abrir a página de entrada
        </a>
      ) : (
        <p>Abra a página de entrada no endereço abaixo.</p>
      )}
      <p className="break-all font-mono text-fact text-label text-text-2">{url}</p>
    </div>
  )
}

function StartForm(props: {
  companyId: CompanyId
  owner: Owner
  kinds: readonly SignInKind[]
  onStarted: (started: Started) => void
}) {
  const send = useMutation(sendSignInStart)
  const kindId = useId()
  const form = useSchemaForm(startModelAccountSignIn.input.body, {
    owner: props.owner,
    kind: props.kinds[0],
    label: '',
  })
  const kind = useWatch({ control: form.control, name: 'kind' })

  async function submit(values: typeof startModelAccountSignIn.input.body._output) {
    try {
      const started = await send.mutateAsync({
        params: { companyId: props.companyId },
        body: values,
      })
      if (started.entry === 'device') props.onStarted(started)
      else if (!isDeviceKind(values.kind)) props.onStarted({ ...started, kind: values.kind })
    } catch (error) {
      setServerError(form, error)
    }
  }

  return (
    <Form form={form} onSubmit={submit}>
      <Field>
        <FieldLabel htmlFor={kindId}>Tipo de assinatura</FieldLabel>
        <Controller
          name="kind"
          control={form.control}
          render={({ field }) => (
            <Choice
              id={kindId}
              value={field.value ?? null}
              placeholder="Escolha o tipo"
              options={props.kinds.map((one) => ({ value: one, label: KIND_NAMES[one] }))}
              onChange={field.onChange}
            />
          )}
        />
      </Field>
      <TextField
        name="label"
        label="Nome da conta"
        type="text"
        autoComplete="off"
        invalid={`Escreva o nome da conta, com até ${ACCOUNT_LABEL_MAX_LENGTH} caracteres.`}
      />
      <FormAlert />
      <SubmitButton
        idle={kind && isDeviceKind(kind) ? 'Gerar código' : 'Gerar endereço de entrada'}
        pending="Gerando…"
      />
    </Form>
  )
}

function CodeForm(props: {
  companyId: CompanyId
  started: Extract<Started, { entry: 'paste' }>
  onLinked: (account: ModelAccount) => void
  onFailed: (sentence: string) => void
}) {
  const { started } = props
  const send = useMutation(sendSignInCompletion)
  const form = useSchemaForm(completeModelAccountSignIn.input.body, { code: '' })

  async function submit(values: { code: string }) {
    try {
      const { account } = await send.mutateAsync({
        params: { companyId: props.companyId, signInId: started.signInId },
        body: values,
      })
      props.onLinked(account)
    } catch (error) {
      props.onFailed(sentenceOf(error))
    }
  }

  return (
    <Form form={form} onSubmit={submit}>
      <OpenAddress url={started.url} />
      <p className="text-label text-text-2">{`O endereço vale até ${dayAndHour(started.expiresAt)}.`}</p>
      <p className="text-label text-text-2">{CODE_FIELDS[started.kind].help}</p>
      <TextField
        name="code"
        label={CODE_FIELDS[started.kind].label}
        type="text"
        autoComplete="off"
        invalid={CODE_FIELDS[started.kind].invalid}
      />
      <FormAlert />
      <SubmitButton idle="Entrar" pending="Entrando…" />
    </Form>
  )
}

/**
 * The code to type on the vendor's page. The wait asks the Hub once per `retryMs`, by a timer, and
 * a 502 keeps the wait with the Hub's sentence; any other answer that ends it sends the person back.
 */
function DeviceView(props: {
  companyId: CompanyId
  started: Extract<Started, { entry: 'device' }>
  onPolling: (polling: boolean) => void
  onLinked: (account: ModelAccount) => void
  onFailed: (sentence: string) => void
}) {
  const { started } = props
  const poll = useMutation(sendSignInPoll)
  const [turn, setTurn] = useState({ n: 0, delay: started.retryMs })
  const [unavailable, setUnavailable] = useState<string | undefined>(undefined)
  const polling = useEffectEvent(props.onPolling)
  const linked = useEffectEvent(props.onLinked)
  const failed = useEffectEvent(props.onFailed)
  const { mutateAsync } = poll

  useEffect(() => {
    polling(poll.isPending)
    return () => polling(false)
  }, [poll.isPending])

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        const reply = await mutateAsync({
          params: { companyId: props.companyId, signInId: started.signInId },
        })
        if (reply.status === 'linked') return linked(reply.account)
        setUnavailable(undefined)
        setTurn((last) => ({ n: last.n + 1, delay: reply.retryMs }))
      } catch (error) {
        if (error instanceof HubFailure && error.code === 'MODEL_ACCOUNT_UNAVAILABLE') {
          setUnavailable(sentenceOf(error))
          setTurn((last) => ({ n: last.n + 1, delay: started.retryMs }))
        } else {
          failed(sentenceOf(error))
        }
      }
    }, turn.delay)
    return () => window.clearTimeout(timer)
  }, [turn, mutateAsync, props.companyId, started.signInId, started.retryMs])

  return (
    <div className="flex flex-col gap-md">
      <p>Digite este código na página da OpenAI</p>
      <p className="break-all select-all font-mono text-heading">{started.userCode}</p>
      {isSecure(started.url) ? (
        <a href={started.url} target="_blank" rel="noopener noreferrer" className="underline">
          Abrir a página da OpenAI
        </a>
      ) : (
        <p className="break-all font-mono text-fact text-text-2">{started.url}</p>
      )}
      <p className="text-label text-text-2">{`O código vale até ${dayAndHour(started.expiresAt)}.`}</p>
      {unavailable && <p role="alert">{unavailable}</p>}
      <p role="status" className="flex items-center gap-sm text-label text-text-2">
        <Loader2Icon aria-hidden="true" className="size-4 motion-safe:animate-spin" />
        Esperando você digitar o código…
      </p>
    </div>
  )
}

/**
 * "Entrar com assinatura": the Hub starts the sign-in and gives the address to open, then the person
 * pastes the code the vendor shows. Whatever ends the sign-in without an account sends the person
 * back to the start, with the Hub's sentence above it.
 */
export function SignInForm(props: {
  companyId: CompanyId
  owner: Owner
  kinds: readonly SignInKind[]
  onLinked: (account: ModelAccount) => void
  /** True while a wait is in the air, so the window can keep its Cancelar off. */
  onPolling: (polling: boolean) => void
}) {
  const [started, setStarted] = useState<Started | undefined>(undefined)
  const [failure, setFailure] = useState<string | undefined>(undefined)
  function failed(sentence: string) {
    setStarted(undefined)
    setFailure(sentence)
  }
  if (started) {
    return started.entry === 'device' ? (
      <DeviceView
        companyId={props.companyId}
        started={started}
        onPolling={props.onPolling}
        onLinked={props.onLinked}
        onFailed={failed}
      />
    ) : (
      <CodeForm
        companyId={props.companyId}
        started={started}
        onLinked={props.onLinked}
        onFailed={failed}
      />
    )
  }
  return (
    <div className="flex flex-col gap-lg">
      <FieldError tabIndex={-1} ref={(node) => node?.focus()}>
        {failure}
      </FieldError>
      <StartForm
        companyId={props.companyId}
        owner={props.owner}
        kinds={props.kinds}
        onStarted={(next) => {
          setFailure(undefined)
          setStarted(next)
        }}
      />
    </div>
  )
}
