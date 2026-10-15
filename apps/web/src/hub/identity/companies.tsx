import type { Next, Role } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { buttonVariants } from '../../ui/button.tsx'
import { companiesQuery } from './queries.ts'

const route = getRouteApi('/_app/')

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Dono',
  admin: 'Administrador',
  member: 'Membro',
}

/**
 * The links that move along a list kept in the address (web W18): the page that follows, and the
 * way back to the first once the person has left it. `link` draws a link to a page of this list.
 */
export function Pager(props: {
  next: Next
  page: string | undefined
  link: (page: string | undefined, label: string) => ReactNode
}) {
  return (
    <div className="flex gap-lg text-label">
      {props.page !== undefined && props.link(undefined, 'Primeira página')}
      {props.next.kind === 'MORE' && props.link(props.next.page, 'Ver mais')}
    </div>
  )
}

/** "Suas empresas": the companies the person belongs to, with the role in each. */
export function Companies() {
  const { page } = route.useSearch()
  const { data } = useSuspenseQuery(companiesQuery(page))
  return (
    <section className="flex flex-col gap-lg">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <h2 className="font-display text-title">Suas empresas</h2>
        {data.mayCreate && (
          <Link to="/companies/new" className={buttonVariants()}>
            Nova empresa
          </Link>
        )}
      </div>
      {data.companies.length === 0 ? (
        <p className="text-text-2">Você ainda não participa de nenhuma empresa.</p>
      ) : (
        <ul className="flex flex-col border-y border-line">
          {data.companies.map(({ company, role }) => (
            <li key={company.id} className="border-b border-line last:border-b-0">
              <Link
                to="/companies/$companyId"
                params={{ companyId: company.id }}
                className="flex items-center justify-between gap-md px-sm py-md hover:bg-surface-3"
              >
                <span className="min-w-0 truncate">{company.name}</span>
                <span className="shrink-0 text-label text-text-2">{ROLE_LABELS[role]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Pager
        next={data.next}
        page={page}
        link={(to, label) => (
          <Link to="/" search={{ page: to }}>
            {label}
          </Link>
        )}
      />
    </section>
  )
}
