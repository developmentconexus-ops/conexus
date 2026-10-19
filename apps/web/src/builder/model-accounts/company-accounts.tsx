import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useRef } from 'react'
import { everyMemberQuery } from '../../hub/identity/public.ts'
import { SectionTitle } from '../../ui/list.tsx'
import { Empty } from '../../ui/states.tsx'
import { DefaultModel } from './default-model.tsx'
import { LinkAccount } from './link-account.tsx'
import { ModelFallbackSection } from './model-fallback.tsx'
import { accountsQuery, providersQuery } from './queries.ts'
import { Queue } from './queue.tsx'
import { providerName, providersOf, queueOf } from './text.ts'

const route = getRouteApi('/_app/companies/$companyId')

/**
 * The company's model accounts, a queue per provider, in "Configurar a empresa", which only an
 * owner or an administrator opens. After a removal focus moves to the section, as the row it was on
 * is gone.
 */
export function CompanyAccounts() {
  const { companyId } = route.useParams()
  const accounts = useSuspenseQuery(accountsQuery(companyId)).data
  const { providers } = useSuspenseQuery(providersQuery).data
  const members = useSuspenseQuery(everyMemberQuery(companyId)).data
  const section = useRef<HTMLElement>(null)
  const { company } = accounts
  return (
    <section
      ref={section}
      tabIndex={-1}
      aria-label="Conta de modelo"
      className="flex w-full flex-col gap-lg"
    >
      <SectionTitle>Conta de modelo</SectionTitle>
      <DefaultModel companyId={companyId} providers={providers} current={accounts.defaultModel} />
      <ModelFallbackSection
        companyId={companyId}
        providers={providers}
        fallback={accounts.fallback}
      />
      {company.length === 0 && <Empty>Nenhuma conta ligada</Empty>}
      {providersOf(company).map((provider) => (
        <Queue
          key={provider}
          companyId={companyId}
          owner="company"
          provider={provider}
          providerName={providerName(providers, provider)}
          accounts={queueOf(company, provider)}
          people={members}
          powers={{ act: true, assign: true }}
          canOrder
          onRemoved={() => section.current?.focus()}
        />
      ))}
      <LinkAccount
        companyId={companyId}
        owner="company"
        providers={providers}
        kinds={accounts.kinds}
      />
    </section>
  )
}
