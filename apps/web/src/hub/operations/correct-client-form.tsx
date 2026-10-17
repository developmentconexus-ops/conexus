import type { Client } from '@conexus/hub-api'
import { correctClient } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import type { z } from 'zod'
import { Button } from '../../ui/button.tsx'
import { Form, FormAlert, SubmitButton, setServerError, useSchemaForm } from '../../ui/form.tsx'
import { SectionTitle } from '../../ui/list.tsx'
import { ClientFields, fieldOf } from './client-fields.tsx'
import { maskedCnpj } from './cnpj.ts'
import { sendCorrection } from './queries.ts'

type Correction = z.output<typeof correctClient.input.body>

/** "Corrigir dados": the current values, sent back with the revision they were read at (code C38). */
export function CorrectClientForm({ client, onDone }: { client: Client; onDone: () => void }) {
  const send = useMutation({ ...sendCorrection, onSuccess: onDone })
  const form = useSchemaForm(correctClient.input.body, {
    cnpj: maskedCnpj(client.cnpj),
    legalName: client.legalName,
    name: client.name,
    revision: client.revision,
  })

  async function submit(body: Correction) {
    try {
      await send.mutateAsync({ params: { companyId: client.companyId }, body })
    } catch (error) {
      const field = fieldOf(error)
      setServerError(form, error, field === 'ownerEmail' ? undefined : field)
    }
  }

  return (
    <section className="flex w-full max-w-column flex-col gap-lg">
      <SectionTitle>Corrigir dados</SectionTitle>
      <Form form={form} onSubmit={submit}>
        <ClientFields />
        <FormAlert />
        <SubmitButton idle="Salvar" pending="Salvando…" />
        <Button type="button" disabled={send.isPending} onClick={onDone}>
          Voltar
        </Button>
      </Form>
    </section>
  )
}
