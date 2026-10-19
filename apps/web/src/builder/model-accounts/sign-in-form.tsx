import type { CompanyId, ModelAccount, Owner, SignInKind } from '@conexus/hub-api'
import {
  ACCOUNT_LABEL_MAX_LENGTH,
  completeModelAccountSignIn,
  startModelAccountSignIn,
} from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { dayAndHour } from '../../platform/dates.ts'
import { sentenceOf } from '../../platform/hub.ts'
import { Field, FieldLabel } from '../../ui/field.tsx'
import {
  Form,
  FormAlert,
  SubmitButton,
  setServerError,
  TextField,
  useSchemaForm,
} from '../../ui/form.tsx'
import { sendSignInCompletion, sendSignInStart } from './queries.ts'
import { KIND_NAMES } from './text.ts'

type Started = { signInId: string; url: string; expiresAt: string; kind: SignInKind }

const CODE_LABELS = {
  claude_subscription: 'Código da Anthropic',
  google_cliproxy: 'Endereço ou código do Google',
} as const satisfies Record<SignInKind, string>

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
        <FieldLabel htmlFor="sign-in-kind">Tipo de assinatura</FieldLabel>
        <select
          id="sign-in-kind"
          className="h-9 w-full rounded-control border border-line bg-surface px-md text-body text-text"
          {...form.register('kind')}
        >
          {props.kinds.map((kind) => (
            <option key={kind} value={kind}>
              {KIND_NAMES[kind]}
            </option>
          ))}
        </select>
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
      <TextField
        name="code"
        label={CODE_LABELS[started.kind]}
        type="text"
        autoComplete="off"
        invalid="Cole o código."
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
      {failure && (
        <p role="alert" tabIndex={-1} ref={(node) => node?.focus()} className="text-danger">
          {failure}
        </p>
      )}
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
