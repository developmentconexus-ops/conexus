import { createFileRoute, Link } from '@tanstack/react-router'
import {
  BACK_TO_CONCEPTS,
  CONCEPT_GONE,
  ConceptDetail,
  ConceptSearch,
  conceptParams,
  loadConcept,
} from '../../../../hub/ontology/public.ts'
import { buttonVariants } from '../../../../ui/button.tsx'
import { PageTitle } from '../../../../ui/list.tsx'
import { Loading, RouteReadFailure } from '../../../../ui/states.tsx'

// One concept, its field's codes in the address (web W18); one that does not exist is not found (web W34).
export const Route = createFileRoute('/_app/companies/$companyId/knowledge/$concept')({
  staticData: { place: 'Conhecimento' },
  params: conceptParams,
  validateSearch: ConceptSearch,
  loader: ({ context, params }) => loadConcept(context.queryClient, params),
  pendingComponent: Loading,
  notFoundComponent: ConceptNotFound,
  errorComponent: RouteReadFailure,
  component: ConceptPage,
})

function ConceptNotFound() {
  const { companyId } = Route.useParams()
  return (
    <div className="mx-auto flex w-full max-w-page flex-col items-start gap-md">
      <PageTitle>{CONCEPT_GONE}</PageTitle>
      <Link
        to="/companies/$companyId/knowledge"
        params={{ companyId }}
        className={buttonVariants()}
      >
        {BACK_TO_CONCEPTS}
      </Link>
    </div>
  )
}

function ConceptPage() {
  const { companyId, concept } = Route.useParams()
  const { campo } = Route.useSearch()
  return <ConceptDetail companyId={companyId} concept={concept} field={campo} />
}
