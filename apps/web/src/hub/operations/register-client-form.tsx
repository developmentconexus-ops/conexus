import { registerClient } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import type { z } from 'zod'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import {
  Form,
  FormAlert,
  SubmitButton,
  setServerError,
  TextField,
  useSchemaForm,
} from '../../ui/form.tsx'
import { PageTitle } from '../../ui/list.tsx'
import { ClientFields, fieldOf, undecided } from './client-fields.tsx'
import { sendRegistration } from './queries.ts'

const UNCONFIRMED = 'Não confirmamos o cadastro. Veja a lista antes de tentar de novo.'

/**
 * "Cadastrar cliente": the company is born with no member, and its administrator gets step 4.1's
 * invitation as its first owner. An answer that did not settle keeps the values and the key.
 */
export function RegisterClientForm() {
  const router = useRouter()
  const send = useMutation({
    ...sendRegistration,
    onSuccess: ({ client }) =>
      router.navigate({
        to: '/operations/clients/$companyId',
        params: { companyId: client.companyId },
      }),
  })
  const attempt = useAttemptKey()
  const form = useSchemaForm(registerClient.input.body, {
    cnpj: '',
    legalName: '',
    name: '',
    ownerEmail: '',
  })

  async function submit(body: z.output<typeof registerClient.input.body>) {
    try {
      await attempt((attemptKey) => send.mutateAsync({ body, attemptKey }))
    } catch (error) {
      if (undecided(error)) form.setError('root.server', { type: 'server', message: UNCONFIRMED })
      else setServerError(form, error, fieldOf(error))
    }
  }

  return (
    <section className="flex w-full max-w-column flex-col gap-lg">
      <PageTitle>Cadastrar cliente</PageTitle>
      <Form form={form} onSubmit={submit}>
        <ClientFields />
        <TextField
          name="ownerEmail"
          label="E-mail do administrador"
          type="email"
          autoComplete="off"
          invalid="Escreva um e-mail."
        />
        <p className="text-label text-text-2">Ele recebe um convite e entra como primeiro dono.</p>
        <FormAlert />
        <SubmitButton idle="Cadastrar cliente" pending="Cadastrando…" />
      </Form>
    </section>
  )
}
