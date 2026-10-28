import type { ModelFallback } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useRef } from 'react'
import { everyMemberQuery } from '../../hub/identity/public.ts'
import { SectionTitle } from '../../ui/list.tsx'
import { Empty } from '../../ui/states.tsx'
import { AccountsTable } from './accounts-table.tsx'
import { LinkAccount } from './link-account.tsx'
import { ModelFallbackSection } from './model-fallback.tsx'
import { accountsQuery, providersQuery } from './queries.ts'
import { Queue } from './queue.tsx'
import { providerName, providersOf, queueOf } from './text.ts'

const route = getRouteApi('/_app/companies/$companyId_/settings')

/** The automatic switch as a member reads it, without a way to change. */
function ModelSettingsRead(props: { fallback: ModelFallback }) {
  const { chain, enabled } = props.fallback
  return (
    <dl className="grid w-full max-w-column grid-cols-[auto_1fr] items-baseline gap-x-lg gap-y-sm">
      <dt className="text-label text-text-2">Troca automática</dt>
      <dd>
        {enabled ? 'Ligada' : 'Desligada'}
        {chain.length > 0 && `: ${chain.join(', ')}`}
      </dd>
    </dl>
  )
}

/**
 * "Contas da empresa": the company's accounts, a queue per provider. An owner or an administrator
 * changes them; a member reads them and is told who can (web W34, design V29), the Hub's
 * `mayManage`. After a removal focus moves to the section, as the row it was on is gone.
 */
export function CompanyAccounts() {
  const { companyId } = route.useParams()
  const accounts = useSuspenseQuery(accountsQuery(companyId)).data
  const { providers } = useSuspenseQuery(providersQuery).data
  const members = useSuspenseQuery(everyMemberQuery(companyId)).data
  const section = useRef<HTMLElement>(null)
  const { company, mayManage } = accounts
  return (
    <section
      ref={section}
      tabIndex={-1}
      aria-label="Contas da empresa"
      className="flex w-full flex-col gap-lg"
    >
      <SectionTitle>Contas da empresa</SectionTitle>
      {!mayManage && (
        <p className="text-text-2">
          Só o dono ou um administrador muda as contas de modelo da empresa.
        </p>
      )}
      {company.length === 0 && <Empty>Nenhuma conta ligada</Empty>}
      {company.length > 0 && (
        <AccountsTable>
          {providersOf(company).map((provider) => (
            <Queue
              key={provider}
              companyId={companyId}
              owner="company"
              provider={provider}
              providerName={providerName(providers, provider)}
              accounts={queueOf(company, provider)}
              people={members}
              powers={{ act: mayManage, assign: mayManage }}
              canOrder={mayManage}
              onRemoved={() => section.current?.focus()}
            />
          ))}
        </AccountsTable>
      )}
      {mayManage && (
        <LinkAccount
          companyId={companyId}
          owner="company"
          hasAccounts={company.length > 0}
          providers={providers}
          kinds={accounts.kinds}
        />
      )}
    </section>
  )
}

/** The automatic switch, under the company's accounts: an owner or an administrator changes it. */
export function CompanySwitch() {
  const { companyId } = route.useParams()
  const accounts = useSuspenseQuery(accountsQuery(companyId)).data
  return accounts.mayManage ? (
    <ModelFallbackSection
      companyId={companyId}
      providers={accounts.choices.company}
      fallback={accounts.fallback}
    />
  ) : (
    <ModelSettingsRead fallback={accounts.fallback} />
  )
}
