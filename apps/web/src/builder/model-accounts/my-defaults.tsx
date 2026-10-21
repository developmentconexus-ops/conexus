import type {
  CompanyId,
  ModelAccount,
  ModelDefault,
  Provider,
  ProviderOrder,
  StartSource,
} from '@conexus/hub-api'
import { providerOfModel } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { DefaultChoice } from './default-choice.tsx'
import { accountsQuery, providersQuery } from './queries.ts'
import { choiceText, modelProviderName, START_SOURCE_TEXT } from './text.ts'

const route = getRouteApi('/_app/companies/$companyId_/settings/my-defaults')

type Start = (ModelDefault & { from: StartSource }) | null

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

/** The first account the person's queue would call for the provider, by the order the Hub gives. */
function firstAccount(
  order: readonly ProviderOrder[],
  accounts: readonly ModelAccount[],
  model: string,
) {
  const entry = order.find((one) => one.provider === providerOfModel(model))
  return entry?.accounts
    .map((id) => accounts.find((one) => one.id === id))
    .find((one) => one?.state === 'ready' && one.limitedUntil === null && !one.kindOff)
}

function SkippedLine(props: {
  mine: ModelDefault | null
  start: Start
  providers: readonly Provider[]
}) {
  const { mine, start } = props
  if (mine === null || start === null || start.from === 'mine') return null
  const provider = modelProviderName(props.providers, mine.model)
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
  const { defaults, connected, order, mine, company } = accounts
  const shown = providers.filter((one) => connected.mine.includes(one.id))
  const first =
    defaults.start === null
      ? undefined
      : firstAccount(order, [...mine, ...company], defaults.start.model)
  return (
    <div className="flex flex-col gap-lg">
      <p className="text-label text-text-2">Só você</p>
      <StartLine start={defaults.start} companyId={companyId} />
      {defaults.mine === null && <p className="text-text-2">Você segue o padrão da empresa.</p>}
      <SkippedLine mine={defaults.mine} start={defaults.start} providers={providers} />
      <DefaultChoice
        companyId={companyId}
        scope="mine"
        defaults={defaults}
        providers={shown}
        mayChange
      />
      {defaults.start !== null && first && (
        <p className="flex flex-wrap items-baseline gap-x-md">
          {`Conta usada primeiro (${modelProviderName(providers, defaults.start.model)}): ${first.label}`}
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
