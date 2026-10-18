import { createFileRoute, notFound } from '@tanstack/react-router'
import { projectQuery, Settings } from '../../../../../hub/projects/public.ts'

// Those who may not manage versions find no Configurações, as when the Projeto does not exist.
export const Route = createFileRoute('/_app/companies/$companyId/projects/$projectId/settings')({
  staticData: { place: 'Configurações' },
  loader: async ({ context, params }) => {
    const { project } = await context.queryClient.ensureQueryData(
      projectQuery(params.companyId, params.projectId),
    )
    if (!project.mayManageVersions) throw notFound()
  },
  component: Settings,
})
