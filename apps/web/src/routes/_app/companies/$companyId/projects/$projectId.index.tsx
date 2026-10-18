import { createFileRoute } from '@tanstack/react-router'
import { Project } from '../../../../../hub/projects/public.ts'

// The Projeto's page; its read is the parent's loader, shared with Configurações.
export const Route = createFileRoute('/_app/companies/$companyId/projects/$projectId/')({
  staticData: { place: 'Projeto' },
  component: Project,
})
