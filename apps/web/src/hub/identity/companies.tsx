import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { buttonVariants } from '../../ui/button.tsx'
import { Empty } from '../../ui/states.tsx'
import { Pager } from './pager.tsx'
import { companiesQuery } from './queries.ts'
import { ROLE_LABELS } from './roles.ts'

const route = getRouteApi('/_app/')

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
        <Empty>Você ainda não participa de nenhuma empresa.</Empty>
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
