import type { CompanyId, Provider } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { Button } from '../../ui/button.tsx'
import { Field, FieldError, FieldLabel } from '../../ui/field.tsx'
import { Input } from '../../ui/input.tsx'
import { Choice } from './choice.tsx'
import { sendDefaultModel } from './queries.ts'
import { plain, refusalText } from './text.ts'

/** Models shown at once: the registry holds thousands, and a search narrows them. */
const SHOWN = 50

/**
 * The company's default model, any model of the registry as `provider/model`: the provider first,
 * then a search over that provider's models. The change is saved by its button.
 */
export function DefaultModel(props: {
  companyId: CompanyId
  providers: readonly Provider[]
  current: string | null
}) {
  const [picked, setPicked] = useState(props.current ?? '')
  const [provider, setProvider] = useState(
    props.providers.find((one) => props.current?.startsWith(`${one.id}/`))?.id ?? '',
  )
  const [search, setSearch] = useState('')
  const send = useMutation(sendDefaultModel)
  const providerId = useId()
  const searchId = useId()
  const modelId = useId()
  const models = props.providers.find((one) => one.id === provider)?.models ?? []
  const wanted = plain(search.trim())
  const matches = models.filter((model) => plain(model).includes(wanted))
  const options = matches.slice(0, SHOWN).map((model) => ({
    value: `${provider}/${model}`,
    label: model,
  }))
  return (
    <form
      className="flex w-full max-w-column flex-col gap-sm"
      onSubmit={(event) => {
        event.preventDefault()
        send.mutate({ params: { companyId: props.companyId }, body: { model: picked } })
      }}
    >
      <Field>
        <FieldLabel htmlFor={providerId}>Fornecedor do modelo padrão</FieldLabel>
        <Choice
          id={providerId}
          value={provider}
          placeholder="Escolha um fornecedor"
          options={props.providers.map((one) => ({ value: one.id, label: one.name }))}
          onChange={(next) => {
            setProvider(next)
            setSearch('')
            setPicked('')
          }}
        />
      </Field>
      {provider !== '' && (
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
            <FieldLabel htmlFor={modelId}>Modelo padrão</FieldLabel>
            {options.length === 0 ? (
              <p className="text-text-2">Nenhum modelo encontrado.</p>
            ) : (
              <Choice
                id={modelId}
                value={picked}
                placeholder="Escolha um modelo"
                options={options}
                onChange={setPicked}
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
      {picked !== '' && <p className="text-label text-text-2">{`Escolhido: ${picked}`}</p>}
      <FieldError>{send.isError ? refusalText(send.error) : undefined}</FieldError>
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
