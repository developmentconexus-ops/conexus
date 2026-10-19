import type { Provider } from '@conexus/hub-api'
import { useId, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Field, FieldError, FieldLabel } from '../../ui/field.tsx'
import { useFieldError } from '../../ui/form.tsx'
import { Input } from '../../ui/input.tsx'

/** Matches without caring for case or accents, as a person types a name. */
function plain(text: string): string {
  return text
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/**
 * The provider of a key, chosen from the Hub's list: a search field narrows a native list, which
 * keeps its arrow keys and type-ahead, and the choice stays said in words when the search hides it.
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
          <select
            id={shown.id}
            size={6}
            value={chosen}
            className="w-full rounded-control border border-line bg-surface p-sm text-body text-text"
            {...shown.control}
            onChange={(event) => setValue('provider', event.target.value)}
          >
            {matches.map((one) => (
              <option key={one.id} value={one.id}>
                {one.name}
              </option>
            ))}
          </select>
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
