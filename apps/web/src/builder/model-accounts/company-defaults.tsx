import type { CompanyId, Defaults, Provider } from '@conexus/hub-api'
import { getRouteApi, Link } from '@tanstack/react-router'
import { SettingsSection } from '../../ui/settings-section.tsx'
import { DefaultChoice } from './default-choice.tsx'
import { useAccountsView } from './queries.ts'
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
      <p>{`Com as contas da empresa, uma conversa nova começa em: ${choiceText(start)} — ${START_SOURCE_TEXT[start.from]}`}</p>
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
  const { defaults, choices, mayManage, providers } = useAccountsView(companyId)
  return (
    <div className="flex flex-col gap-2xl">
      <SettingsSection
        id="start"
        title="Conversa nova"
        description="Toda a empresa. Onde as conversas novas começam, e por quê."
      >
        <StartLine
          companyId={companyId}
          start={defaults.companyStart}
          defaults={defaults}
          providers={providers}
        />
      </SettingsSection>
      <SettingsSection
        id="default"
        title="Padrão da empresa"
        description="O modelo e o raciocínio de quem não escolheu nenhum."
      >
        <DefaultChoice
          companyId={companyId}
          scope="company"
          defaults={defaults}
          providers={choices.company}
          mayChange={mayManage}
        />
      </SettingsSection>
    </div>
  )
}
