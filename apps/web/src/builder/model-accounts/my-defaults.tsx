import type { CompanyId, ConversationStart, ModelDefault, Provider } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { DefaultChoice } from './default-choice.tsx'
import { accountsQuery, providersQuery } from './queries.ts'
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
          to="/companies/$companyId/settings/my-model-accounts"
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
  const accounts = useSuspenseQuery(accountsQuery(companyId)).data
  const { providers } = useSuspenseQuery(providersQuery).data
  const { defaults, choices } = accounts
  return (
    <div className="flex flex-col gap-lg">
      <p className="text-label text-text-2">Só você</p>
      <StartLine start={defaults.start} companyId={companyId} />
      {defaults.start?.from === 'company' && (
        <p className="text-text-2">Você segue o padrão da empresa.</p>
      )}
      <SkippedLine
        mine={defaults.mine}
        company={defaults.company}
        start={defaults.start}
        providers={providers}
      />
      <DefaultChoice
        companyId={companyId}
        scope="mine"
        defaults={defaults}
        providers={choices.mine}
        mayChange
      />
      {defaults.start !== null && (
        <p className="flex flex-wrap items-baseline gap-x-md">
          <span className="min-w-0 break-words">{`Conta usada primeiro (${modelProviderName(providers, defaults.start.model)}): ${defaults.start.account}`}</span>
          <Link
            to="/companies/$companyId/settings/my-model-accounts"
            params={{ companyId }}
            className="underline"
          >
            Mudar a ordem
          </Link>
        </p>
      )}
    </div>
  )
}
