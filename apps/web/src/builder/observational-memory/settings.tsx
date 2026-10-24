import { ModelId } from '@conexus/hub-api'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { writeFailureText } from '../../platform/hub.ts'
import { Field, FieldError, FieldLabel } from '../../ui/field.tsx'
import { accountsQuery } from '../model-accounts/public.ts'
import { observationalMemoryModelsQuery, setObservationalMemoryModelMutation } from './queries.ts'

const route = getRouteApi('/_app/companies/$companyId_/settings/observational-memory')

/** The company's Observer and Reflector models: none follows each conversation's model; the two are chosen apart. */
export function ObservationalMemorySettings() {
  const { companyId } = route.useParams()
  const { observer, reflector } = useSuspenseQuery(observationalMemoryModelsQuery(companyId)).data
  const accounts = useSuspenseQuery(accountsQuery(companyId)).data
  const save = useMutation(setObservationalMemoryModelMutation)
  const models = accounts.choices.company.flatMap((provider) => provider.models)

  function select(role: 'observer' | 'reflector', value: string) {
    save.mutate({
      params: { companyId },
      body: { role, model: value === '' ? null : ModelId.parse(value) },
    })
  }

  function selector(role: 'observer' | 'reflector', value: ModelId | null, label: string) {
    return (
      <Field>
        <FieldLabel htmlFor={`om-${role}`}>{label}</FieldLabel>
        <select
          id={`om-${role}`}
          aria-label={label}
          className="h-9 w-full max-w-column rounded-control border border-line bg-surface px-md text-text disabled:cursor-not-allowed disabled:opacity-50"
          value={value ?? ''}
          disabled={!accounts.mayManage || save.isPending}
          onChange={(event) => select(role, event.currentTarget.value)}
        >
          <option value="">Segue o modelo da conversa</option>
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.id}
            </option>
          ))}
        </select>
      </Field>
    )
  }

  return (
    <section
      aria-label="Memória observacional"
      className="flex w-full max-w-column flex-col gap-lg"
    >
      <p className="text-text-2">
        Sem escolha, o observador e o refletor seguem o modelo da conversa. Quem não tem conta no
        modelo escolhido aqui também segue o da conversa.
      </p>
      {selector('observer', observer, 'Modelo do observador')}
      {selector('reflector', reflector, 'Modelo do refletor')}
      {!accounts.mayManage && (
        <p className="text-text-2">
          Só o dono ou um administrador muda as configurações da empresa.
        </p>
      )}
      <FieldError>
        {save.isError
          ? writeFailureText(
              save.error,
              'Não foi possível confirmar se o modelo foi salvo. Confira e tente de novo.',
            )
          : undefined}
      </FieldError>
    </section>
  )
}
