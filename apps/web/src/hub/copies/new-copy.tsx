import type { CompanyId, ConnectionId, CopyModelSummary } from '@conexus/hub-api'
import { COPY_INTERVAL_DEFAULT, EnableCopy, FAILURES } from '@conexus/hub-api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { Button, buttonVariants } from '../../ui/button.tsx'
import { Dialog, DialogContent, DialogTrigger } from '../../ui/dialog.tsx'
import { Field, FieldError, FieldLabel } from '../../ui/field.tsx'
import {
  Form,
  FormAlert,
  SubmitButton,
  setServerError,
  setWriteError,
  useFieldError,
  useSchemaForm,
} from '../../ui/form.tsx'
import { ChoiceSelect } from '../../ui/select.tsx'
import { connectionsQuery } from '../connectors/public.ts'
import { INTERVAL_CHOICES } from './interval.tsx'
import { copyModelsQuery, sendCopyEnable } from './queries.ts'
import { ENABLE_COPY, NO_MODEL_CONNECTION, TO_INTEGRATIONS, UNCONFIRMED_ENABLE } from './text.ts'

type Choice = { value: string; label: string }

function ChoiceField(props: {
  name: 'connectionId' | 'model' | 'interval'
  label: string
  items: Choice[]
  invalid: string
  placeholder?: string
  onPick?: (value: string) => void
}) {
  const { control } = useFormContext()
  const { id, errorId, message, field: marks } = useFieldError(props.name, props.invalid)
  return (
    <Field {...marks}>
      <FieldLabel htmlFor={id}>{props.label}</FieldLabel>
      <Controller
        name={props.name}
        control={control}
        render={({ field }) => (
          <ChoiceSelect
            label={props.label}
            placeholder={props.placeholder}
            value={field.value ?? ''}
            items={props.items}
            onValueChange={(next) => {
              field.onChange(next)
              if (next !== null) props.onPick?.(next)
            }}
          />
        )}
      />
      <FieldError id={errorId}>{message}</FieldError>
    </Field>
  )
}

function CopyForm(props: {
  companyId: CompanyId
  connections: { id: ConnectionId; name: string; connector: string }[]
  models: CopyModelSummary[]
  onDone: () => void
}) {
  const { companyId, connections, models } = props
  const attempt = useAttemptKey()
  const send = useMutation(sendCopyEnable)
  const form = useSchemaForm(EnableCopy, {
    connectionId: undefined,
    model: '',
    interval: COPY_INTERVAL_DEFAULT,
  })
  const connector = connections.find((one) => one.id === form.watch('connectionId'))?.connector
  const modelChoices = models
    .filter((model) => model.connector === connector)
    .map((model) => ({ value: model.id, label: model.label }))

  async function submit(values: EnableCopy) {
    try {
      await attempt((attemptKey) =>
        send.mutateAsync({ params: { companyId }, body: values, attemptKey }),
      )
      props.onDone()
    } catch (error) {
      if (error instanceof HubFailure && FAILURES[error.code].actionKind === 'RETRY') {
        setServerError(form, error)
      } else setWriteError(form, error, UNCONFIRMED_ENABLE)
    }
  }

  return (
    <Form form={form} onSubmit={submit}>
      <ChoiceField
        name="connectionId"
        label="Conexão"
        invalid="Escolha a conexão."
        placeholder="Escolha a conexão"
        items={connections.map((one) => ({ value: one.id, label: one.name }))}
        onPick={() => form.setValue('model', '')}
      />
      <ChoiceField
        name="model"
        label="Modelo"
        invalid="Escolha o modelo."
        placeholder="Escolha o modelo"
        items={modelChoices}
      />
      <ChoiceField
        name="interval"
        label="Intervalo"
        invalid="Escolha o intervalo."
        items={INTERVAL_CHOICES}
      />
      <FormAlert />
      <div className="flex flex-wrap gap-sm">
        <SubmitButton idle="Ligar" pending="Ligando…" />
        <Button type="button" onClick={props.onDone}>
          Cancelar
        </Button>
      </div>
    </Form>
  )
}

function DialogBody(props: { companyId: CompanyId; onDone: () => void }) {
  const { companyId } = props
  const connections = useQuery(connectionsQuery(companyId))
  const models = useQuery(copyModelsQuery(companyId))
  const failed = connections.error ?? models.error
  if (failed) return <p role="alert">{sentenceOf(failed)}</p>
  if (connections.data === undefined || models.data === undefined) {
    return <p role="status">Carregando…</p>
  }
  const offered = new Set<string>(models.data.models.map((model) => model.connector))
  const withModels = connections.data.connections.filter((one) => offered.has(one.connector))
  if (withModels.length === 0) {
    return (
      <div className="flex flex-col items-start gap-md">
        <p className="text-text-2">{NO_MODEL_CONNECTION}</p>
        <Link
          to="/companies/$companyId/integrations"
          params={{ companyId }}
          className={buttonVariants()}
        >
          {TO_INTEGRATIONS}
        </Link>
      </div>
    )
  }
  return (
    <CopyForm
      companyId={companyId}
      connections={withModels}
      models={models.data.models}
      onDone={props.onDone}
    />
  )
}

/** **Ligar uma cópia**: the connection, the model of its connector and the interval; one request per attempt (web W24). */
export function NewCopy({ companyId }: { companyId: CompanyId }) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="primary" />}>{ENABLE_COPY}</DialogTrigger>
      <DialogContent
        title={ENABLE_COPY}
        description="O Conexus copia o dado para o banco da empresa e o atualiza no intervalo."
      >
        <DialogBody companyId={companyId} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
