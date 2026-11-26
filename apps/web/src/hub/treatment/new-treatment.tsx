import type { CompanyId, TreatmentModelId } from '@conexus/hub-api'
import {
  LAKE_TABLE_NAME_MAX,
  ProposeTreatment,
  ProposeTreatmentVersion,
  TREATMENT_DESCRIPTION_MAX,
  TREATMENT_SQL_MAX,
} from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { HubFailure, sentenceOf, unconfirmedText, writeFailureText } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { Dialog, DialogContent } from '../../ui/dialog.tsx'
import { Field, FieldError, FieldLabel } from '../../ui/field.tsx'
import { Form, FormAlert, SubmitButton, useFieldError, useSchemaForm } from '../../ui/form.tsx'
import { Input } from '../../ui/input.tsx'
import { Textarea } from '../../ui/textarea.tsx'
import { sendProposal, sendVersion } from './queries.ts'
import {
  DESCRIPTION_LABEL,
  NAME_INVALID,
  NAME_LABEL,
  NEW_TREATMENT,
  PROPOSE_CHANGE,
  SAVE,
  SAVING,
  SQL_LABEL,
  SQL_REQUIRED,
  UNCONFIRMED_NEXT,
  UNCONFIRMED_WHAT,
} from './text.ts'

type Refusal = { field: 'name' | 'sql' | null; text: string }

const ON_THE_NAME = new Set(['TREATMENT_NAME_TAKEN'])
const ON_THE_SQL = new Set([
  'TREATMENT_SQL_INVALID',
  'TREATMENT_SQL_NOT_A_QUERY',
  'TREATMENT_SQL_TEMPLATE',
  'TREATMENT_INPUT_UNQUALIFIED',
  'TREATMENT_INPUT_UNKNOWN',
  'TREATMENT_INPUT_CYCLE',
])

/** Where a refusal of a proposal shows: on the field it blames, with the table or the place in the SQL it names; above the button otherwise. */
function refusalOf(error: unknown): Refusal {
  const sentence = writeFailureText(error, unconfirmedText(UNCONFIRMED_WHAT, UNCONFIRMED_NEXT))
  if (!(error instanceof HubFailure) || error.outcomeUnknown) return { field: null, text: sentence }
  const place =
    error.position === undefined
      ? ''
      : ` Linha ${error.position.line}, coluna ${error.position.column}.`
  const table = error.table === undefined ? '' : ` ${error.table}`
  if (ON_THE_NAME.has(error.code)) return { field: 'name', text: sentenceOf(error) }
  if (ON_THE_SQL.has(error.code))
    return { field: 'sql', text: `${sentenceOf(error)}${table}${place}` }
  return { field: null, text: sentence }
}

function InputField(props: { name: string; label: string; maxLength: number; invalid?: string }) {
  const { register } = useFormContext()
  const shown = useFieldError(props.name, props.invalid)
  return (
    <Field {...shown.field}>
      <FieldLabel htmlFor={shown.id}>{props.label}</FieldLabel>
      <Input
        id={shown.id}
        autoComplete="off"
        maxLength={props.maxLength}
        {...shown.control}
        {...register(props.name)}
      />
      <FieldError id={shown.errorId}>{shown.message}</FieldError>
    </Field>
  )
}

function SqlField() {
  const { register } = useFormContext()
  const shown = useFieldError('sql', SQL_REQUIRED)
  return (
    <Field {...shown.field}>
      <FieldLabel htmlFor={shown.id}>{SQL_LABEL}</FieldLabel>
      <Textarea
        id={shown.id}
        spellCheck={false}
        className="min-h-40 font-mono"
        maxLength={TREATMENT_SQL_MAX}
        {...shown.control}
        {...register('sql')}
      />
      <FieldError id={shown.errorId}>{shown.message}</FieldError>
    </Field>
  )
}

function NewForm(props: { companyId: CompanyId; onSaved: (id: TreatmentModelId) => void }) {
  const send = useMutation(sendProposal)
  const form = useSchemaForm(ProposeTreatment, { name: '', description: '', sql: '' })
  return (
    <Form
      form={form}
      onSubmit={async (values) => {
        try {
          const saved = await send.mutateAsync({
            params: { companyId: props.companyId },
            body: values,
          })
          props.onSaved(saved.id)
        } catch (error) {
          const { field, text } = refusalOf(error)
          form.setError(field ?? 'root.server', { type: 'server', message: text })
        }
      }}
    >
      <InputField
        name="name"
        label={NAME_LABEL}
        maxLength={LAKE_TABLE_NAME_MAX}
        invalid={NAME_INVALID}
      />
      <InputField
        name="description"
        label={DESCRIPTION_LABEL}
        maxLength={TREATMENT_DESCRIPTION_MAX}
      />
      <SqlField />
      <FormAlert />
      <SubmitButton idle={SAVE} pending={SAVING} />
    </Form>
  )
}

function ChangeForm(props: {
  companyId: CompanyId
  modelId: TreatmentModelId
  sql: string
  description: string
  onSaved: () => void
}) {
  const send = useMutation(sendVersion)
  const form = useSchemaForm(ProposeTreatmentVersion, {
    sql: props.sql,
    description: props.description,
  })
  return (
    <Form
      form={form}
      onSubmit={async (values) => {
        try {
          await send.mutateAsync({
            params: { companyId: props.companyId, modelId: props.modelId },
            body: values,
          })
          props.onSaved()
        } catch (error) {
          const { field, text } = refusalOf(error)
          form.setError(field === 'sql' ? 'sql' : 'root.server', { type: 'server', message: text })
        }
      }}
    >
      <InputField
        name="description"
        label={DESCRIPTION_LABEL}
        maxLength={TREATMENT_DESCRIPTION_MAX}
      />
      <SqlField />
      <FormAlert />
      <SubmitButton idle={SAVE} pending={SAVING} />
    </Form>
  )
}

function Opened(props: { label: string; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>{props.label}</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={props.label} size="ask">
          {props.children(() => setOpen(false))}
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Novo tratamento: the empty form; once saved the person lands on the new treatment, which waits for the yes. */
export function NewTreatment({ companyId }: { companyId: CompanyId }) {
  const navigate = useNavigate()
  return (
    <Opened label={NEW_TREATMENT}>
      {() => (
        <NewForm
          companyId={companyId}
          onSaved={(modelId) =>
            void navigate({
              to: '/companies/$companyId/data/business/$modelId',
              params: { companyId, modelId },
            })
          }
        />
      )}
    </Opened>
  )
}

/** Propor mudança: the form with the bound version's SQL and the description, saved as a new proposal that leaves the bound version in place. */
export function ProposeChange(props: {
  companyId: CompanyId
  modelId: TreatmentModelId
  sql: string
  description: string
}) {
  return (
    <Opened label={PROPOSE_CHANGE}>{(close) => <ChangeForm {...props} onSaved={close} />}</Opened>
  )
}
