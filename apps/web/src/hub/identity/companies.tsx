import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { buttonVariants } from '../../ui/button.tsx'
import { List, Row, rowBody, SectionTitle } from '../../ui/list.tsx'
import { Pager } from '../../ui/pager.tsx'
import { Empty } from '../../ui/states.tsx'
import { companiesQuery } from './queries.ts'
import { RoleBadge } from './role-badge.tsx'

const route = getRouteApi('/_app/')

export function Companies() {
  const { page } = route.useSearch()
  const { data } = useSuspenseQuery(companiesQuery(page))
  return (
    <section className="flex flex-col gap-lg">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <SectionTitle>Suas empresas</SectionTitle>
        {data.mayOperate && (
          <Link to="/companies/new" className={buttonVariants()}>
            Nova empresa
          </Link>
        )}
      </div>
      {data.companies.length === 0 ? (
        <Empty>Você ainda não participa de nenhuma empresa.</Empty>
      ) : (
        <List>
          {data.companies.map(({ company, role }) => (
            <Row key={company.id}>
              <Link
                to="/companies/$companyId"
                params={{ companyId: company.id }}
                className={rowBody({ kind: 'link' })}
              >
                <span className="min-w-0 truncate">{company.name}</span>
                <RoleBadge role={role} />
              </Link>
            </Row>
          ))}
        </List>
      )}
      <Pager next={data.next} param="page" page={page} list="Empresas" />
    </section>
  )
}
