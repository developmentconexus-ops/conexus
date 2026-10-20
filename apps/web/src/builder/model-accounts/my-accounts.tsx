import type { ModelAccount, ProviderOrder } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useRef } from 'react'
import { PageTitle, SectionTitle } from '../../ui/list.tsx'
import { Empty } from '../../ui/states.tsx'
import { LinkAccount } from './link-account.tsx'
import { accountsQuery, providersQuery } from './queries.ts'
import { Queue } from './queue.tsx'
import { providerName, providersOf, queueOf } from './text.ts'

const route = getRouteApi('/_app/companies/$companyId_/settings/my-model-accounts')

/** "Sua ordem para Anthropic: Time 2, Time 1": the person's own, then those given, then the company's. */
function OrderLine(props: {
  entry: ProviderOrder
  accounts: readonly ModelAccount[]
  name: string
}) {
  const names = props.entry.accounts.flatMap(
    (id) => props.accounts.find((one) => one.id === id)?.label ?? [],
  )
  if (names.length === 0) return null
  return <li>{`Sua ordem para ${props.name}: ${names.join(', ')}`}</li>
}

/**
 * "Minhas contas de modelo": the person's own accounts in this company, which they link, order,
 * pause, rename and remove, and the order each provider is tried in for them.
 */
export function MyAccounts() {
  const { companyId } = route.useParams()
  const accounts = useSuspenseQuery(accountsQuery(companyId)).data
  const { providers } = useSuspenseQuery(providersQuery).data
  const section = useRef<HTMLElement>(null)
  const { mine, company } = accounts
  return (
    <div className="flex flex-col gap-xl">
      <PageTitle>Minhas contas de modelo</PageTitle>
      {accounts.order.length > 0 && (
        <ul className="flex flex-col gap-xs">
          {accounts.order.map((entry) => (
            <OrderLine
              key={entry.provider}
              entry={entry}
              accounts={[...mine, ...company]}
              name={providerName(providers, entry.provider)}
            />
          ))}
        </ul>
      )}
      <section
        ref={section}
        tabIndex={-1}
        aria-label="Suas contas"
        className="flex w-full flex-col gap-lg"
      >
        <SectionTitle>Suas contas</SectionTitle>
        {mine.length === 0 && <Empty>Nenhuma conta sua</Empty>}
        {providersOf(mine).map((provider) => (
          <Queue
            key={provider}
            companyId={companyId}
            owner="me"
            provider={provider}
            providerName={providerName(providers, provider)}
            accounts={queueOf(mine, provider)}
            people={[]}
            powers={{ act: true, assign: false }}
            canOrder
            onRemoved={() => section.current?.focus()}
          />
        ))}
        <LinkAccount
          companyId={companyId}
          owner="me"
          providers={providers}
          kinds={accounts.kinds}
        />
      </section>
    </div>
  )
}
