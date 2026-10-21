import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { DefaultChoice } from './default-choice.tsx'
import { accountsQuery, providersQuery } from './queries.ts'
import { choiceText } from './text.ts'

const route = getRouteApi('/_app/companies/$companyId_/settings/defaults')

/**
 * "Padrões da empresa": the model and reasoning that begin the new conversations of whoever chose
 * none. An owner or an administrator changes them, from the models of the providers the company
 * has an account for; a member reads them and who can change them (design V29).
 */
export function CompanyDefaults() {
  const { companyId } = route.useParams()
  const accounts = useSuspenseQuery(accountsQuery(companyId)).data
  const { providers } = useSuspenseQuery(providersQuery).data
  const { defaults, connected, mayManage } = accounts
  const shown = providers.filter((one) => connected.company.includes(one.id))
  return (
    <div className="flex flex-col gap-lg">
      <p className="text-label text-text-2">Toda a empresa</p>
      <p>
        {defaults.company === null
          ? 'A empresa ainda não tem padrão: as conversas novas começam no modelo inicial.'
          : `Uma conversa nova começa em: ${choiceText(defaults.company)} — padrão da empresa`}
      </p>
      <DefaultChoice
        companyId={companyId}
        scope="company"
        defaults={defaults}
        providers={shown}
        mayChange={mayManage}
      />
    </div>
  )
}
