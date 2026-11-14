import type { CompanyId } from '@conexus/hub-api'
import { ConceptKey } from '@conexus/hub-api'
import type { QueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { idOrNotFound, readOrNotFound } from '../../platform/hub.ts'
import { TABS } from './knowledge.tsx'
import { conceptQuery, ontologyQuery } from './queries.ts'

export { ConceptDetail } from './concept-page.tsx'
export { Knowledge } from './knowledge.tsx'
export { openProposalsQuery } from './queries.ts'
export {
  BACK_TO_CONCEPTS,
  CONCEPT_GONE,
  NOTHING_TO_PROPOSE,
  PROPOSAL_DECIDED,
  REVIEW_AND_APPROVE,
} from './text.ts'

/** The tab of Conhecimento, in the address (web W18): Conceitos when it names none. */
export const KnowledgeSearch = z.object({
  aba: z.enum(TABS).optional().catch(undefined),
})

/** A concept's page opens a field's codes by `?campo=` (web W18). */
export const ConceptSearch = z.object({ campo: z.string().optional().catch(undefined) })

/** The `$concept` of the page route: a key the contract would never issue is the not-found page. */
export const conceptParams = {
  parse: (raw: { concept: string }) => ({ concept: String(idOrNotFound(ConceptKey, raw.concept)) }),
  stringify: (params: { concept: string }) => params,
}

export function loadKnowledge(queryClient: QueryClient, companyId: CompanyId) {
  return readOrNotFound(queryClient.query(ontologyQuery(companyId)))
}

export function loadConcept(
  queryClient: QueryClient,
  open: { companyId: CompanyId; concept: string },
) {
  return readOrNotFound(queryClient.query(conceptQuery(open.companyId, open.concept)))
}
