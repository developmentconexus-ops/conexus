import { ModelId } from '@conexus/hub-api'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { writeFailureText } from '../../platform/hub.ts'
import { Field, FieldError, FieldLabel } from '../../ui/field.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select.tsx'
import { SettingsSection } from '../../ui/settings-section.tsx'
import { accountsQuery, modelLabel } from '../model-accounts/public.ts'
import { observationalMemoryModelsQuery, setObservationalMemoryModelMutation } from './queries.ts'

const route = getRouteApi('/_app/companies/$companyId_/settings/observational-memory')

/** The select's value for the role that follows the model of each conversation. */
const FOLLOW = 'follow'
/** The select's value for the cheapest model of the account; it is the saved choice's own word. */
const AUTO = 'auto'

/** The company's Observer and Reflector models: the default is the cheapest model of the account; the two are chosen apart. */
export function ObservationalMemorySettings() {
  const { companyId } = route.useParams()
  const { observer, reflector } = useSuspenseQuery(observationalMemoryModelsQuery(companyId)).data
  const accounts = useSuspenseQuery(accountsQuery(companyId)).data
  const save = useMutation(setObservationalMemoryModelMutation)
  const models = accounts.choices.company.flatMap((provider) => provider.models)
  const options = [
    { value: AUTO, label: 'Automático (o mais barato da conta)' },
    { value: FOLLOW, label: 'Segue o modelo da conversa' },
    ...models.map((model) => ({ value: model.id, label: modelLabel(model.id) })),
  ]

  function select(role: 'observer' | 'reflector', value: string) {
    save.mutate({
      params: { companyId },
      body: { role, model: value === FOLLOW ? null : value === AUTO ? AUTO : ModelId.parse(value) },
    })
  }

  function selector(role: 'observer' | 'reflector', value: string | null, label: string) {
    return (
      <Field>
        <FieldLabel htmlFor={`om-${role}`}>{label}</FieldLabel>
        <Select
          id={`om-${role}`}
          value={value ?? FOLLOW}
          items={options}
          disabled={!accounts.mayManage || save.isPending}
          onValueChange={(next) => next !== null && select(role, next)}
        >
          <SelectTrigger aria-label={label} className="max-w-column">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError>
          {save.isError && save.variables?.body.role === role
            ? writeFailureText(
                save.error,
                'Não foi possível confirmar se o modelo foi salvo. Confira e tente de novo.',
              )
            : undefined}
        </FieldError>
      </Field>
    )
  }

  return (
    <div className="flex flex-col gap-2xl">
      <SettingsSection
        id="observer"
        title="Observador"
        description="Sem escolha, o observador e o refletor usam o modelo mais barato da conta. Quem não tem conta no modelo mais barato, ou no escolhido aqui, usa o da conversa."
      >
        {selector('observer', observer, 'Modelo do observador')}
      </SettingsSection>
      <SettingsSection id="reflector" title="Refletor">
        {selector('reflector', reflector, 'Modelo do refletor')}
        {!accounts.mayManage && (
          <p className="text-text-2">
            Só o dono ou um administrador muda as configurações da empresa.
          </p>
        )}
      </SettingsSection>
    </div>
  )
}
