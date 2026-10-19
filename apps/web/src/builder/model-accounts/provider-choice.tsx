import type { Provider } from '@conexus/hub-api'
import { useId, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Field, FieldError, FieldLabel } from '../../ui/field.tsx'
import { useFieldError } from '../../ui/form.tsx'
import { Input } from '../../ui/input.tsx'
import { Choice } from './choice.tsx'
import { plain } from './text.ts'

/**
 * The provider of a key, chosen from the Hub's list: a search field narrows the select's list, and
 * the choice stays said in words when the search hides it.
 */
export function ProviderChoice({ providers }: { providers: readonly Provider[] }) {
  const { watch, setValue } = useFormContext()
  const [search, setSearch] = useState('')
  const searchId = useId()
  const shown = useFieldError('provider')
  const chosen = String(watch('provider'))
  const wanted = plain(search.trim())
  const matches = providers.filter((one) => plain(one.name).includes(wanted))
  return (
    <>
      <Field>
        <FieldLabel htmlFor={searchId}>Buscar fornecedor</FieldLabel>
        <Input
          id={searchId}
          type="search"
          autoComplete="off"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </Field>
      <Field {...shown.field}>
        <FieldLabel htmlFor={shown.id}>Fornecedor</FieldLabel>
        {matches.length === 0 ? (
          <p className="text-text-2">Nenhum fornecedor encontrado.</p>
        ) : (
          <Choice
            id={shown.id}
            value={chosen === '' ? null : chosen}
            placeholder="Escolha um fornecedor"
            options={matches.map((one) => ({ value: one.id, label: one.name }))}
            control={shown.control}
            onChange={(next) => setValue('provider', next)}
          />
        )}
        {chosen !== '' && (
          <p className="text-label text-text-2">
            {`Escolhido: ${providers.find((one) => one.id === chosen)?.name ?? chosen}`}
          </p>
        )}
        <FieldError id={shown.errorId}>{shown.message}</FieldError>
      </Field>
    </>
  )
}
