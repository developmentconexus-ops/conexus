import type { CompanyId, ProjectId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link, useMatches, useNavigate } from '@tanstack/react-router'
import {
  BotIcon,
  DatabaseIcon,
  HammerIcon,
  InfoIcon,
  MessagesSquareIcon,
  PlugIcon,
  TimerIcon,
  UsersIcon,
} from 'lucide-react'
import { FrameLink } from '../../ui/frame.tsx'
import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../../ui/sidebar.tsx'
import { SidebarSwitch } from '../../ui/sidebar-selector.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ProjectPicker } from './project-picker.tsx'
import { projectQuery } from './queries.ts'
import { PROJECT_FALLBACK } from './text.ts'

const company = getRouteApi('/_app/companies/$companyId')

/** The route Construir and its conversations live under: the other pages of the Projeto sit beside it, not below. */
const BUILD_ROUTE = '/_app/companies/$companyId/projects/$projectId'

type Scope = { companyId: CompanyId; projectId: ProjectId }

const ALL = 'ALL'

/**
 * The head of the sidebar inside a Projeto: its name, and the list to switch to another, with the
 * person's recent Projects first, then "Todos os projetos" (web W30). While the name loads it is a
 * skeleton; if the read fails it reads "Projeto" and the entries below still work.
 */
export function ProjectRailHead({ companyId, projectId }: Scope) {
  const { person } = company.useRouteContext()
  const navigate = useNavigate()
  const read = useQuery({ ...projectQuery(companyId, projectId), refetchOnMount: false })
  const name = read.isError ? PROJECT_FALLBACK : read.data?.project.name
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <ProjectPicker<typeof ALL>
          companyId={companyId}
          label={`Trocar de Projeto. Agora: ${name ?? 'carregando'}`}
          trigger={() => (
            <SidebarSwitch
              icon={(name ?? 'P').trim().charAt(0).toUpperCase()}
              title={name === undefined ? <Skeleton className="h-4 w-3/4" /> : name}
            />
          )}
          value={projectId}
          onPick={(value) =>
            void (value === ALL
              ? navigate({ to: '/companies/$companyId/projects', params: { companyId } })
              : navigate({
                  to: '/companies/$companyId/projects/$projectId',
                  params: { companyId, projectId: value },
                }))
          }
          before={[]}
          after={[{ value: ALL, label: 'Todos os projetos' }]}
          recentFor={person.id}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

/**
 * The entries of the Projeto's list, beside the rail that carries the way back to the company:
 * Construir, Conversas, Agentes, Automações, Sobre, Quem usa o app, Integrações, Dados. Each later one is added by its step, never as "em breve" (web W31). The
 * address of Construir is the Projeto's own, with its conversations below it: it is the current
 * place while the route it lives under is among the matches.
 */
export function ProjectRailNav(scope: Scope) {
  const params = scope
  const { may } = company.useRouteContext()
  const building = useMatches({
    select: (matches) => matches.some((match) => match.routeId === BUILD_ROUTE),
  })
  return (
    <SidebarGroup>
      <SidebarMenu>
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
          to="/companies/$companyId/projects/$projectId/assistant"
          params={params}
          icon={MessagesSquareIcon}
          label="Conversas"
        />
        {may.manageAgents && (
          <FrameLink
            to="/companies/$companyId/projects/$projectId/agents"
            params={params}
            icon={BotIcon}
            label="Agentes"
          />
        )}
        {may.manageAutomations && (
          <FrameLink
            to="/companies/$companyId/projects/$projectId/automations"
            params={params}
            icon={TimerIcon}
            label="Automações"
          />
        )}
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
        {may.viewAppData && (
          <FrameLink
            to="/companies/$companyId/projects/$projectId/data"
            params={params}
            icon={DatabaseIcon}
            label="Dados"
          />
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
