import type { CompanyId, ProjectId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import type { LinkProps } from '@tanstack/react-router'
import { getRouteApi, useMatches, useNavigate } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
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
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem } from '../../ui/sidebar.tsx'
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

type RailItem = {
  to: LinkProps['to']
  label: string
  icon: LucideIcon
  needs?: 'manageAgents' | 'manageAutomations' | 'viewAppData'
  holdsConversations?: true
}

const RAIL: readonly {
  group: 'O app' | 'Agentes' | 'Dados' | 'O Projeto'
  items: readonly RailItem[]
}[] = [
  {
    group: 'O app',
    items: [
      {
        to: '/companies/$companyId/projects/$projectId',
        label: 'Construir',
        icon: HammerIcon,
        holdsConversations: true,
      },
    ],
  },
  {
    group: 'Agentes',
    items: [
      {
        to: '/companies/$companyId/projects/$projectId/assistant',
        label: 'Conversas',
        icon: MessagesSquareIcon,
      },
      {
        to: '/companies/$companyId/projects/$projectId/agents',
        label: 'Agentes',
        icon: BotIcon,
        needs: 'manageAgents',
      },
      {
        to: '/companies/$companyId/projects/$projectId/automations',
        label: 'Automações',
        icon: TimerIcon,
        needs: 'manageAutomations',
      },
    ],
  },
  {
    group: 'Dados',
    items: [
      {
        to: '/companies/$companyId/projects/$projectId/integrations',
        label: 'Integrações',
        icon: PlugIcon,
      },
      {
        to: '/companies/$companyId/projects/$projectId/data',
        label: 'Dados',
        icon: DatabaseIcon,
        needs: 'viewAppData',
      },
    ],
  },
  {
    group: 'O Projeto',
    items: [
      {
        to: '/companies/$companyId/projects/$projectId/access',
        label: 'Quem usa o app',
        icon: UsersIcon,
      },
      { to: '/companies/$companyId/projects/$projectId/about', label: 'Sobre', icon: InfoIcon },
    ],
  },
]

/**
 * The entries of the Projeto's list, beside the rail that carries the way back to the company. Each
 * later entry is added by its step, never as "em breve" (web W31). The address of Construir is the
 * Projeto's own, with its conversations below it: it is the current place while the route it lives
 * under is among the matches.
 */
export function ProjectRailNav(scope: Scope) {
  const { may } = company.useRouteContext()
  const building = useMatches({
    select: (matches) => matches.some((match) => match.routeId === BUILD_ROUTE),
  })
  return (
    <>
      {RAIL.map(({ group, items }) => {
        const seen = items.filter((item) => item.needs === undefined || may[item.needs])
        return (
          <SidebarGroup key={group}>
            <SidebarGroupLabel>{group}</SidebarGroupLabel>
            <SidebarMenu>
              {seen.map((item) => (
                <FrameLink
                  key={item.label}
                  to={item.to}
                  params={scope}
                  icon={item.icon}
                  label={item.label}
                  activeOptions={item.holdsConversations && { exact: true }}
                  current={item.holdsConversations && building}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )
      })}
    </>
  )
}
