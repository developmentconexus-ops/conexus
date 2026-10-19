import type { CompanyId, Provider } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { Button } from '../../ui/button.tsx'
import { Field, FieldLabel } from '../../ui/field.tsx'
import { sendDefaultModel } from './queries.ts'
import { refusalText } from './text.ts'

/**
 * The company's default model, any model of the registry as `provider/model`. The change is saved
 * by its button, not by the arrow keys that move through the list.
 */
export function DefaultModel(props: {
  companyId: CompanyId
  providers: readonly Provider[]
  current: string | null
}) {
  const [picked, setPicked] = useState(props.current ?? '')
  const send = useMutation(sendDefaultModel)
  const id = useId()
  const listed = props.providers.flatMap((one) => one.models.map((model) => `${one.id}/${model}`))
  return (
    <form
      className="flex w-full max-w-column flex-col gap-sm"
      onSubmit={(event) => {
        event.preventDefault()
        send.mutate({ params: { companyId: props.companyId }, body: { model: picked } })
      }}
    >
      <Field>
        <FieldLabel htmlFor={id}>Modelo padrão</FieldLabel>
        <select
          id={id}
          value={picked}
          onChange={(event) => setPicked(event.target.value)}
          className="h-9 w-full rounded-control border border-line bg-surface px-md text-body text-text"
        >
          {props.current === null && <option value="">Escolha um modelo</option>}
          {props.current !== null && !listed.includes(props.current) && (
            <option value={props.current}>{props.current}</option>
          )}
          {props.providers.map((provider) => (
            <optgroup key={provider.id} label={provider.name}>
              {provider.models.map((model) => (
                <option key={model} value={`${provider.id}/${model}`}>
                  {model}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>
      {send.isError && (
        <p role="alert" className="text-label text-danger">
          {refusalText(send.error)}
        </p>
      )}
      <div>
        <Button
          type="submit"
          disabled={send.isPending || picked === '' || picked === props.current}
        >
          {send.isPending ? 'Salvando…' : 'Salvar modelo padrão'}
        </Button>
      </div>
    </form>
  )
}
