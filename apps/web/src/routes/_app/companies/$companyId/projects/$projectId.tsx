import { ProjectId } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { z } from 'zod'
import { Workbench } from '../../../../../builder/conversation/public.ts'
import { Preview } from '../../../../../builder/preview/public.ts'
import { Source } from '../../../../../builder/source/public.ts'
import { Lens, ProjectArea, projectQuery, Section } from '../../../../../hub/projects/public.ts'
import { idOrNotFound, readOrNotFound } from '../../../../../platform/hub.ts'

// The tab and the section are in the address (web W18); a value that is not one of ours is the default.
const Search = z.object({
  lens: Lens.optional().catch(undefined),
  section: Section.optional().catch(undefined),
})

export const Route = createFileRoute('/_app/companies/$companyId/projects/$projectId')({
  params: {
    parse: (raw) => ({ projectId: idOrNotFound(ProjectId, raw.projectId) }),
    stringify: (p) => p,
  },
  validateSearch: Search,
  loader: ({ context, params }) =>
    readOrNotFound(
      context.queryClient.ensureQueryData(projectQuery(params.companyId, params.projectId)),
    ),
  component: ProjectPage,
})

function ProjectPage() {
  const { companyId, projectId } = Route.useParams()
  const { project } = useSuspenseQuery(projectQuery(companyId, projectId)).data
  return (
    <Workbench
      title={project.name}
      area={
        <ProjectArea
          preview={(project, reloads, reload) => (
            <Preview project={project} reloads={reloads} onReload={reload} />
          )}
          code={<Source />}
        />
      }
      panel={<Outlet />}
    />
  )
}
