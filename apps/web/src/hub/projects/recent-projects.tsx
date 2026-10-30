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
import { NewProjectDialog } from './new-project-dialog.tsx'
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
 * The Projects opened last in this browser that the Hub still lists, then the first of the list, up
 * to five. Only the list's first page counts.
 */
export function useRecentProjects(companyId: CompanyId, personId: PersonId) {
  const read = useQuery(projectsQuery(companyId, undefined))
  const listed = read.data?.projects ?? []
  const opened = recall({ list: listOf(companyId), personId })
  const recent = [
    ...opened.flatMap((id) => listed.filter((project) => project.id === id)),
    ...listed.filter((project) => !opened.includes(project.id)),
  ].slice(0, SHOWN)
  return { read, recent }
}

/**
 * "Projetos recentes" and "Todos os projetos" (web W30). While the list loads, a skeleton; with a
 * failed read, the group is not shown; with no Projeto it keeps the **+** and says so quietly, since
 * the + is where a person creates the first one.
 */
export function RecentProjects(props: { companyId: CompanyId; personId: PersonId }) {
  const { companyId } = props
  const { read, recent } = useRecentProjects(companyId, props.personId)
  if (read.isError) return null
  const empty = read.isSuccess && read.data.projects.length === 0
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Projetos recentes</SidebarGroupLabel>
      <NewProjectDialog companyId={companyId} />
      {empty ? (
        <p className="px-[0.6rem] py-xs text-label text-text-2 group-data-[collapsible=icon]:hidden">
          Sem projetos por enquanto.
        </p>
      ) : (
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
      )}
    </SidebarGroup>
  )
}
