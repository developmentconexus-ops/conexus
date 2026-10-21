import type { CompanyId, Effort, ModelDefault, ModelId, Provider } from '@conexus/hub-api'
import { runningEffort } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { Button } from '../../ui/button.tsx'
import { Field, FieldError, FieldLabel } from '../../ui/field.tsx'
import { ModelPicker } from './model-picker.tsx'
import { sendDefaultModel, sendMyDefault, sendMyDefaultCleared } from './queries.ts'
import { choiceText, refusalText } from './text.ts'

type Defaults = { company: ModelDefault | null; mine: ModelDefault | null }

/** The levels a model of the list accepts, lowest first. */
function levelsOf(providers: readonly Provider[], model: ModelId | null) {
  return providers.flatMap((one) => one.models).find((one) => one.id === model)?.efforts
}

/**
 * The model and the reasoning a new conversation begins on, for the person (`mine`) or for the
 * company: one button for both, saved by its own button; who may not change it reads why. The form starts again from each saved
 * answer; a refusal is said in the field and what was chosen stays.
 */
export function DefaultChoice(props: {
  companyId: CompanyId
  scope: 'mine' | 'company'
  defaults: Defaults
  providers: readonly Provider[]
  mayChange: boolean
}) {
  const saved = props.defaults[props.scope]
  const key = saved === null ? 'none' : `${saved.model} ${saved.effort}`
  if (!props.mayChange)
    return <p className="text-text-2">Só o dono ou um administrador muda os padrões da empresa.</p>
  return <Editor key={key} {...props} />
}

function Editor(props: Parameters<typeof DefaultChoice>[0]) {
  const saved = props.defaults[props.scope]
  const pickerId = useId()
  const [model, setModel] = useState<ModelId | null>(saved?.model ?? null)
  const [effort, setEffort] = useState<Effort>(saved?.effort ?? 'off')
  const mineSend = useMutation(sendMyDefault)
  const companySend = useMutation(sendDefaultModel)
  const clear = useMutation(sendMyDefaultCleared)
  const send = props.scope === 'mine' ? mineSend : companySend
  const levels = levelsOf(props.providers, model)
  const level = levels === undefined ? effort : runningEffort(levels, effort)
  const unchanged = saved !== null && saved.model === model && saved.effort === level
  const params = { companyId: props.companyId }

  function save() {
    if (model === null) return
    const body = { model, effort: level }
    if (props.scope === 'mine') mineSend.mutate({ params, body })
    else companySend.mutate({ params, body })
  }

  return (
    <form
      className="flex w-full max-w-column flex-col gap-sm"
      onSubmit={(event) => {
        event.preventDefault()
        save()
      }}
    >
      <Field>
        <FieldLabel htmlFor={pickerId}>Modelo e raciocínio</FieldLabel>
        <ModelPicker
          id={pickerId}
          providers={props.providers}
          value={model}
          name="Modelo e raciocínio"
          className="justify-between border-line bg-surface"
          onChange={(next) => setModel(next)}
          effort={{ value: effort, onChange: setEffort }}
        />
      </Field>
      {props.scope === 'mine' && (
        <p className="text-label text-text-2">
          {props.defaults.company === null
            ? 'A empresa ainda não tem padrão.'
            : `Padrão da empresa: ${choiceText(props.defaults.company)}`}
        </p>
      )}
      <FieldError>{send.isError ? refusalText(send.error) : undefined}</FieldError>
      <FieldError>{clear.isError ? refusalText(clear.error) : undefined}</FieldError>
      <div className="flex flex-wrap gap-sm">
        <Button
          type="submit"
          variant="primary"
          disabled={send.isPending || model === null || unchanged}
        >
          {send.isPending ? 'Salvando…' : 'Salvar padrão'}
        </Button>
        {props.scope === 'mine' && saved !== null && (
          <Button disabled={clear.isPending} onClick={() => clear.mutate({ params })}>
            {clear.isPending ? 'Salvando…' : 'Usar o da empresa'}
          </Button>
        )}
      </div>
    </form>
  )
}
