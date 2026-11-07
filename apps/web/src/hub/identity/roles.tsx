import type { CompanyId, ConnectorEntry, RoleView } from '@conexus/hub-api'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link, useRouter } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import { sentenceOf } from '../../platform/hub.ts'
import { buttonVariants } from '../../ui/button.tsx'
import { List, Row, rowBody, SectionTitle } from '../../ui/list.tsx'
import { Empty, NotFound, ReadFailure } from '../../ui/states.tsx'
import { connectionsQuery } from '../connectors/public.ts'
import { rolesQuery } from './queries.ts'
import { NewRole, OpenRole } from './role-editor.tsx'
import { summaryOf } from './role-text.ts'

const route = getRouteApi('/_app/companies/$companyId_/settings/roles')

const NO_OWN_ROLES = 'Sua empresa ainda não criou papéis.'
const ROLE_GONE = 'Este papel não existe mais.'

function RoleRow(props: { companyId: CompanyId; role: RoleView; kit: readonly ConnectorEntry[] }) {
  const { role } = props
  const lines = summaryOf(role, props.kit)
  return (
    <Row>
      <Link
        to="/companies/$companyId/settings/roles"
        params={{ companyId: props.companyId }}
        search={{ role: role.role }}
        className={rowBody({ kind: 'link' })}
      >
        <span className="flex min-w-0 flex-1 flex-col gap-xs">
          <span className="font-semibold wrap-anywhere">{role.label}</span>
          {lines.map((line) => (
            <span key={line} className="text-text-2 wrap-anywhere">
              {line}
            </span>
          ))}
        </span>
        <span className="shrink-0 text-label text-text-2">
          {role.members} {role.members === 1 ? 'pessoa' : 'pessoas'}
        </span>
      </Link>
    </Row>
  )
}

function RoleList(props: {
  companyId: CompanyId
  roles: readonly RoleView[]
  kit: readonly ConnectorEntry[]
}) {
  const own = props.roles.filter((one) => one.kind === 'CUSTOM')
  const at = { companyId: props.companyId, kit: props.kit }
  return (
    <div className="flex flex-col gap-xl">
      <section className="flex flex-col gap-lg">
        <div className="flex flex-wrap items-center justify-between gap-md">
          <SectionTitle>Papéis de fábrica</SectionTitle>
          <Link
            to="/companies/$companyId/settings/roles"
            params={{ companyId: props.companyId }}
            search={{ novo: true }}
            className={buttonVariants({ variant: 'primary', size: 'sm' })}
          >
            <PlusIcon aria-hidden="true" className="size-4" />
            Novo papel
          </Link>
        </div>
        <List>
          {props.roles
            .filter((one) => one.kind !== 'CUSTOM')
            .map((one) => (
              <RoleRow key={one.role} role={one} {...at} />
            ))}
        </List>
      </section>
      <section className="flex flex-col gap-lg">
        <SectionTitle>Papéis da empresa</SectionTitle>
        {own.length === 0 ? (
          <Empty>{NO_OWN_ROLES}</Empty>
        ) : (
          <List>
            {own.map((one) => (
              <RoleRow key={one.role} role={one} {...at} />
            ))}
          </List>
        )}
      </section>
    </div>
  )
}

/** Configurações › Papéis: the list, a new role, and a role opened by its name in the address (web W18). */
export function Roles() {
  const { companyId } = route.useParams()
  const search = route.useSearch()
  const router = useRouter()
  const { data } = useSuspenseQuery(rolesQuery(companyId))
  const catalog = useQuery(connectionsQuery(companyId))
  if (catalog.isError) {
    return <ReadFailure text={sentenceOf(catalog.error)} onRetry={() => void catalog.refetch()} />
  }
  const kit = catalog.data?.connectors ?? []
  function back() {
    void router.navigate({
      to: '/companies/$companyId/settings/roles',
      params: { companyId },
      search: {},
    })
  }
  if (search.novo) return <NewRole companyId={companyId} kit={kit} onDone={back} />
  if (search.role !== undefined) {
    const found = data.roles.find((one) => one.role === search.role)
    if (found === undefined) return <NotFound hint={ROLE_GONE} />
    return <OpenRole companyId={companyId} kit={kit} role={found} onDone={back} />
  }
  return <RoleList companyId={companyId} roles={data.roles} kit={kit} />
}
