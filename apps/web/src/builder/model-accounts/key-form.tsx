import type { CompanyId, ModelAccount, Owner, Provider } from '@conexus/hub-api'
import { ACCOUNT_LABEL_MAX_LENGTH, connectModelAccount } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { keepsAttemptKey, useAttemptKey } from '../../platform/attempt-key.ts'
import { HubFailure } from '../../platform/hub.ts'
import {
  Form,
  FormAlert,
  SubmitButton,
  setServerError,
  TextField,
  useSchemaForm,
} from '../../ui/form.tsx'
import { ProviderChoice } from './provider-choice.tsx'
import { sendConnection } from './queries.ts'

const UNCONFIRMED = 'Não confirmamos a ligação. Tente de novo.'

/**
 * "Ligar conta" by an API key: the Hub seals it and answers with its last four characters, never the
 * key, and the field is cleared once it is linked. The attempt key stays until the Hub settles the
 * outcome (web W24); a key the Hub refused stays in its field, for the person to correct.
 */
export function KeyForm(props: {
  companyId: CompanyId
  owner: Owner
  providers: readonly Provider[]
  onLinked: (account: ModelAccount) => void
}) {
  const send = useMutation(sendConnection)
  const attempt = useAttemptKey()
  const form = useSchemaForm(connectModelAccount.input.body, {
    owner: props.owner,
    provider: '',
    label: '',
    key: '',
  })

  async function submit(values: typeof connectModelAccount.input.body._output) {
    try {
      const { account } = await attempt((attemptKey) =>
        send.mutateAsync({ params: { companyId: props.companyId }, body: values, attemptKey }),
      )
      form.reset()
      props.onLinked(account)
    } catch (error) {
      if (!(error instanceof HubFailure)) setServerError(form, error)
      else if (error.code === 'MODEL_ACCOUNT_INVALID') setServerError(form, error, 'key')
      else if (keepsAttemptKey(error)) {
        form.setError('root.server', { type: 'server', message: UNCONFIRMED })
      } else setServerError(form, error)
    }
  }

  return (
    <Form form={form} onSubmit={submit}>
      <ProviderChoice providers={props.providers} />
      <TextField
        name="label"
        label="Nome da conta"
        type="text"
        autoComplete="off"
        invalid={`Escreva o nome da conta, com até ${ACCOUNT_LABEL_MAX_LENGTH} caracteres.`}
      />
      <TextField
        name="key"
        label="Chave de API"
        type="password"
        autoComplete="off"
        invalid="Cole a chave."
      />
      <FormAlert />
      <SubmitButton idle="Ligar conta" pending="Ligando…" />
    </Form>
  )
}
