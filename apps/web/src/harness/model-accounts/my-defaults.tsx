import type { CompanyId, ConversationStart, ModelDefault, Provider } from '@conexus/hub-api'
import { getRouteApi, Link } from '@tanstack/react-router'
import { SettingsSection } from '../../ui/settings-section.tsx'
import { DefaultChoice } from './default-choice.tsx'
import { useAccountsView } from './queries.ts'
import { choiceText, modelProviderName, START_SOURCE_TEXT } from './text.ts'

const route = getRouteApi('/_app/companies/$companyId_/settings/my-defaults')

type Start = ConversationStart | null

/** What a new conversation of the person begins on, and where that comes from. */
function StartLine(props: { start: Start; companyId: CompanyId }) {
  if (props.start === null) {
    return (
      <p>
        Nenhum padrão nem modelo inicial tem conta sua disponível.{' '}
        <Link
          to="/companies/$companyId/settings/model-accounts"
          params={{ companyId: props.companyId }}
          className="underline"
        >
          Minhas contas de modelo
        </Link>
      </p>
    )
  }
  return (
    <p>{`Uma conversa nova começa em: ${choiceText(props.start)} — ${START_SOURCE_TEXT[props.start.from]}`}</p>
  )
}

function SkippedLine(props: {
  mine: ModelDefault | null
  company: ModelDefault | null
  start: Start
  providers: readonly Provider[]
}) {
  const { mine, company, start } = props
  const wanted = mine ?? company
  if (wanted === null || start === null || start.from === (mine === null ? 'company' : 'mine')) {
    return null
  }
  const provider = modelProviderName(props.providers, wanted.model)
  return (
    <p className="text-text-2">{`Você não tem conta disponível para ${provider} agora: as conversas novas começam no ${START_SOURCE_TEXT[start.from]}.`}</p>
  )
}

/**
 * "Meus padrões": the model and reasoning the person's new conversations begin on, from the models
 * of the providers they have an account for; empty, it says how to connect one.
 */
export function MyDefaults() {
  const { companyId } = route.useParams()
  const { defaults, choices, providers } = useAccountsView(companyId)
  return (
    <div className="flex flex-col gap-2xl">
      <SettingsSection
        id="start"
        title="Conversa nova"
        description="Só você. Onde as suas conversas novas começam, e por quê."
      >
        <StartLine start={defaults.start} companyId={companyId} />
        {defaults.mine === null && defaults.company !== null && (
          <p className="text-text-2">Você segue o padrão da empresa.</p>
        )}
        <SkippedLine
          mine={defaults.mine}
          company={defaults.company}
          start={defaults.start}
          providers={providers}
        />
        {defaults.start !== null && (
          <p className="flex flex-wrap items-baseline gap-x-md">
            <span className="min-w-0 break-words">{`Conta usada primeiro (${modelProviderName(providers, defaults.start.model)}): ${defaults.start.account}`}</span>
            <Link
              to="/companies/$companyId/settings/model-accounts"
              params={{ companyId }}
              className="underline"
            >
              Mudar a ordem
            </Link>
          </p>
        )}
      </SettingsSection>
      <SettingsSection
        id="default"
        title="Meu padrão"
        description="O modelo e o raciocínio com que você começa uma conversa nova."
      >
        <DefaultChoice
          companyId={companyId}
          scope="mine"
          defaults={defaults}
          providers={choices.mine}
          allProviders={providers}
          mayChange
        />
      </SettingsSection>
    </div>
  )
}
