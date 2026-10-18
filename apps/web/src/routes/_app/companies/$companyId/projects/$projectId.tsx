import { ProjectId } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import { projectQuery } from '../../../../../hub/projects/public.ts'
import { idOrNotFound, readOrNotFound } from '../../../../../platform/hub.ts'

export const Route = createFileRoute('/_app/companies/$companyId/projects/$projectId')({
  params: {
    parse: (raw) => ({ projectId: idOrNotFound(ProjectId, raw.projectId) }),
    stringify: (p) => p,
  },
  loader: ({ context, params }) =>
    readOrNotFound(
      context.queryClient.ensureQueryData(projectQuery(params.companyId, params.projectId)),
    ),
})
