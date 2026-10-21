import type { CompanyId, Defaults, Provider } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { DefaultChoice } from './default-choice.tsx'
import { accountsQuery, providersQuery } from './queries.ts'
import { choiceText, modelProviderName, START_SOURCE_TEXT } from './text.ts'

const route = getRouteApi('/_app/companies/$companyId_/settings/defaults')

type Line = {
  companyId: CompanyId
  start: Defaults['companyStart']
  defaults: Defaults
  providers: readonly Provider[]
}

/** Where the company's conversations begin, and why when the company's default is not it. */
function StartLine({ companyId, start, defaults, providers }: Line) {
  if (start === null) {
    return (
      <p>
        Nenhum padrão nem modelo inicial tem conta da empresa disponível.{' '}
        <Link
          to="/companies/$companyId/settings/model-accounts"
          params={{ companyId }}
          className="underline"
        >
          Contas de modelo
        </Link>
      </p>
    )
  }
  const skipped = defaults.company !== null && start.from !== 'company'
  return (
    <>
      {defaults.company === null && <p>A empresa ainda não tem padrão.</p>}
      <p>{`Uma conversa nova começa em: ${choiceText(start)} — ${START_SOURCE_TEXT[start.from]}`}</p>
      {skipped && defaults.company !== null && (
        <p className="text-text-2">{`A empresa não tem conta disponível para ${modelProviderName(providers, defaults.company.model)} agora: as conversas novas começam no ${START_SOURCE_TEXT[start.from]}.`}</p>
      )}
    </>
  )
}

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
      <StartLine
        companyId={companyId}
        start={defaults.companyStart}
        defaults={defaults}
        providers={providers}
      />
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
