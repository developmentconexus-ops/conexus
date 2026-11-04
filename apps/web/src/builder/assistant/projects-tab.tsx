import type { CompanyId, ProjectSummary } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ChevronDownIcon } from 'lucide-react'
import { projectsQuery } from '../../hub/projects/public.ts'
import { sentenceOf } from '../../platform/hub.ts'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/collapsible.tsx'
import { SidebarMenu, SidebarMenuSkeleton } from '../../ui/sidebar.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { ConversationRow } from './conversation-row.tsx'
import { narrowedBy } from './list-view.ts'
import { assistantConversationsQuery } from './queries.ts'
import { NO_PROJECT_CONVERSATION, SEE_ALL, WITHOUT_PROJECT } from './text.ts'

/** The newest conversations a group shows before "Ver todas". */
const SHOWN = 5

function Group(props: {
  companyId: CompanyId
  name: string
  project: ProjectSummary['id'] | undefined
}) {
  const narrowed = props.project === undefined ? narrowedBy('HOME') : narrowedBy(props.project)
  const read = useQuery(
    assistantConversationsQuery(props.companyId, narrowed.projectId, undefined, {
      place: narrowed.place,
    }),
  )
  const now = new Date()
  return (
    <Collapsible defaultOpen className="flex flex-col">
      <CollapsibleTrigger className="group/trigger flex h-row items-center gap-xs px-sm text-eyebrow text-text-2">
        <ChevronDownIcon
          aria-hidden="true"
          className="size-3 group-data-closed/trigger:-rotate-90"
        />
        {props.name}
      </CollapsibleTrigger>
      <CollapsibleContent>
        {read.isPending && <SidebarMenuSkeleton />}
        {read.isError && (
          <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
        )}
        {read.data !== undefined && read.data.conversations.length === 0 && (
          <p className="px-sm text-fact text-text-2">{NO_PROJECT_CONVERSATION}</p>
        )}
        {read.data !== undefined && read.data.conversations.length > 0 && (
          <SidebarMenu>
            {read.data.conversations.slice(0, SHOWN).map((conversation) => (
              <ConversationRow
                key={conversation.id}
                companyId={props.companyId}
                conversation={conversation}
                now={now}
              />
            ))}
          </SidebarMenu>
        )}
        {props.project !== undefined && (read.data?.conversations.length ?? 0) > SHOWN && (
          <Link
            to="."
            search={(old) => ({ ...old, place: props.project, tab: undefined })}
            replace
            state={{ keepDrawer: true }}
            className="px-sm text-fact text-text-2"
          >
            {SEE_ALL}
          </Link>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

/** The Projetos tab: a group for each live Projeto with its newest conversations, and "Sem Projeto" last. */
export function ProjectsTab({ companyId }: { companyId: CompanyId }) {
  const projects = useQuery(projectsQuery(companyId, undefined))
  if (projects.isPending) return <SidebarMenuSkeleton />
  if (projects.isError) {
    return <ReadFailure text={sentenceOf(projects.error)} onRetry={() => void projects.refetch()} />
  }
  return (
    <div className="flex flex-col">
      {projects.data.projects.map((project) => (
        <Group key={project.id} companyId={companyId} name={project.name} project={project.id} />
      ))}
      <Group companyId={companyId} name={WITHOUT_PROJECT} project={undefined} />
    </div>
  )
}
