import type { CompanyId, ModelAccount, Owner, SignInKind } from '@conexus/hub-api'
import {
  ACCOUNT_LABEL_MAX_LENGTH,
  completeModelAccountSignIn,
  startModelAccountSignIn,
} from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { Controller } from 'react-hook-form'
import { dayAndHour } from '../../platform/dates.ts'
import { sentenceOf } from '../../platform/hub.ts'
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
import { sendSignInCompletion, sendSignInStart } from './queries.ts'
import { KIND_NAMES } from './text.ts'

type Started = { signInId: string; url: string; expiresAt: string; kind: SignInKind }

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
} as const satisfies Record<SignInKind, { label: string; help: string; invalid: string }>

/** The address to open, as a link only when it is a secure web address the vendor's page uses. */
function OpenAddress({ url }: { url: string }) {
  const secure = URL.canParse(url) && new URL(url).protocol === 'https:'
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

  async function submit(values: typeof startModelAccountSignIn.input.body._output) {
    try {
      const started = await send.mutateAsync({
        params: { companyId: props.companyId },
        body: values,
      })
      props.onStarted({ ...started, kind: values.kind })
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
              options={props.kinds.map((kind) => ({ value: kind, label: KIND_NAMES[kind] }))}
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
      <SubmitButton idle="Gerar endereço de entrada" pending="Gerando…" />
    </Form>
  )
}

function CodeForm(props: {
  companyId: CompanyId
  started: Started
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
 * "Entrar com assinatura": the Hub starts the sign-in and gives the address to open, then the person
 * pastes the code the vendor shows. Whatever ends the sign-in without an account sends the person
 * back to the start, with the Hub's sentence above it.
 */
export function SignInForm(props: {
  companyId: CompanyId
  owner: Owner
  kinds: readonly SignInKind[]
  onLinked: (account: ModelAccount) => void
}) {
  const [started, setStarted] = useState<Started | undefined>(undefined)
  const [failure, setFailure] = useState<string | undefined>(undefined)
  if (started) {
    return (
      <CodeForm
        companyId={props.companyId}
        started={started}
        onLinked={props.onLinked}
        onFailed={(sentence) => {
          setStarted(undefined)
          setFailure(sentence)
        }}
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
