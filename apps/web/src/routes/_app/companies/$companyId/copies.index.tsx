import { createFileRoute } from '@tanstack/react-router'
import { CopyList, loadCopies, manageCopiesOrNotFound } from '../../../../hub/copies/public.ts'
import { Loading, RouteReadFailure } from '../../../../ui/states.tsx'

// The company's copies, for whoever manages them; anyone else's address is not found (web W34, S10).
export const Route = createFileRoute('/_app/companies/$companyId/copies/')({
  staticData: { place: 'Cópias' },
  beforeLoad: manageCopiesOrNotFound,
  loader: ({ context, params }) => loadCopies(context.queryClient, params.companyId),
  pendingComponent: Loading,
  errorComponent: RouteReadFailure,
  component: CopiesPage,
})

function CopiesPage() {
  const { companyId } = Route.useParams()
  return <CopyList companyId={companyId} />
}
