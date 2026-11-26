import type { CompanyId } from '@conexus/hub-api'
import { addNetworkDomain, NETWORK_LIMITS, NetworkDomain } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import type { z } from 'zod'
import { sentenceOfCode, unconfirmedText } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { Dialog, DialogContent, DialogTrigger } from '../../ui/dialog.tsx'
import { Field, FieldError, FieldLabel } from '../../ui/field.tsx'
import {
  Form,
  FormAlert,
  SubmitButton,
  setWriteError,
  useFieldError,
  useSchemaForm,
} from '../../ui/form.tsx'
import { Input } from '../../ui/input.tsx'
import { Fact } from './domain-words.tsx'
import { addNetworkDomainMutation } from './queries.ts'

const UNCONFIRMED = unconfirmedText('a mudança', 'Veja a lista.')

const BodyWithCheckedDomain = addNetworkDomain.input.body.extend({ domain: NetworkDomain })

function HintedField(props: {
  name: 'domain' | 'reason'
  label: string
  hint: ReactNode
  invalid?: string
  maxLength?: number
}) {
  const { register } = useFormContext()
  const shown = useFieldError(props.name, props.invalid)
  const hintId = `${shown.id}-hint`
  return (
    <Field {...shown.field}>
      <FieldLabel htmlFor={shown.id}>{props.label}</FieldLabel>
      <Input
        id={shown.id}
        autoComplete="off"
        maxLength={props.maxLength}
        {...shown.control}
        aria-describedby={[hintId, shown.control['aria-describedby']].filter(Boolean).join(' ')}
        {...register(props.name)}
      />
      <p id={hintId} className="text-label text-text-2">
        {props.hint}
      </p>
      <FieldError id={shown.errorId}>{shown.message}</FieldError>
    </Field>
  )
}

function AddForm({ companyId, onClose }: { companyId: CompanyId; onClose: () => void }) {
  const send = useMutation(addNetworkDomainMutation)
  const form = useSchemaForm(BodyWithCheckedDomain, { domain: '', reason: '' })

  async function submit(body: z.output<typeof BodyWithCheckedDomain>) {
    try {
      await send.mutateAsync({ params: { companyId }, body })
      onClose()
    } catch (error) {
      setWriteError(form, error, UNCONFIRMED, { NETWORK_DOMAIN_INVALID: 'domain' })
    }
  }

  return (
    <Form form={form} onSubmit={submit}>
      <HintedField
        name="domain"
        label="Domínio"
        invalid={sentenceOfCode('NETWORK_DOMAIN_INVALID')}
        hint={
          <>
            Só o nome, como <Fact>loja.exemplo.com.br</Fact>, ou <Fact>*.cdn.exemplo.com</Fact> para
            tudo que termina assim.
          </>
        }
      />
      <HintedField
        name="reason"
        label="Motivo"
        hint={`Fica na lista, para quem ler depois. Até ${NETWORK_LIMITS.reason} caracteres.`}
        invalid="Escreva o motivo."
        maxLength={NETWORK_LIMITS.reason}
      />
      <FormAlert />
      <div className="flex flex-wrap gap-md">
        <SubmitButton idle="Adicionar" pending="Adicionando…" />
        <Button type="button" disabled={form.formState.isSubmitting} onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </Form>
  )
}

export function AddDomain({ companyId }: { companyId: CompanyId }) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="primary" />}>Adicionar</DialogTrigger>
      <DialogContent title="Adicionar domínio">
        <AddForm companyId={companyId} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
