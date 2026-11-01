import type { CompanyId, ProjectId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link, useMatches } from '@tanstack/react-router'
import {
  ArrowLeftIcon,
  ChevronsUpDownIcon,
  HammerIcon,
  InfoIcon,
  PlugIcon,
  UsersIcon,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu.tsx'
import { FrameLink } from '../../ui/frame.tsx'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '../../ui/sidebar.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { companyQuery } from '../identity/public.ts'
import { projectQuery } from './queries.ts'
import { useRecentProjects } from './recent-projects.tsx'

const company = getRouteApi('/_app/companies/$companyId')

/** The route Construir and its conversations live under: the other pages of the Projeto sit beside it, not below. */
const BUILD_ROUTE = '/_app/companies/$companyId/projects/$projectId'

type Scope = { companyId: CompanyId; projectId: ProjectId }

/**
 * The head of the sidebar inside a Projeto: its name, and the person's recent Projects to switch to,
 * then "Todos os projetos" (web W30). While the name loads it is a skeleton; if the read fails it
 * reads "Projeto" and the entries below still work.
 */
export function ProjectRailHead({ companyId, projectId }: Scope) {
  const { isMobile } = useSidebar()
  const { person } = company.useRouteContext()
  const read = useQuery({ ...projectQuery(companyId, projectId), refetchOnMount: false })
  const { recent } = useRecentProjects(companyId, person.id)
  const name = read.isError ? 'Projeto' : read.data?.project.name
  const badge = (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-control bg-ink font-display text-label text-on-ink"
    >
      {(name ?? 'P').trim().charAt(0).toUpperCase()}
    </span>
  )
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<SidebarMenuButton size="lg" className="px-0" />}
            aria-label={`Trocar de Projeto. Agora: ${name ?? 'carregando'}`}
          >
            {badge}
            {name === undefined ? (
              <Skeleton className="h-4 w-3/4" />
            ) : (
              <span className="truncate font-display text-title text-text">{name}</span>
            )}
            <ChevronsUpDownIcon aria-hidden="true" className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side={isMobile ? 'bottom' : 'right'}>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-eyebrow text-text-2 uppercase">
                Projetos recentes
              </DropdownMenuLabel>
              {recent.map((project) => (
                <DropdownMenuLinkItem
                  key={project.id}
                  render={
                    <Link
                      to="/companies/$companyId/projects/$projectId"
                      params={{ companyId, projectId: project.id }}
                    />
                  }
                >
                  <span className="truncate">{project.name}</span>
                </DropdownMenuLinkItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLinkItem
              render={<Link to="/companies/$companyId/projects" params={{ companyId }} />}
            >
              Todos os projetos
            </DropdownMenuLinkItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

/**
 * The entries of the Projeto's sidebar, in the order of Conexus OS: back to the company, Construir,
 * Sobre, Quem usa o app, Integrações. Each later one is added by its step, never as "em breve" (web W31). The
 * address of Construir is the Projeto's own, with its conversations below it: it is the current
 * place while the route it lives under is among the matches.
 */
export function ProjectRailNav(scope: Scope) {
  const { companyId } = scope
  const params = scope
  const { company: house } = useQuery(companyQuery(companyId)).data ?? {}
  const building = useMatches({
    select: (matches) => matches.some((match) => match.routeId === BUILD_ROUTE),
  })
  return (
    <SidebarGroup>
      <SidebarMenu>
        <FrameLink
          to="/companies/$companyId"
          params={{ companyId }}
          activeOptions={{ exact: true }}
          icon={ArrowLeftIcon}
          label={house?.name ?? 'Empresa'}
        />
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Construir"
            aria-current={building ? 'page' : undefined}
            data-status={building ? 'active' : undefined}
            render={
              <Link
                to="/companies/$companyId/projects/$projectId"
                params={params}
                activeOptions={{ exact: true }}
              />
            }
          >
            <HammerIcon aria-hidden="true" />
            <span>Construir</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <FrameLink
          to="/companies/$companyId/projects/$projectId/about"
          params={params}
          icon={InfoIcon}
          label="Sobre"
        />
        <FrameLink
          to="/companies/$companyId/projects/$projectId/access"
          params={params}
          icon={UsersIcon}
          label="Quem usa o app"
        />
        <FrameLink
          to="/companies/$companyId/projects/$projectId/integrations"
          params={params}
          icon={PlugIcon}
          label="Integrações"
        />
      </SidebarMenu>
    </SidebarGroup>
  )
}
