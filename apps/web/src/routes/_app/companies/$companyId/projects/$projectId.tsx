import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { Workbench } from '../../../../../builder/conversation/public.ts'
import { Preview } from '../../../../../builder/preview/public.ts'
import { Source } from '../../../../../builder/source/public.ts'
import {
  Lens,
  ProjectArea,
  projectParams,
  projectQuery,
  View,
} from '../../../../../hub/projects/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'

// The tab and the Prévia's view are in the address (web W18); a value that is not one of ours is the
// default. The address before step 20 kept Sobre, Versões and Quem usa o app under `?lens=project`
// and `?section=`: this schema still reads them, only for `beforeLoad` to take that address to the
// page that has them now.
const Search = z.object({
  lens: z
    .union([Lens, z.literal('project')])
    .optional()
    .catch(undefined),
  section: z.enum(['about', 'versions', 'access']).optional().catch(undefined),
  view: View.optional().catch(undefined),
})

export const Route = createFileRoute('/_app/companies/$companyId/projects/$projectId')({
  params: projectParams,
  validateSearch: Search,
  beforeLoad: ({ params, search }) => {
    if (search.lens !== 'project') return
    if (search.section === 'access') {
      throw redirect({
        to: '/companies/$companyId/projects/$projectId/access',
        params,
        replace: true,
      })
    }
    throw redirect({
      to: '/companies/$companyId/projects/$projectId/about',
      params,
      search: search.section === 'versions' ? { part: 'versions' } : {},
      replace: true,
    })
  },
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
