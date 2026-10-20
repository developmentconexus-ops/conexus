import { ProjectId } from '@conexus/hub-api'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { z } from 'zod'
import { Stage, Workbench } from '../../../../../builder/conversation/public.ts'
import { ProjectArea, projectQuery } from '../../../../../hub/projects/public.ts'
import { idOrNotFound, readOrNotFound } from '../../../../../platform/hub.ts'

// The tab and the section are in the address (web W18); a value that is not one of ours is the default.
const Search = z.object({
  lens: z.enum(['preview', 'project']).optional().catch(undefined),
  section: z.enum(['about', 'versions']).optional().catch(undefined),
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
  component: () => <Workbench area={<ProjectArea preview={<Stage />} />} panel={<Outlet />} />,
})
