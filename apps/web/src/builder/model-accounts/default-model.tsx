import type { CompanyId, ModelDefault, Provider } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { Button } from '../../ui/button.tsx'
import { Field, FieldError, FieldLabel } from '../../ui/field.tsx'
import { modelLabel } from './model-label.ts'
import { ModelPicker } from './model-picker.tsx'
import { sendDefaultModel } from './queries.ts'
import { refusalText } from './text.ts'

/** The lowest level a model takes, which U2's slider replaces with the one chosen. */
function lowestEffort(providers: readonly Provider[], model: ModelDefault['model']) {
  const found = providers.flatMap((one) => one.models).find((one) => one.id === model)
  return found?.efforts[0] ?? 'off'
}

/** The company's default model, any model of the registry; the change is saved by its button. */
export function DefaultModel(props: {
  companyId: CompanyId
  providers: readonly Provider[]
  current: ModelDefault | null
}) {
  const [picked, setPicked] = useState(props.current?.model ?? null)
  const send = useMutation(sendDefaultModel)
  const pickerId = useId()
  return (
    <form
      className="flex w-full max-w-column flex-col gap-sm"
      onSubmit={(event) => {
        event.preventDefault()
        if (picked !== null)
          send.mutate({
            params: { companyId: props.companyId },
            body: { model: picked, effort: lowestEffort(props.providers, picked) },
          })
      }}
    >
      <Field>
        <FieldLabel htmlFor={pickerId}>Modelo padrão</FieldLabel>
        <ModelPicker
          id={pickerId}
          providers={props.providers}
          value={picked}
          name="Modelo padrão"
          className="justify-between border-line bg-surface"
          onChange={setPicked}
        />
      </Field>
      {picked !== null && (
        <p className="text-label text-text-2">{`Escolhido: ${modelLabel(picked)}`}</p>
      )}
      <FieldError>{send.isError ? refusalText(send.error) : undefined}</FieldError>
      <div>
        <Button
          type="submit"
          disabled={send.isPending || picked === null || picked === props.current?.model}
        >
          {send.isPending ? 'Salvando…' : 'Salvar modelo padrão'}
        </Button>
      </div>
    </form>
  )
}
