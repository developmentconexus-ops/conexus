import { listProjects } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { Projects, projectsQuery } from '../../../../../hub/projects/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'

export const Route = createFileRoute('/_app/companies/$companyId/projects/')({
  staticData: { place: 'Projetos' },
  validateSearch: listProjects.input.query
    .extend({ notice: z.literal('deleted').optional().catch(undefined) })
    .catch({}),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ context, params, deps }) =>
    readOrNotFound(context.queryClient.ensureQueryData(projectsQuery(params.companyId, deps.page))),
  component: Projects,
})
