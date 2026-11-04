import type { CompanyId } from '@conexus/hub-api'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import { projectsPagedQuery } from '../../hub/projects/public.ts'
import { sentenceOf } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { buttonVariants } from '../../ui/button.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu.tsx'
import { MORE_PROJECTS, NEW_AGENT, NEW_AGENT_WHERE, NO_PROJECTS_FOR_AGENT } from './text.ts'

/**
 * **Novo agente** at Início: no agent lives outside a Projeto, so it asks which one and goes to that
 * Projeto's Agentes area, where the Construtor begins the conversation.
 */
export function NewAgent({ companyId }: { companyId: CompanyId }) {
  const read = useInfiniteQuery(projectsPagedQuery(companyId))
  const projects = read.data?.pages.flatMap((page) => page.projects) ?? []
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={buttonVariants({ variant: 'primary' })}>
        <PlusIcon aria-hidden="true" />
        {NEW_AGENT}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            {projects.length === 0 && read.isSuccess ? NO_PROJECTS_FOR_AGENT : NEW_AGENT_WHERE}
          </DropdownMenuLabel>
          {projects.map((project) => (
            <DropdownMenuLinkItem
              key={project.id}
              render={
                <Link
                  to="/companies/$companyId/projects/$projectId/agents"
                  params={{ companyId, projectId: project.id }}
                />
              }
            >
              {project.name}
            </DropdownMenuLinkItem>
          ))}
          {read.hasNextPage && (
            <DropdownMenuItem
              closeOnClick={false}
              disabled={read.isFetchingNextPage}
              onClick={() => void read.fetchNextPage()}
            >
              {MORE_PROJECTS}
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        {read.isError && (
          <Alert tone="danger" className="px-sm py-xs">
            {sentenceOf(read.error)}
          </Alert>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
