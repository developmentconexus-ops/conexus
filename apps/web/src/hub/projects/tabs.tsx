import { getRouteApi, Link, Outlet } from '@tanstack/react-router'

const route = getRouteApi('/_app/companies/$companyId/projects/$projectId')
const TAB =
  'flex h-[34px] items-center rounded-control px-md text-label text-text-2 hover:bg-accent-soft hover:text-text data-[status=active]:bg-surface-3 data-[status=active]:text-text'

/** The tabs of a Projeto, "Projeto" and "Conversa", over the page of the one that is open. */
export function ProjectTabs() {
  const { companyId, projectId } = route.useParams()
  const params = { companyId, projectId }
  return (
    <div className="flex flex-col gap-xl">
      <nav aria-label="Projeto" className="flex gap-sm">
        <Link
          to="/companies/$companyId/projects/$projectId"
          params={params}
          activeOptions={{ exact: true }}
          className={TAB}
        >
          Projeto
        </Link>
        <Link
          to="/companies/$companyId/projects/$projectId/conversations"
          params={params}
          className={TAB}
        >
          Conversa
        </Link>
      </nav>
      <Outlet />
    </div>
  )
}
