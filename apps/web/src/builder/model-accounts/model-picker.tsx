import type { Provider } from '@conexus/hub-api'
import { providerOfModel } from '@conexus/hub-api'
import { useId, useState } from 'react'
import { Field, FieldLabel } from '../../ui/field.tsx'
import { Input } from '../../ui/input.tsx'
import { Choice } from './choice.tsx'
import { plain } from './text.ts'

/** Models shown at once: the registry holds thousands, and a search narrows them. */
const SHOWN = 50

/**
 * One model of the registry as `provider/model`: the provider first, then a search over that
 * provider's models. `value` is the model picked, null for none; `names` are the labels of the
 * provider and model fields.
 */
export function ModelPicker(props: {
  providers: readonly Provider[]
  value: string | null
  names: { provider: string; model: string }
  onChange: (model: string | null) => void
}) {
  const [provider, setProvider] = useState(() => {
    const of = props.value === null ? null : providerOfModel(props.value)
    return props.providers.find((one) => one.id === of)?.id ?? null
  })
  const [search, setSearch] = useState('')
  const providerId = useId()
  const searchId = useId()
  const modelId = useId()
  const models = props.providers.find((one) => one.id === provider)?.models ?? []
  const wanted = plain(search.trim())
  const matches = models.filter((model) => plain(model.id).includes(wanted))
  const options = matches.slice(0, SHOWN).map((model) => ({
    value: `${provider}/${model.id}`,
    label: model.id,
  }))
  return (
    <>
      <Field>
        <FieldLabel htmlFor={providerId}>{props.names.provider}</FieldLabel>
        <Choice
          id={providerId}
          value={provider}
          placeholder="Escolha um fornecedor"
          options={props.providers.map((one) => ({ value: one.id, label: one.name }))}
          onChange={(next) => {
            setProvider(props.providers.find((one) => one.id === next)?.id ?? null)
            setSearch('')
            props.onChange(null)
          }}
        />
      </Field>
      {provider !== null && (
        <>
          <Field>
            <FieldLabel htmlFor={searchId}>Buscar modelo</FieldLabel>
            <Input
              id={searchId}
              type="search"
              autoComplete="off"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={modelId}>{props.names.model}</FieldLabel>
            {options.length === 0 ? (
              <p className="text-text-2">Nenhum modelo encontrado.</p>
            ) : (
              <Choice
                id={modelId}
                value={props.value}
                placeholder="Escolha um modelo"
                options={options}
                onChange={props.onChange}
              />
            )}
            {matches.length > SHOWN && (
              <p className="text-label text-text-2">
                {`Mostrando ${SHOWN} de ${matches.length} modelos. Busque para ver os outros.`}
              </p>
            )}
          </Field>
        </>
      )}
    </>
  )
}
