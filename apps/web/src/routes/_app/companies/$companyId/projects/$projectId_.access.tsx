import { createFileRoute } from '@tanstack/react-router'
import { Access, projectParams, projectQuery } from '../../../../../hub/projects/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'

// Like Sobre, a page of its own beside the Construir's workbench.
export const Route = createFileRoute('/_app/companies/$companyId/projects/$projectId_/access')({
  staticData: { place: 'Quem usa o app' },
  params: projectParams,
  loader: ({ context, params }) =>
    readOrNotFound(
      context.queryClient.ensureQueryData(projectQuery(params.companyId, params.projectId)),
    ),
  component: AccessPage,
})

function AccessPage() {
  const { companyId, projectId } = Route.useParams()
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-xl">
      <Access companyId={companyId} projectId={projectId} />
    </div>
  )
}
