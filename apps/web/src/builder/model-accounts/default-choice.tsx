import type { CompanyId, Defaults, Effort, ModelId, Provider } from '@conexus/hub-api'
import { runningEffort } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import type { RefObject } from 'react'
import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '../../ui/button.tsx'
import { Field, FieldError, FieldLabel } from '../../ui/field.tsx'
import { ModelPicker } from './model-picker.tsx'
import { sendDefaultModel, sendMyDefault, sendMyDefaultCleared } from './queries.ts'
import { choiceText, defaultRefusalText } from './text.ts'

/** The levels a model of the list accepts, lowest first. */
function levelsOf(providers: readonly Provider[], model: ModelId | null) {
  return providers.flatMap((one) => one.models).find((one) => one.id === model)?.efforts
}

type Props = {
  companyId: CompanyId
  scope: 'mine' | 'company'
  defaults: Pick<Defaults, 'company' | 'mine'>
  providers: readonly Provider[]
  mayChange: boolean
}

/**
 * The model and the reasoning a new conversation begins on, for the person (`mine`) or for the
 * company: one button for both, saved by its own button; who may not change it reads why. The form
 * starts again from each saved answer, and focus returns to the model button; a refusal is said
 * in the field and what was chosen stays.
 */
export function DefaultChoice(props: Props) {
  const refocus = useRef(false)
  const saved = props.defaults[props.scope]
  const key = saved === null ? 'none' : `${saved.model} ${saved.effort}`
  if (!props.mayChange)
    return <p className="text-text-2">Só o dono ou um administrador muda os padrões da empresa.</p>
  return <Editor key={key} refocus={refocus} {...props} />
}

type Callbacks = { onError: () => void; onSettled: () => void }

/**
 * One write per action, whatever the clicks in between. Focus returns to the model button once the
 * Hub saved it, in the form that replaces this one (`refocus`).
 */
function useOneWrite(refocus: RefObject<boolean>, pickerId: string) {
  const writing = useRef(false)
  useEffect(() => {
    if (!refocus.current) return
    refocus.current = false
    document.getElementById(pickerId)?.focus()
  }, [refocus, pickerId])
  return function write(send: (callbacks: Callbacks) => void) {
    if (writing.current) return
    writing.current = true
    refocus.current = true
    send({
      onError: () => {
        refocus.current = false
      },
      onSettled: () => {
        writing.current = false
      },
    })
  }
}

function Editor(props: Props & { refocus: RefObject<boolean> }) {
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
  const write = useOneWrite(props.refocus, pickerId)

  function save() {
    if (model === null) return
    const body = { model, effort: level }
    write((callbacks) =>
      props.scope === 'mine'
        ? mineSend.mutate({ params, body }, callbacks)
        : companySend.mutate({ params, body }, callbacks),
    )
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
          className="justify-start border-line bg-surface"
          onChange={(next) => setModel(next)}
          effort={{ value: effort, onChange: setEffort }}
        />
      </Field>
      {props.scope === 'mine' && props.defaults.company !== null && (
        <p className="text-label text-text-2">{`Padrão da empresa: ${choiceText(props.defaults.company)}`}</p>
      )}
      <FieldError>{send.isError ? defaultRefusalText(send.error) : undefined}</FieldError>
      <FieldError>{clear.isError ? defaultRefusalText(clear.error) : undefined}</FieldError>
      <div className="flex flex-wrap gap-sm">
        <Button
          type="submit"
          variant="primary"
          disabled={send.isPending || model === null || unchanged}
        >
          {send.isPending ? 'Salvando…' : 'Salvar padrão'}
        </Button>
        {props.scope === 'mine' && saved !== null && (
          <Button
            disabled={clear.isPending || send.isPending}
            onClick={() => write((callbacks) => clear.mutate({ params }, callbacks))}
          >
            {clear.isPending ? 'Salvando…' : 'Usar o da empresa'}
          </Button>
        )}
      </div>
    </form>
  )
}
