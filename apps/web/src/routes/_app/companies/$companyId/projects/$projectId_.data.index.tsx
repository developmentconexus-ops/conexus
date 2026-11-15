import { createFileRoute } from '@tanstack/react-router'

// No table is open: on a computer, an empty space beside the list; on a phone, the list alone.
export const Route = createFileRoute('/_app/companies/$companyId/projects/$projectId_/data/')({
  staticData: { place: 'Dados' },
  component: () => null,
})
