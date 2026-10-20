import type { CompanyId, PersonId } from '@conexus/hub-api'
import { ProjectId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { FolderIcon, LayoutGridIcon } from 'lucide-react'
import type { RememberedList } from '../../platform/remembered.ts'
import { recall, remember } from '../../platform/remembered.ts'
import { FrameLink } from '../../ui/frame.tsx'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuSkeleton,
} from '../../ui/sidebar.tsx'
import { projectsQuery } from './queries.ts'

const SHOWN = 5

function listOf(companyId: CompanyId): RememberedList<typeof ProjectId> {
  return { name: `projects.${companyId}`, id: ProjectId, keep: SHOWN }
}

export function rememberProject(input: {
  personId: PersonId
  companyId: CompanyId
  projectId: ProjectId
}): void {
  remember({ list: listOf(input.companyId), personId: input.personId, id: input.projectId })
}

/**
 * "Projetos recentes": the Projects opened last in this browser that the Hub still lists, then the
 * first of the list, up to five, and "Todos os projetos" (web W30). Only the list's first page
 * counts. While it loads, a skeleton; with no Projeto or a failed read, the group is not shown.
 */
export function RecentProjects(props: { companyId: CompanyId; personId: PersonId }) {
  const { companyId } = props
  const read = useQuery(projectsQuery(companyId, undefined))
  if (read.isError || read.data?.projects.length === 0) return null
  const listed = read.data?.projects ?? []
  const opened = recall({ list: listOf(companyId), personId: props.personId })
  const recent = [
    ...opened.flatMap((id) => listed.filter((project) => project.id === id)),
    ...listed.filter((project) => !opened.includes(project.id)),
  ].slice(0, SHOWN)
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Projetos recentes</SidebarGroupLabel>
      <SidebarMenu>
        {read.isPending ? (
          <>
            <SidebarMenuSkeleton />
            <SidebarMenuSkeleton />
          </>
        ) : (
          recent.map((project) => (
            <FrameLink
              key={project.id}
              to="/companies/$companyId/projects/$projectId"
              params={{ companyId, projectId: project.id }}
              icon={FolderIcon}
              label={project.name}
            />
          ))
        )}
        <FrameLink
          to="/companies/$companyId/projects"
          params={{ companyId }}
          activeOptions={{ exact: true }}
          icon={LayoutGridIcon}
          label="Todos os projetos"
        />
      </SidebarMenu>
    </SidebarGroup>
  )
}
