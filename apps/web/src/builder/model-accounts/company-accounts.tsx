import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { useRef } from 'react'
import { everyMemberQuery } from '../../hub/identity/public.ts'
import { PageTitle } from '../../ui/list.tsx'
import { Empty } from '../../ui/states.tsx'
import { DefaultModel } from './default-model.tsx'
import { LinkAccount } from './link-account.tsx'
import { ModelFallbackSection } from './model-fallback.tsx'
import { accountsQuery, providersQuery } from './queries.ts'
import { Queue } from './queue.tsx'
import { providerName, providersOf, queueOf } from './text.ts'

const route = getRouteApi('/_app/companies/$companyId_/settings/model-accounts')

/**
 * "Contas de modelo": the company's accounts, a queue per provider. An owner or an administrator
 * changes them; a member reads them and is told who can (design V29), the Hub's `mayManage`. After a
 * removal focus moves to the section, as the row it was on is gone.
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
      aria-label="Contas de modelo"
      className="flex w-full flex-col gap-lg"
    >
      <PageTitle>Contas de modelo</PageTitle>
      {mayManage ? (
        <>
          <DefaultModel
            companyId={companyId}
            providers={providers}
            current={accounts.defaultModel}
          />
          <ModelFallbackSection
            companyId={companyId}
            providers={providers}
            fallback={accounts.fallback}
          />
        </>
      ) : (
        <p className="text-text-2">
          Só o dono ou um administrador muda as contas de modelo da empresa.{' '}
          <Link
            to="/companies/$companyId/settings/my-model-accounts"
            params={{ companyId }}
            className="underline"
          >
            Minhas contas de modelo
          </Link>
        </p>
      )}
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
          powers={{ act: mayManage, assign: mayManage }}
          canOrder={mayManage}
          onRemoved={() => section.current?.focus()}
        />
      ))}
      {mayManage && (
        <LinkAccount
          companyId={companyId}
          owner="company"
          providers={providers}
          kinds={accounts.kinds}
        />
      )}
    </section>
  )
}
