import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import {
  AboutPage,
  AboutPart,
  projectParams,
  projectQuery,
} from '../../../../../hub/projects/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'

// Outside the Construir's workbench (a route that is not nested), Sobre has the whole page; the
// part is in the address (web W18).
export const Route = createFileRoute('/_app/companies/$companyId/projects/$projectId_/about')({
  staticData: { place: 'Sobre' },
  params: projectParams,
  validateSearch: z.object({ part: AboutPart.optional().catch(undefined) }),
  loader: ({ context, params }) =>
    readOrNotFound(
      context.queryClient.ensureQueryData(projectQuery(params.companyId, params.projectId)),
    ),
  component: AboutPage,
})
