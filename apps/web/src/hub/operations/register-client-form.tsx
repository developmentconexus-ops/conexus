import { registerClient } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
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
// Set while a registration has no whole answer, in the tab's own storage, so a reload that loses the
// attempt key shows the current list and asks instead of a blank form (the founder's answer J).
const IN_FLIGHT = 'conexus-registration-in-flight'

function inFlight(set?: boolean): boolean {
  try {
    if (set === true) sessionStorage.setItem(IN_FLIGHT, '1')
    if (set === false) sessionStorage.removeItem(IN_FLIGHT)
    return sessionStorage.getItem(IN_FLIGHT) !== null
  } catch {
    return false
  }
}

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
  useEffect(() => {
    if (inFlight()) {
      inFlight(false)
      void router.navigate({ to: '/operations/clients', search: { notice: 'unconfirmed' } })
    }
    // Leaving the form inside the app clears the mark; only a reload, which runs no cleanup, keeps it.
    return () => void inFlight(false)
  }, [router])
  const form = useSchemaForm(registerClient.input.body, {
    cnpj: '',
    legalName: '',
    name: '',
    ownerEmail: '',
  })

  async function submit(body: z.output<typeof registerClient.input.body>) {
    try {
      inFlight(true)
      await attempt((attemptKey) => send.mutateAsync({ body, attemptKey }))
      inFlight(false)
    } catch (error) {
      if (undecided(error)) form.setError('root.server', { type: 'server', message: UNCONFIRMED })
      else {
        inFlight(false)
        setServerError(form, error, fieldOf(error))
      }
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
